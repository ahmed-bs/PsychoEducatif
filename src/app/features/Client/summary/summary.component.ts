import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
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
export class SummaryComponent implements OnInit {
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

  constructor(
    private profileItemService: ProfileItemService,
    private profileCategoryService: ProfileCategoryService,
    private profileDomainService: ProfileDomainService,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {
    // Initialize translation
    this.translate.addLangs(['fr', 'ar']);
    this.translate.setDefaultLang('ar');
    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang?.match(/fr|ar/) ? browserLang : 'ar');

    // Initialize filterStatuses with translated labels
    this.filterStatuses = [
      { label: this.translate.instant('skills_summary.status_labels.ALL'), value: 'ALL' },
      { label: this.translate.instant('skills_summary.status_labels.ACQUIS'), value: 'ACQUIS' },
      { label: this.translate.instant('skills_summary.status_labels.PARTIEL'), value: 'PARTIEL' },
      { label: this.translate.instant('skills_summary.status_labels.NON_ACQUIS'), value: 'NON_ACQUIS' },
      { label: this.translate.instant('skills_summary.status_labels.NON_COTE'), value: 'NON_COTE' }
    ];

    // Initialize exportItems with translated labels
    this.exportItems = [
      {
        label: this.translate.instant('skills_summary.export_items.excel'),
        icon: 'pi pi-file-excel',
        command: () => this.exportExcel()
      },
      {
        label: this.translate.instant('skills_summary.export_items.pdf'),
        icon: 'pi pi-file-pdf',
        command: () => this.exportPdf()
      }
    ];
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('childId');
      if (id) {
        this.profileId = +id;
      }
      this.loadSummaryData();
    });
  }

  toggleMenu(event: Event) {
    this.menu?.toggle(event);
  }

  loadSummaryData(): void {
    this.isLoading = true;
    this.error = null;

    this.profileCategoryService.getCategories(this.profileId).pipe(
      switchMap((categories) => {
        if (categories.length === 0) {
          return of([]);
        }

        const categoryMap = new Map<number, string>();
        categories.forEach((cat) => categoryMap.set(cat.id!, cat.name || this.translate.instant('skills_summary.table.unknown_category')));

        const categoryDomainItemRequests = categories.map((category) =>
          this.profileDomainService.getDomains(category.id!).pipe(
            switchMap((domains) => {
              if (domains.length === 0) {
                return of({ categoryId: category.id, categoryName: category.name, domains: [], items: [] });
              }
              const domainMap = new Map<number, string>();
              domains.forEach((dom) => domainMap.set(dom.id, dom.name || this.translate.instant('skills_summary.table.unknown_domain')));

              const itemRequests = domains.map((domain) =>
                this.profileItemService.getItems(domain.id).pipe(
                  map((items) =>
                    items.map((item) => ({
                      ...item,
                      profile_category_name: categoryMap.get(category.id!)!,
                      profile_domain_name: domainMap.get(domain.id)!,
                    }))
                  ),
                  catchError((error) => {
                    console.error(`Error loading items for domain ${domain.id}`, error);
                    return of([]);
                  })
                )
              );
              return forkJoin(itemRequests).pipe(
                map((itemsArrays) => ({
                  categoryId: category.id,
                  categoryName: category.name,
                  domains: domains,
                  items: itemsArrays.flat(),
                }))
              );
            }),
            catchError((error) => {
              console.error(`Error loading domains for category ${category.id}`, error);
              return of({ categoryId: category.id, categoryName: category.name, domains: [], items: [] });
            })
          )
        );
        return forkJoin(categoryDomainItemRequests);
      })
    ).subscribe({
      next: (results) => {
        this.originalCategoryDataForTable = this.processRawDataIntoTableStructure(results);
        this.applyFilter();
        this.isLoading = false;

        this.originalCategoryDataForTable.forEach(category => {
          category.domains.forEach(domain => {
            this.domainItemsVisibility[domain.domain] = false;
          });
        });
      },
      error: (error) => {
        console.error('Error loading summary data:', error);
        this.translate.get('skills_summary.load_summary_error.text').subscribe(text => {
          this.error = text;
        });
        this.isLoading = false;
      },
    });
  }

  processCategoryAndDomainDataForTable(rawData: any[]): void {
    const categoryDataMap: { [categoryName: string]: CategoryTableRow } = {};

    rawData.forEach(categoryResult => {
      const categoryName = categoryResult.categoryName || this.translate.instant('skills_summary.table.unknown_category');
      const categoryId = categoryResult.categoryId;

      if (!categoryDataMap[categoryName]) {
        categoryDataMap[categoryName] = {
          category: categoryName,
          id: categoryId,
          totalDomains: 0,
          totalItemsOverall: 0,
          overallProgress: 0,
          domains: [],
        };
      }

      const currentCategoryData = categoryDataMap[categoryName];
      currentCategoryData.totalDomains += categoryResult.domains.length;

      const domainSummaryMap: { [domainName: string]: DomainTableRow } = {};

      categoryResult.items.forEach((item: ProfileItem) => {
        const domainName = item.profile_domain_name || this.translate.instant('skills_summary.table.unknown_domain');
        const domainKey = `${domainName}`;

        if (!domainSummaryMap[domainKey]) {
          domainSummaryMap[domainKey] = {
            domain: domainName,
            totalItems: 0,
            acquired: 0,
            partial: 0,
            notAcquired: 0,
            notEvaluated: 0,
            progressPercentage: 0,
            profileItems: []
          };
        }

        const currentDomainData = domainSummaryMap[domainKey];
        currentDomainData.totalItems++;

        switch (item.etat) {
          case 'ACQUIS':
            currentDomainData.acquired++;
            break;
          case 'PARTIEL':
            currentDomainData.partial++;
            break;
          case 'NON_ACQUIS':
            currentDomainData.notAcquired++;
            break;
          case 'NON_COTE':
            currentDomainData.notEvaluated++;
            break;
        }
      });

      const domainsWithProgress = Object.values(domainSummaryMap).map(domainData => {
        const acquiredCount = domainData.acquired;
        const partialCount = domainData.partial;
        const totalCount = domainData.totalItems;
        const progressPercentage = totalCount > 0 ? Math.round(((acquiredCount + partialCount * 0.5) / totalCount) * 100) : 0;
        return { ...domainData, progressPercentage };
      });

      currentCategoryData.domains = domainsWithProgress;

      const categoryTotalItems = domainsWithProgress.reduce((sum, d) => sum + d.totalItems, 0);
      const categoryAcquiredItems = domainsWithProgress.reduce((sum, d) => sum + d.acquired, 0);
      const categoryPartialItems = domainsWithProgress.reduce((sum, d) => sum + d.partial, 0);

      currentCategoryData.totalItemsOverall = categoryTotalItems;
      currentCategoryData.overallProgress = categoryTotalItems > 0
        ? Math.round(((categoryAcquiredItems + categoryPartialItems * 0.5) / categoryTotalItems) * 100)
        : 0;
    });

    this.categoryDataForTable = Object.values(categoryDataMap);
  }

  processRawDataIntoTableStructure(rawData: any[]): CategoryTableRow[] {
    const categoryDataMap: { [categoryName: string]: CategoryTableRow } = {};
    const allProfileItems: ProfileItem[] = [];

    rawData.forEach(categoryResult => {
      const categoryName = categoryResult.categoryName || this.translate.instant('skills_summary.table.unknown_category');
      const categoryId = categoryResult.categoryId;

      if (!categoryDataMap[categoryName]) {
        categoryDataMap[categoryName] = {
          category: categoryName,
          id: categoryId,
          totalDomains: 0,
          totalItemsOverall: 0,
          overallProgress: 0,
          domains: [],
        };
      }

      const currentCategoryData = categoryDataMap[categoryName];
      currentCategoryData.totalDomains = categoryResult.domains.length;

      const domainMapWithItems: { [domainName: string]: DomainTableRow & { rawItems: ProfileItem[] } } = {};

      categoryResult.items.forEach((item: ProfileItem) => {
        const domainName = item.profile_domain_name || this.translate.instant('skills_summary.table.unknown_domain');
        const domainKey = `${domainName}`;

        if (!domainMapWithItems[domainKey]) {
          domainMapWithItems[domainKey] = {
            domain: domainName,
            totalItems: 0,
            acquired: 0,
            partial: 0,
            notAcquired: 0,
            notEvaluated: 0,
            progressPercentage: 0,
            profileItems: [],
            rawItems: [],
          };
        }
        domainMapWithItems[domainKey].rawItems.push(item);
      });

      const domainsWithCountsAndItems: DomainTableRow[] = Object.values(domainMapWithItems).map(domainData => {
        const filteredItems = domainData.rawItems;

        const acquiredCount = filteredItems.filter(item => item.etat === 'ACQUIS').length;
        const partialCount = filteredItems.filter(item => item.etat === 'PARTIEL').length;
        const notAcquiredCount = filteredItems.filter(item => item.etat === 'NON_ACQUIS').length;
        const notEvaluatedCount = filteredItems.filter(item => item.etat === 'NON_COTE').length;
        const totalCount = filteredItems.length;

        const progressPercentage = totalCount > 0 ? Math.round(((acquiredCount + partialCount * 0.5) / totalCount) * 100) : 0;

        return {
          domain: domainData.domain,
          totalItems: totalCount,
          acquired: acquiredCount,
          partial: partialCount,
          notAcquired: notAcquiredCount,
          notEvaluated: notEvaluatedCount,
          progressPercentage: progressPercentage,
          profileItems: filteredItems
        };
      });

      currentCategoryData.domains = domainsWithCountsAndItems;

      const categoryTotalItems = domainsWithCountsAndItems.reduce((sum, d) => sum + d.totalItems, 0);
      const categoryAcquiredItems = domainsWithCountsAndItems.reduce((sum, d) => sum + d.acquired, 0);
      const categoryPartialItems = domainsWithCountsAndItems.reduce((sum, d) => sum + d.partial, 0);

      currentCategoryData.totalItemsOverall = categoryTotalItems;
      currentCategoryData.overallProgress = categoryTotalItems > 0
        ? Math.round(((categoryAcquiredItems + categoryPartialItems * 0.5) / categoryTotalItems) * 100)
        : 0;
    });

    return Object.values(categoryDataMap);
  }

  applyFilter(): void {
    if (this.selectedFilterStatus === 'ALL') {
      this.categoryDataForTable = JSON.parse(JSON.stringify(this.originalCategoryDataForTable));
    } else {
      const filteredData: CategoryTableRow[] = [];
      this.originalCategoryDataForTable.forEach(category => {
        const newCategory: CategoryTableRow = { ...category, domains: [] };

        category.domains.forEach(domain => {
          const filteredItems = domain.profileItems.filter(item => item.etat === this.selectedFilterStatus);

          if (filteredItems.length > 0 || this.selectedFilterStatus === 'ALL') {
            const acquiredCount = filteredItems.filter(item => item.etat === 'ACQUIS').length;
            const partialCount = filteredItems.filter(item => item.etat === 'PARTIEL').length;
            const notAcquiredCount = filteredItems.filter(item => item.etat === 'NON_ACQUIS').length;
            const notEvaluatedCount = filteredItems.filter(item => item.etat === 'NON_COTE').length;
            const totalCount = filteredItems.length;

            const progressPercentage = totalCount > 0 ? Math.round(((acquiredCount + partialCount * 0.5) / totalCount) * 100) : 0;

            newCategory.domains.push({
              ...domain,
              totalItems: totalCount,
              acquired: acquiredCount,
              partial: partialCount,
              notAcquired: notAcquiredCount,
              notEvaluated: notEvaluatedCount,
              progressPercentage: progressPercentage,
              profileItems: filteredItems
            });
          }
        });

        if (newCategory.domains.length > 0 || category.domains.length === 0) {
          const categoryTotalItems = newCategory.domains.reduce((sum, d) => sum + d.totalItems, 0);
          const categoryAcquiredItems = newCategory.domains.reduce((sum, d) => sum + d.acquired, 0);
          const categoryPartialItems = newCategory.domains.reduce((sum, d) => sum + d.partial, 0);

          newCategory.totalItemsOverall = categoryTotalItems;
          newCategory.overallProgress = categoryTotalItems > 0
            ? Math.round(((categoryAcquiredItems + categoryPartialItems * 0.5) / categoryTotalItems) * 100)
            : 0;

          filteredData.push(newCategory);
        }
      });
      this.categoryDataForTable = filteredData;
    }
  }

  toggleDomainItems(domainName: string): void {
    this.domainItemsVisibility[domainName] = !this.domainItemsVisibility[domainName];
  }

  isDomainItemsVisible(domainName: string): boolean {
    return this.domainItemsVisibility[domainName] ?? true;
  }

  getEtatLabel(etat: string): string {
    return this.translate.instant('skills_summary.status_labels.' + etat) || this.translate.instant('skills_summary.status_labels.UNKNOWN');
  }

  exportExcel(): void {
    import('xlsx').then((xlsx) => {
      const exportData: any[] = [];

      this.translate.get([
        'skills_summary.export_content.title',
        'skills_summary.export_content.generated_on',
        'skills_summary.export_content.category_label',
        'skills_summary.export_content.domain_label',
        'skills_summary.export_content.total_items_label',
        'skills_summary.export_content.acquired_label',
        'skills_summary.export_content.partial_label',
        'skills_summary.export_content.not_acquired_label',
        'skills_summary.export_content.not_evaluated_label',
        'skills_summary.export_content.progress_label'
      ], { date: new Date().toLocaleDateString(this.translate.currentLang) }).subscribe(translations => {
        exportData.push({ [translations['skills_summary.export_content.title']]: translations['skills_summary.export_content.generated_on'] });
        exportData.push({});

        this.categoryDataForTable.forEach(category => {
          exportData.push({ [translations['skills_summary.export_content.category_label']]: category.category, '': '', '': '', '': '', '': '', '': '' });
          exportData.push({
            [translations['skills_summary.export_content.category_label']]: '',
            [translations['skills_summary.export_content.domain_label']]: translations['skills_summary.export_content.domain_label'],
            [translations['skills_summary.export_content.total_items_label']]: translations['skills_summary.export_content.total_items_label'],
            [translations['skills_summary.export_content.acquired_label']]: translations['skills_summary.export_content.acquired_label'],
            [translations['skills_summary.export_content.partial_label']]: translations['skills_summary.export_content.partial_label'],
            [translations['skills_summary.export_content.not_acquired_label']]: translations['skills_summary.export_content.not_acquired_label'],
            [translations['skills_summary.export_content.not_evaluated_label']]: translations['skills_summary.export_content.not_evaluated_label'],
            [translations['skills_summary.export_content.progress_label']]: translations['skills_summary.export_content.progress_label']
          });

          category.domains.forEach(domain => {
            exportData.push({
              [translations['skills_summary.export_content.category_label']]: '',
              [translations['skills_summary.export_content.domain_label']]: domain.domain,
              [translations['skills_summary.export_content.total_items_label']]: domain.totalItems,
              [translations['skills_summary.export_content.acquired_label']]: domain.acquired,
              [translations['skills_summary.export_content.partial_label']]: domain.partial,
              [translations['skills_summary.export_content.not_acquired_label']]: domain.notAcquired,
              [translations['skills_summary.export_content.not_evaluated_label']]: domain.notEvaluated,
              [translations['skills_summary.export_content.progress_label']]: domain.progressPercentage + '%',
            });
          });
          exportData.push({});
        });

        const worksheet = xlsx.utils.json_to_sheet(exportData);
        const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
        const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, 'resume_competences');
      });
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
    this.translate.get([
      'skills_summary.export_content.title',
      'skills_summary.export_content.generated_on',
      'skills_summary.export_content.category_label',
      'skills_summary.export_content.domain_label',
      'skills_summary.export_content.total_items_label',
      'skills_summary.export_content.acquired_label',
      'skills_summary.export_content.partial_label',
      'skills_summary.export_content.not_acquired_label',
      'skills_summary.export_content.not_evaluated_label',
      'skills_summary.export_content.progress_label'
    ], { date: new Date().toLocaleDateString(this.translate.currentLang) }).subscribe(translations => {
      doc.text(translations['skills_summary.export_content.title'], 40, 20);
      doc.text(translations['skills_summary.export_content.generated_on'], 40, 40);

      let finalBody: any[] = [];
      this.categoryDataForTable.forEach(category => {
        finalBody.push([{ content: `${translations['skills_summary.export_content.category_label']}: ${category.category}`, colSpan: 8, styles: { fillColor: [224, 242, 247], textColor: [0, 86, 179], fontStyle: 'bold' } }]);

        category.domains.forEach(domain => {
          finalBody.push([
            '',
            domain.domain,
            domain.totalItems.toString(),
            domain.acquired.toString(),
            domain.partial.toString(),
            domain.notAcquired.toString(),
            domain.notEvaluated.toString(),
            domain.progressPercentage + '%',
          ]);
        });
        finalBody.push(['', '', '', '', '', '', '', '']);
      });

      autoTable(doc, {
        startY: 60,
        head: [[
          '',
          translations['skills_summary.export_content.domain_label'],
          translations['skills_summary.export_content.total_items_label'],
          translations['skills_summary.export_content.acquired_label'],
          translations['skills_summary.export_content.partial_label'],
          translations['skills_summary.export_content.not_acquired_label'],
          translations['skills_summary.export_content.not_evaluated_label'],
          translations['skills_summary.export_content.progress_label']
        ]],
        body: finalBody,
        theme: 'striped',
        headStyles: { fillColor: [0, 123, 255] },
        margin: { top: 60 },
        didParseCell: (data) => {
          const cellContent = (data.cell.raw as any)?.content;
          if (data.section === 'body' && typeof cellContent === 'string' && cellContent.startsWith(translations['skills_summary.export_content.category_label'])) {
            data.cell.styles.fillColor = [224, 242, 247];
            data.cell.styles.textColor = [0, 86, 179];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });

      doc.save('resume_competences.pdf');
    });
  }
}