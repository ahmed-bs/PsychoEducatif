import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { DropdownModule } from 'primeng/dropdown';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
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
    DropdownModule,
    SelectButtonModule,
    ToggleButtonModule,
    TooltipModule,
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
      // Update filter statuses when language changes
      this.updateFilterStatuses();
    });
  }

  ngOnInit(): void {
    this.profileId = parseInt(localStorage.getItem('selectedChildId') || '1', 10);
    
    // Initialize filter statuses after translations are ready
    this.updateFilterStatuses();
    
    this.loadSummaryData();
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  private updateFilterStatuses() {
    // Wait for translations to be ready
    this.translate.get([
      'skills_summary.status_labels.ALL',
      'skills_summary.status_labels.ACQUIS',
      'skills_summary.status_labels.PARTIEL',
      'skills_summary.status_labels.NON_ACQUIS',
      'skills_summary.status_labels.NON_COTE'
    ]).subscribe(translations => {
      this.filterStatuses = [
        { label: translations['skills_summary.status_labels.ALL'], value: 'ALL' },
        { label: translations['skills_summary.status_labels.ACQUIS'], value: 'ACQUIS' },
        { label: translations['skills_summary.status_labels.PARTIEL'], value: 'PARTIEL' },
        { label: translations['skills_summary.status_labels.NON_ACQUIS'], value: 'NON_ACQUIS' },
        { label: translations['skills_summary.status_labels.NON_COTE'], value: 'NON_COTE' }
      ];
    });
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
            profile_domain_name: item.profile_domain_name || result.domains.find(d => d.id === item.profile_domain)?.name || 'Unknown Domain'
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
    const translationKey = 'skills_summary.status_labels.' + etat;
    return this.translate.instant(translationKey) || this.translate.instant('skills_summary.status_labels.NON_COTE');
  }

  exportExcel(): void {
    import('xlsx').then((xlsx) => {
      // Create headers for the Excel file
      const headers = [
        this.translate.instant('skills_summary.export.category'),
        this.translate.instant('skills_summary.export.total_domains'),
        this.translate.instant('skills_summary.export.total_items'),
        this.translate.instant('skills_summary.export.overall_progress'),
        this.translate.instant('skills_summary.export.domains_info')
      ];

      // Create data rows
      const exportData = this.categoryDataForTable.map(category => {
        // Create a formatted string for domains information
        const domainsInfo = category.domains.map(domain => 
          `${domain.domain}: ${domain.totalItems} items (${domain.acquired} acquired, ${domain.partial} partial, ${domain.notAcquired} not acquired, ${domain.notEvaluated} not evaluated) - ${domain.progressPercentage}%`
        ).join('; ');

        return [
          category.category,
          category.totalDomains,
          category.totalItemsOverall,
          `${category.overallProgress}%`,
          domainsInfo
        ];
      });

      // Add headers to the beginning of the data
      const finalData = [headers, ...exportData];

      const worksheet = xlsx.utils.aoa_to_sheet(finalData);
      const workbook = { Sheets: { 'Skills Summary': worksheet }, SheetNames: ['Skills Summary'] };
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
    // For Arabic text support, we'll use a different approach
    // Since jsPDF has issues with Arabic text, we'll create a simpler PDF
    // that focuses on data rather than complex formatting
    
    const doc = new jsPDF('p', 'pt', 'a4');
    
    let yPosition = 40;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 40;

    // For Arabic text, we'll use a different strategy
    // We'll create a bilingual report or use English labels for better compatibility
    const isArabic = this.translate.currentLang === 'ar';
    
    // Helper function to get compatible text
    const getCompatibleText = (key: string, fallback: string = ''): string => {
      if (isArabic) {
        // For Arabic, we'll use English labels to avoid encoding issues
        // This is a temporary solution - in production, you'd want proper Arabic font support
        const englishLabels: { [key: string]: string } = {
          'skills_summary.export.title': 'Skills Summary Report',
          'skills_summary.export.category': 'Category',
          'skills_summary.export.domain': 'Domain',
          'skills_summary.export.total_items': 'Total Items',
          'skills_summary.export.acquired': 'Acquired',
          'skills_summary.export.partial': 'Partial',
          'skills_summary.export.not_acquired': 'Not Acquired',
          'skills_summary.export.not_evaluated': 'Not Evaluated',
          'skills_summary.export.overall_progress': 'Overall Progress',
          'skills_summary.export.progress': 'Progress'
        };
        return englishLabels[key] || fallback;
      }
      return this.translate.instant(key) || fallback;
    };

    // Add title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const title = getCompatibleText('skills_summary.export.title', 'Skills Summary Report');
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, yPosition);
    yPosition += 30;

    this.categoryDataForTable.forEach((category, categoryIndex) => {
      // Check if we need a new page
      if (yPosition > doc.internal.pageSize.height - 200) {
        doc.addPage();
        yPosition = 40;
      }

      // Category header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const categoryText = `${getCompatibleText('skills_summary.export.category')}: ${category.category}`;
      doc.text(categoryText, margin, yPosition);
      yPosition += 20;

      // Overall progress
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const progressText = `${getCompatibleText('skills_summary.export.overall_progress')}: ${category.overallProgress}%`;
      doc.text(progressText, margin, yPosition);
      yPosition += 30;

      // Prepare table data
      const tableData = category.domains.map(domain => [
        domain.domain,
        domain.totalItems.toString(),
        domain.acquired.toString(),
        domain.partial.toString(),
        domain.notAcquired.toString(),
        domain.notEvaluated.toString(),
        `${domain.progressPercentage}%`
      ]);

      // Create table
      autoTable(doc, {
        startY: yPosition,
        head: [[
          getCompatibleText('skills_summary.export.domain'),
          getCompatibleText('skills_summary.export.total_items'),
          getCompatibleText('skills_summary.export.acquired'),
          getCompatibleText('skills_summary.export.partial'),
          getCompatibleText('skills_summary.export.not_acquired'),
          getCompatibleText('skills_summary.export.not_evaluated'),
          getCompatibleText('skills_summary.export.progress')
        ]],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [0, 123, 255],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 10,
          font: 'helvetica'
        },
        margin: { top: yPosition, left: margin, right: margin },
        styles: {
          font: 'helvetica',
          fontSize: 10,
          cellPadding: 5
        },
        columnStyles: {
          0: { cellWidth: 80 }, // Domain column
          1: { cellWidth: 30 }, // Total items
          2: { cellWidth: 30 }, // Acquired
          3: { cellWidth: 30 }, // Partial
          4: { cellWidth: 35 }, // Not acquired
          5: { cellWidth: 35 }, // Not evaluated
          6: { cellWidth: 30 }  // Progress
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    });

    // Add a note about Arabic text if needed
    if (isArabic) {
      yPosition += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Note: This report uses English labels for better PDF compatibility.', margin, yPosition);
    }

    // Save with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    doc.save(`skills_summary_${timestamp}.pdf`);
  }
}