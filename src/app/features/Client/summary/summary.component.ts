import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { DropdownModule } from 'primeng/dropdown';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';

interface DomainTableRow {
  domain: string;
  totalItems: number;
  acquired: number;
  partial: number;
  notAcquired: number;
  notEvaluated: number;
  progressPercentage: number;
  profileItems: ProfileItem[];
}

interface CategoryTableRow {
  category: string;
  id: number;
  totalDomains: number;
  totalItemsOverall: number;
  overallProgress: number;
  domains: DomainTableRow[];
}

@Component({
  standalone: true,
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    ProgressBarModule,
    MenuModule,
    DropdownModule,
    SelectButtonModule,
    ToggleButtonModule,
    TranslateModule
  ],
})
export class SummaryComponent implements OnInit, OnDestroy {
  items: ProfileItem[] = [];
  categoryDataForTable: CategoryTableRow[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  profileId: number = 1;
  expandedCategories: { [key: string]: boolean } = {};
  exportItems: MenuItem[] = [];
  @ViewChild('exportMenu') menu: Menu | undefined;
  filterStatuses: any[] = [];
  selectedFilterStatus: string = 'ALL';
  private originalCategoryDataForTable: CategoryTableRow[] = [];
  domainItemsVisibility: { [domainName: string]: boolean } = {};
  private languageSubscription: Subscription;

  constructor(
    private profileItemService: ProfileItemService,
    private profileCategoryService: ProfileCategoryService,
    private profileDomainService: ProfileDomainService,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
      // Update filter statuses and export items when language changes
      this.updateFilterStatuses();
      this.updateExportItems();
    });

    // Initialize filterStatuses with translated labels
    this.updateFilterStatuses();

    // Initialize exportItems with translated labels
    this.updateExportItems();
  }

  ngOnInit(): void {
    this.profileId = parseInt(localStorage.getItem('selectedChildId') || '1', 10);
    this.loadSummaryData();
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  private updateFilterStatuses() {
    this.filterStatuses = [
      { label: this.translate.instant('skills_summary.status_labels.ALL'), value: 'ALL' },
      { label: this.translate.instant('skills_summary.status_labels.ACQUIS'), value: 'ACQUIS' },
      { label: this.translate.instant('skills_summary.status_labels.PARTIEL'), value: 'PARTIEL' },
      { label: this.translate.instant('skills_summary.status_labels.NON_ACQUIS'), value: 'NON_ACQUIS' },
      { label: this.translate.instant('skills_summary.status_labels.NON_COTE'), value: 'NON_COTE' }
    ];
  }

  private updateExportItems() {
    this.exportItems = [
      {
        label: this.translate.instant('skills_summary.export.excel'),
        icon: 'pi pi-file-excel',
        command: () => this.exportExcel()
      },
      {
        label: this.translate.instant('skills_summary.export.pdf'),
        icon: 'pi pi-file-pdf',
        command: () => this.exportPdf()
      }
    ];
  }

  toggleMenu(event: Event) {
    if (this.menu) {
      this.menu.toggle(event);
    }
  }

  loadSummaryData(): void {
    this.isLoading = true;
    this.error = null;

    this.profileCategoryService.getCategories(this.profileId).pipe(
      switchMap(categories => {
        const categoryRequests = categories.map(category => 
          this.profileDomainService.getDomains(category.id || 0).pipe(
            switchMap(domains => {
              const domainRequests = domains.map(domain => 
                this.profileItemService.getItems(domain.id).pipe(
                  catchError(error => {
                    console.error(`Error loading items for domain ${domain.id}:`, error);
                    return of([]);
                  })
                )
              );
              return forkJoin(domainRequests).pipe(
                map(itemsArrays => {
                  const allItems = itemsArrays.flat();
                  return {
                    category,
                    domains: domains.map((domain, index) => ({
                      ...domain,
                      items: itemsArrays[index] || []
                    })),
                    allItems
                  };
                })
              );
            }),
            catchError(error => {
              console.error(`Error loading domains for category ${category.id}:`, error);
              return of({ category, domains: [], allItems: [] });
            })
          )
        );
        return forkJoin(categoryRequests);
      })
    ).subscribe({
      next: (results) => {
        const rawData = results.flatMap(result => 
          result.allItems.map(item => ({
            ...item,
            profile_category_name: result.category.name,
            profile_domain_name: result.domains.find(d => d.id === item.profile_domain)?.name || 'Unknown Domain'
          }))
        );
        
        this.processCategoryAndDomainDataForTable(rawData);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading summary data:', error);
        this.translate.get('skills_summary.error.load_data_failed').subscribe((text) => {
          this.error = text;
        });
        this.isLoading = false;
      }
    });
  }

  processCategoryAndDomainDataForTable(rawData: any[]): void {
    this.originalCategoryDataForTable = this.processRawDataIntoTableStructure(rawData);
    this.categoryDataForTable = [...this.originalCategoryDataForTable];
  }

  processRawDataIntoTableStructure(rawData: any[]): CategoryTableRow[] {
    const categoryMap = new Map<string, CategoryTableRow>();

    rawData.forEach(item => {
      const categoryName = item.profile_category_name;
      const domainName = item.profile_domain_name;

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          category: categoryName,
          id: item.profile_category_id || 0,
          totalDomains: 0,
          totalItemsOverall: 0,
          overallProgress: 0,
          domains: []
        });
      }

      const category = categoryMap.get(categoryName)!;
      let domain = category.domains.find(d => d.domain === domainName);

      if (!domain) {
        domain = {
          domain: domainName,
          totalItems: 0,
          acquired: 0,
          partial: 0,
          notAcquired: 0,
          notEvaluated: 0,
          progressPercentage: 0,
          profileItems: []
        };
        category.domains.push(domain);
        category.totalDomains++;
      }

      domain.totalItems++;
      category.totalItemsOverall++;

      switch (item.etat) {
        case 'ACQUIS':
          domain.acquired++;
          break;
        case 'PARTIEL':
          domain.partial++;
          break;
        case 'NON_ACQUIS':
          domain.notAcquired++;
          break;
        case 'NON_COTE':
        default:
          domain.notEvaluated++;
          break;
      }

      domain.profileItems.push(item);
    });

    // Calculate progress percentages
    categoryMap.forEach(category => {
      let totalAcquired = 0;
      let totalItems = 0;

      category.domains.forEach(domain => {
        const domainProgress = domain.totalItems > 0 ? (domain.acquired / domain.totalItems) * 100 : 0;
        domain.progressPercentage = Math.round(domainProgress);
        totalAcquired += domain.acquired;
        totalItems += domain.totalItems;
      });

      category.overallProgress = totalItems > 0 ? Math.round((totalAcquired / totalItems) * 100) : 0;
    });

    return Array.from(categoryMap.values());
  }

  applyFilter(): void {
    if (this.selectedFilterStatus === 'ALL') {
      this.categoryDataForTable = [...this.originalCategoryDataForTable];
      return;
    }

    this.categoryDataForTable = this.originalCategoryDataForTable.map(category => ({
      ...category,
      domains: category.domains.map(domain => ({
        ...domain,
        profileItems: domain.profileItems.filter(item => item.etat === this.selectedFilterStatus)
      })).filter(domain => domain.profileItems.length > 0)
    })).filter(category => category.domains.length > 0);
  }

  toggleDomainItems(domainName: string): void {
    this.domainItemsVisibility[domainName] = !this.domainItemsVisibility[domainName];
  }

  isDomainItemsVisible(domainName: string): boolean {
    return this.domainItemsVisibility[domainName] || false;
  }

  getEtatLabel(etat: string): string {
    return this.translate.instant('skills_summary.status_labels.' + etat) || this.translate.instant('skills_summary.status_labels.NON_COTE');
  }

  exportExcel(): void {
    import('xlsx').then((xlsx) => {
      const exportData = this.categoryDataForTable.flatMap(category => {
        const categoryRow = [
          { [this.translate.instant('skills_summary.export.category')]: category.category },
          { [this.translate.instant('skills_summary.export.total_domains')]: category.totalDomains },
          { [this.translate.instant('skills_summary.export.total_items')]: category.totalItemsOverall },
          { [this.translate.instant('skills_summary.export.overall_progress')]: `${category.overallProgress}%` },
          {}
        ];

        const domainRows = category.domains.flatMap(domain => [
          { [this.translate.instant('skills_summary.export.domain')]: domain.domain },
          { [this.translate.instant('skills_summary.export.total_items')]: domain.totalItems },
          { [this.translate.instant('skills_summary.export.acquired')]: domain.acquired },
          { [this.translate.instant('skills_summary.export.partial')]: domain.partial },
          { [this.translate.instant('skills_summary.export.not_acquired')]: domain.notAcquired },
          { [this.translate.instant('skills_summary.export.not_evaluated')]: domain.notEvaluated },
          { [this.translate.instant('skills_summary.export.progress')]: `${domain.progressPercentage}%` },
          {}
        ]);

        return [...categoryRow, ...domainRows];
      });

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, 'skills_summary');
    });
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
  }

  exportPdf(): void {
    const doc = new jsPDF('p', 'pt');
    let yPosition = 20;

    this.categoryDataForTable.forEach(category => {
      doc.text(`${this.translate.instant('skills_summary.export.category')}: ${category.category}`, 40, yPosition);
      yPosition += 20;
      doc.text(`${this.translate.instant('skills_summary.export.overall_progress')}: ${category.overallProgress}%`, 40, yPosition);
      yPosition += 30;

      const tableData = category.domains.map(domain => [
        domain.domain,
        domain.totalItems.toString(),
        domain.acquired.toString(),
        domain.partial.toString(),
        domain.notAcquired.toString(),
        domain.notEvaluated.toString(),
        `${domain.progressPercentage}%`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [[
          this.translate.instant('skills_summary.export.domain'),
          this.translate.instant('skills_summary.export.total_items'),
          this.translate.instant('skills_summary.export.acquired'),
          this.translate.instant('skills_summary.export.partial'),
          this.translate.instant('skills_summary.export.not_acquired'),
          this.translate.instant('skills_summary.export.not_evaluated'),
          this.translate.instant('skills_summary.export.progress')
        ]],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 123, 255] },
        margin: { top: yPosition },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    });

    doc.save('skills_summary.pdf');
  }
}