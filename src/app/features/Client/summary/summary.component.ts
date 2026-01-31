import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { CalendarModule } from 'primeng/calendar';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forkJoin, of, throwError } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';

interface DomainTableRow {
  domain: string;
  domainObject?: any; // Add reference to original domain object for language fields
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
  categoryObject?: any; // Add reference to original category object for language fields
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
    SelectButtonModule,
    ToggleButtonModule,
    TooltipModule,
    TranslateModule,
    PaginatorModule,
    CalendarModule
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
  selectedFilterStatus: string = 'all';
  filterModules: any[] = [];
  selectedFilterModule: string = 'all';
  filterItemStatuses: any[] = [];
  selectedFilterItemStatus: string = 'all';
  startDate: Date | null = null;
  endDate: Date | null = null;
  dateFilterError: string | null = null;
  isSidebarOpen: boolean = false;
  private originalCategoryDataForTable: CategoryTableRow[] = [];
  domainItemsVisibility: { [domainName: string]: boolean } = {};
  currentLanguage: string = 'fr';
  private languageSubscription: Subscription;

  constructor(
    private profileItemService: ProfileItemService,
    private profileCategoryService: ProfileCategoryService,
    private profileDomainService: ProfileDomainService,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize current language - use the same key as SharedService
    this.currentLanguage = localStorage.getItem('lang') || 'fr';
    
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
      this.currentLanguage = lang;
      // Update filter statuses when language changes
      this.updateFilterStatuses();
      // Update module filters when language changes
      this.updateFilterModules();
      // Update item status filters when language changes
      this.updateFilterItemStatuses();
      // Refresh data with new language
      this.refreshDataForLanguage();
    });
  }

  ngOnInit(): void {
    this.profileId = parseInt(localStorage.getItem('selectedChildId') || '1', 10);
    
    // Initialize filter statuses after translations are ready
    this.updateFilterStatuses();
    this.updateFilterItemStatuses();
    
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
      'explore.filter.all',
      'explore.filter.completed',
      'explore.filter.in_progress',
      'explore.filter.not_started'
    ]).subscribe(translations => {
      this.filterStatuses = [
        { label: translations['explore.filter.all'], value: 'all' },
        { label: translations['explore.filter.completed'], value: 'completed' },
        { label: translations['explore.filter.in_progress'], value: 'en_cours' },
        { label: translations['explore.filter.not_started'], value: 'not_started' }
      ];
    });
  }

  private updateFilterModules() {
    // Create module filter options from available categories
    this.filterModules = [
      { label: this.translate.instant('explore.filter.all'), value: 'all' }
    ];
    
    // Add each category as a filter option
    this.originalCategoryDataForTable.forEach(category => {
      this.filterModules.push({
        label: this.getCategoryDisplayName(category),
        value: category.category
      });
    });
  }

  private updateFilterItemStatuses() {
    // Wait for translations to be ready
    this.translate.get([
      'explore.filter.all',
      'skills_summary.filters.item_status.acquired',
      'skills_summary.filters.item_status.not_acquired',
      'skills_summary.filters.item_status.partial'
    ]).subscribe(translations => {
      this.filterItemStatuses = [
        { label: translations['explore.filter.all'], value: 'all' },
        { label: translations['skills_summary.filters.item_status.acquired'], value: 'acquired' },
        { label: translations['skills_summary.filters.item_status.not_acquired'], value: 'not_acquired' },
        { label: translations['skills_summary.filters.item_status.partial'], value: 'partial' }
      ];
    });
  }

  loadSummaryData(): void {
    this.loadSummaryDataWithCallback();
  }

  processCategoryAndDomainDataForTable(rawData: any[]): void {
    this.originalCategoryDataForTable = this.processRawDataIntoTableStructure(rawData);
    this.categoryDataForTable = [...this.originalCategoryDataForTable];
  }

  processRawDataIntoTableStructure(rawData: any[]): CategoryTableRow[] {
    const categoryMap = new Map<string, CategoryTableRow>();

    rawData.forEach(item => {
      // Get language-specific category name
      let categoryName = item.profile_category_name;
      if (this.currentLanguage === 'ar') {
        categoryName = item.profile_category_name_ar || item.profile_category_name;
      } else if (this.currentLanguage === 'en') {
        // For English, try to get from category object first
        if (item.profile_category_object && item.profile_category_object.name_en && item.profile_category_object.name_en.trim() !== '') {
          categoryName = item.profile_category_object.name_en;
        } else if (item.profile_category_name_en && item.profile_category_name_en.trim() !== '') {
          categoryName = item.profile_category_name_en;
        } else {
          categoryName = item.profile_category_name;
        }
      }
      
      // Get language-specific domain name
      // First try to get from the domain object, then from the item's domain name fields
      let domainName = item.profile_domain_name;
      
      if (this.currentLanguage === 'ar') {
        // For Arabic, try to get the Arabic name from the domain object first
        if (item.profile_domain_object && item.profile_domain_object.name_ar && item.profile_domain_object.name_ar.trim() !== '') {
          domainName = item.profile_domain_object.name_ar;
        } else if (item.profile_domain_name_ar && item.profile_domain_name_ar.trim() !== '') {
          domainName = item.profile_domain_name_ar;
        }
      } else if (this.currentLanguage === 'en') {
        // For English, try to get the English name from the domain object first
        if (item.profile_domain_object && item.profile_domain_object.name_en && item.profile_domain_object.name_en.trim() !== '') {
          domainName = item.profile_domain_object.name_en;
        } else if (item.profile_domain_name_en && item.profile_domain_name_en.trim() !== '') {
          domainName = item.profile_domain_name_en;
        }
      }

             if (!categoryMap.has(categoryName)) {
         categoryMap.set(categoryName, {
           category: categoryName,
           categoryObject: item.profile_category_object || null, // Store reference to original category object
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
           domainObject: item.profile_domain_object || null, // Store reference to original domain object
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

  formatDateForApi(date: Date | null): string | null {
    if (!date) {
      return null;
    }
    // Format as YYYY-MM-DD HH:mm:ss for API
    // For start_date, set time to 00:00:00 if not specified
    // For end_date, set time to 23:59:59 if not specified
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    // Return format: YYYY-MM-DD HH:mm:ss
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  onDateChange(): void {
    // Clear error when dates change
    this.dateFilterError = null;
  }

  validateDates(): boolean {
    // Both dates must be filled or both must be empty
    const hasStartDate = this.startDate !== null;
    const hasEndDate = this.endDate !== null;

    if (hasStartDate && !hasEndDate) {
      this.dateFilterError = this.translate.instant('skills_summary.filters.date_error.end_date_required');
      return false;
    }

    if (!hasStartDate && hasEndDate) {
      this.dateFilterError = this.translate.instant('skills_summary.filters.date_error.start_date_required');
      return false;
    }

    // Check if start date is before end date
    if (hasStartDate && hasEndDate && this.startDate! > this.endDate!) {
      this.dateFilterError = this.translate.instant('skills_summary.filters.date_error.start_after_end');
      return false;
    }

    this.dateFilterError = null;
    return true;
  }

  applyDateFilters(): void {
    if (!this.validateDates()) {
      return;
    }

    // Reload data with date filters
    this.loadSummaryData();
  }

  onApplyFilters(): void {
    // First validate dates
    if (!this.validateDates()) {
      return;
    }

    // If dates are valid, reload data with date filters
    // applyFilter() will be called after data is loaded
    this.loadSummaryDataWithCallback(() => {
      this.applyFilter();
    });
  }

  loadSummaryDataWithCallback(callback?: () => void): void {
    this.isLoading = true;
    this.error = null;

    this.profileCategoryService.getCategories(this.profileId).pipe(
      switchMap(categories => {
        const categoryRequests = categories.map(category => 
          this.profileDomainService.getDomains(category.id || 0).pipe(
            switchMap(domains => {
              const domainRequests = domains.map(domain => 
                this.profileItemService.getItems(
                  domain.id, 
                  this.profileId, 
                  this.formatDateForApi(this.startDate),
                  this.formatDateForApi(this.endDate)
                ).pipe(
                  catchError(error => {
                    console.error(`Error loading items for domain ${domain.id}:`, error);
                    // Check for 401 errors
                    const errorStatus = error?.status || error?.originalError?.status;
                    if (errorStatus === 401) {
                      // Propagate 401 errors to be handled at the top level
                      return throwError(() => error);
                    }
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
              // Check for 401 errors
              const errorStatus = error?.status || error?.originalError?.status;
              if (errorStatus === 401) {
                // Propagate 401 errors to be handled at the top level
                return throwError(() => error);
              }
              return of({ category, domains: [], allItems: [] });
            })
          )
        );
        return forkJoin(categoryRequests);
      })
    ).subscribe({
      next: (results) => {
        const rawData = results.flatMap(result => 
          result.allItems.map(item => {
            const domain = result.domains.find(d => d.id === item.profile_domain);
            return {
              ...item,
              profile_category_name: result.category.name,
              profile_category_name_ar: result.category.name_ar,
              profile_category_name_en: result.category.name_en,
              profile_category_object: result.category,
              profile_domain_name: domain?.name || item.profile_domain_name || 'Unknown Domain',
              profile_domain_name_ar: item.profile_domain_name_ar || domain?.name_ar || '',
              profile_domain_name_en: item.profile_domain_name_en || domain?.name_en || '',
              profile_domain_object: domain
            };
          })
        );
        
        this.processCategoryAndDomainDataForTable(rawData);
        this.updateFilterModules();
        this.isLoading = false;
        
        // Call callback if provided
        if (callback) {
          callback();
        }
      },
      error: (error) => {
        console.error('Error loading summary data:', error);
        
        // Check if it's a 401 Unauthorized error
        const errorStatus = error?.status || error?.originalError?.status;
        if (errorStatus === 401) {
          // Show friendly message for unauthorized errors
          this.translate.get([
            'skills_summary.error.unauthorized_title',
            'skills_summary.error.unauthorized'
          ]).subscribe((translations) => {
            this.error = translations['skills_summary.error.unauthorized'];
          });
        } else {
          // Show generic error message for other errors
          this.translate.get('skills_summary.error.load_data_failed').subscribe((text) => {
            this.error = text;
          });
        }
        this.isLoading = false;
      }
    });
  }

  resetFilters(): void {
    // Reset all filters to default values
    this.selectedFilterStatus = 'all';
    this.selectedFilterModule = 'all';
    this.selectedFilterItemStatus = 'all';
    this.startDate = null;
    this.endDate = null;
    this.dateFilterError = null;
    
    // Reload data without filters
    this.loadSummaryData();
    this.applyFilter();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  applyFilter(): void {
    let filteredData = [...this.originalCategoryDataForTable];

    // Apply module filter first
    if (this.selectedFilterModule !== 'all') {
      filteredData = filteredData.filter(category => category.category === this.selectedFilterModule);
    }

    // Apply status filter
    if (this.selectedFilterStatus !== 'all') {
      filteredData = filteredData.map(category => ({
        ...category,
        domains: category.domains.filter(domain => {
          const percentage = domain.progressPercentage;

          if (this.selectedFilterStatus === 'completed') {
            return percentage === 100;
          } else if (this.selectedFilterStatus === 'en_cours') {
            return percentage > 0 && percentage < 100;
          } else if (this.selectedFilterStatus === 'not_started') {
            return percentage === 0;
          }
          return true;
        })
      })).filter(category => category.domains.length > 0);
    }

    // Apply item status filter
    if (this.selectedFilterItemStatus !== 'all') {
      filteredData = filteredData.map(category => ({
        ...category,
        domains: category.domains.map(domain => ({
          ...domain,
          profileItems: domain.profileItems.filter(item => {
            if (this.selectedFilterItemStatus === 'acquired') {
              return item.etat === 'ACQUIS';
            } else if (this.selectedFilterItemStatus === 'not_acquired') {
              return item.etat === 'NON_ACQUIS';
            } else if (this.selectedFilterItemStatus === 'partial') {
              return item.etat === 'PARTIEL';
            }
            return true;
          })
        }))
      }));
    }

    this.categoryDataForTable = filteredData;
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

  getFilterStatusLabel(filterStatus: string): string {
    // Map filter status values to their corresponding translation keys
    const statusMapping: { [key: string]: string } = {
      'all': 'explore.filter.all',
      'completed': 'explore.filter.completed',
      'en_cours': 'explore.filter.in_progress',
      'not_started': 'explore.filter.not_started'
    };
    
    const translationKey = statusMapping[filterStatus] || 'explore.filter.all';
    return this.translate.instant(translationKey);
  }

  exportExcel(): void {
    import('xlsx').then((xlsx) => {
      // Create headers for the summary table
      const summaryHeaders = [
        this.translate.instant('skills_summary.export.category'),
        this.translate.instant('skills_summary.export.total_domains'),
        this.translate.instant('skills_summary.export.total_items'),
        this.translate.instant('skills_summary.export.overall_progress'),
        this.translate.instant('skills_summary.export.domains_info')
      ];

      // Create summary data rows
      const summaryData = this.categoryDataForTable.map(category => {
        // Create a formatted string for domains information
        const domainsInfo = category.domains.map(domain => 
          `${domain.domain}: ${domain.totalItems} items (${domain.acquired} acquired, ${domain.partial} partial, ${domain.notAcquired} not acquired, ${domain.notEvaluated} not evaluated) - ${domain.progressPercentage}%`
        ).join('; ');

                 return [
           this.getCategoryDisplayName(category),
           category.totalDomains,
           category.totalItemsOverall,
           `${category.overallProgress}%`,
           domainsInfo
         ];
      });

      // Create detailed items data
      const detailedItemsData = [];
      
      // Add separator and header for detailed items
      detailedItemsData.push([]); // Empty row as separator
      detailedItemsData.push([
        this.translate.instant('skills_summary.export.detailed_items_title')
      ]);
      detailedItemsData.push([]); // Empty row as separator
      
      // Add headers for detailed items table
      detailedItemsData.push([
        this.translate.instant('skills_summary.export.category'),
        this.translate.instant('skills_summary.export.domain'),
        this.translate.instant('skills_summary.export.item_name'),
        this.translate.instant('skills_summary.export.item_status'),
        this.translate.instant('skills_summary.export.item_comments')
      ]);

      // Add all items data
      this.categoryDataForTable.forEach(category => {
        category.domains.forEach(domain => {
          domain.profileItems.forEach(item => {
                         detailedItemsData.push([
               this.getCategoryDisplayName(category),
               this.getDomainDisplayName(domain),
               this.getItemLanguageField(item, 'description') || this.getItemLanguageField(item, 'name'),
               this.getEtatLabel(item.etat),
               this.getItemLanguageField(item, 'comentaire') || this.translate.instant('skills_summary.domain_items.no_comment')
             ]);
          });
        });
      });

      // Combine summary and detailed data
      const finalData = [
        // Summary section
        [this.translate.instant('skills_summary.export.summary_title')],
        [],
        summaryHeaders,
        ...summaryData,
        // Detailed items section
        ...detailedItemsData
      ];

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
    const currentLang = this.sharedService.getCurrentLanguage();
    
    // For Arabic and French text, we need a different approach
    if (currentLang === 'ar' || currentLang === 'fr') {
      this.exportPdfHtml();
    } else {
      this.exportPdfStandard();
    }
  }

  private exportPdfStandard(): void {
    const doc = new jsPDF('p', 'pt', 'a4');
    
    let yPosition = 40;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 40;

    // Add title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const title = this.translate.instant('skills_summary.export.title');
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, yPosition);
    yPosition += 30;

    // Summary section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const summaryTitle = this.translate.instant('skills_summary.export.summary_title');
    doc.text(summaryTitle, margin, yPosition);
    yPosition += 25;

    this.categoryDataForTable.forEach((category, categoryIndex) => {
      // Check if we need a new page
      if (yPosition > doc.internal.pageSize.height - 200) {
        doc.addPage();
        yPosition = 40;
      }

      // Category header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
             const categoryText = `${this.translate.instant('skills_summary.export.category')}: ${this.getCategoryDisplayName(category)}`;
      doc.text(categoryText, margin, yPosition);
      yPosition += 20;

      // Overall progress
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const progressText = `${this.translate.instant('skills_summary.export.overall_progress')}: ${category.overallProgress}%`;
      doc.text(progressText, margin, yPosition);
      yPosition += 30;

             // Prepare table data
       const tableData = category.domains.map(domain => [
         this.getDomainDisplayName(domain),
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

    // Add detailed items section
    yPosition += 20;
    
    // Check if we need a new page for detailed items
    if (yPosition > doc.internal.pageSize.height - 300) {
      doc.addPage();
      yPosition = 40;
    }

    // Detailed items title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const detailedTitle = this.translate.instant('skills_summary.export.detailed_items_title');
    doc.text(detailedTitle, margin, yPosition);
    yPosition += 25;

    // Prepare detailed items table data
    const detailedTableData: string[][] = [];
    this.categoryDataForTable.forEach(category => {
      category.domains.forEach(domain => {
        domain.profileItems.forEach(item => {
                     detailedTableData.push([
             this.getCategoryDisplayName(category),
             this.getDomainDisplayName(domain),
             this.getItemLanguageField(item, 'description') || this.getItemLanguageField(item, 'name'),
             this.getEtatLabel(item.etat),
             this.getItemLanguageField(item, 'comentaire') || this.translate.instant('skills_summary.domain_items.no_comment')
           ]);
        });
      });
    });

    // Create detailed items table
    autoTable(doc, {
      startY: yPosition,
      head: [[
        this.translate.instant('skills_summary.export.category'),
        this.translate.instant('skills_summary.export.domain'),
        this.translate.instant('skills_summary.export.item_name'),
        this.translate.instant('skills_summary.export.item_status'),
        this.translate.instant('skills_summary.export.item_comments')
      ]],
      body: detailedTableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [40, 167, 69],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        font: 'helvetica'
      },
      margin: { top: yPosition, left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 50 }, // Category
        1: { cellWidth: 50 }, // Domain
        2: { cellWidth: 80 }, // Item name
        3: { cellWidth: 30 }, // Status
        4: { cellWidth: 60 }  // Comments
      }
    });

    // Save with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    doc.save(`skills_summary_${timestamp}.pdf`);
  }

  private exportPdfHtml(): void {
    // For Arabic and French text, we'll use a different approach
    // We'll create an HTML file and open it in a new window for printing
    // This approach should handle Arabic and French text much better
    
    const htmlContent = this.generateHtmlReport();
    
    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Open in new window for printing
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        // Clean up the URL after printing
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      };
    } else {
      // Fallback: download as HTML file
      const link = document.createElement('a');
      link.href = url;
      link.download = 'skills_summary.html';
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  // Get current language
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  // Helper method to get the appropriate field based on language
  getLanguageField(category: any, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      // For Arabic language, use _ar fields
      if (fieldName === 'name') {
        return category.name_ar || category.name || '';
      } else if (fieldName === 'description') {
        return category.description_ar || category.description || '';
      }
    } else if (this.currentLanguage === 'en') {
      // For English language, use _en fields
      if (fieldName === 'name') {
        return category.name_en || category.name || '';
      } else if (fieldName === 'description') {
        return category.description_en || category.description || '';
      }
    } else {
      // For French language, use non-_ar fields
      if (fieldName === 'name') {
        return category.name || '';
      } else if (fieldName === 'description') {
        return category.description || '';
      }
    }
    return '';
  }

  // Helper method to get the appropriate field for ProfileItem based on language
  getItemLanguageField(item: ProfileItem, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      // For Arabic language, use _ar fields
      if (fieldName === 'name') {
        return item.name_ar || item.name || '';
      } else if (fieldName === 'description') {
        return item.description_ar || item.description || '';
      } else if (fieldName === 'comentaire') {
        return item.commentaire_ar || item.comentaire || '';
      }
    } else if (this.currentLanguage === 'en') {
      // For English language, use _en fields
      if (fieldName === 'name') {
        return item.name_en || item.name || '';
      } else if (fieldName === 'description') {
        return item.description_en || item.description || '';
      } else if (fieldName === 'comentaire') {
        return item.commentaire_en || item.comentaire || '';
      }
    } else {
      // For French language, use non-_ar fields
      if (fieldName === 'name') {
        return item.name || '';
      } else if (fieldName === 'description') {
        return item.description || '';
      } else if (fieldName === 'comentaire') {
        return item.comentaire || '';
      }
    }
    return '';
  }

  // Helper method to get the appropriate field for ProfileDomain based on language
  getDomainLanguageField(domain: any, fieldName: string): string {
    if (!domain) return '';
    
    if (this.currentLanguage === 'ar') {
      // For Arabic language, use _ar fields
      if (fieldName === 'name') {
        return domain.name_ar || domain.name || '';
      } else if (fieldName === 'description') {
        return domain.description_ar || domain.description || '';
      }
    } else if (this.currentLanguage === 'en') {
      // For English language, use _en fields
      if (fieldName === 'name') {
        return domain.name_en || domain.name || '';
      } else if (fieldName === 'description') {
        return domain.description_en || domain.description || '';
      }
    } else {
      // For French language, use non-_ar fields
      if (fieldName === 'name') {
        return domain.name || '';
      } else if (fieldName === 'description') {
        return domain.description || '';
      }
    }
    return '';
  }

  // Helper method to get domain display name for DomainTableRow
  getDomainDisplayName(domainData: DomainTableRow): string {
    // First, try to get the name from the domain object using the current language
    if (domainData.domainObject) {
      const displayName = this.getDomainLanguageField(domainData.domainObject, 'name');
      if (displayName && displayName.trim() !== '') {
        return displayName;
      }
    }
    
    // If no language-specific name is available from the domain object,
    // check if we have any items with language-specific domain names
    if (domainData.profileItems && domainData.profileItems.length > 0) {
      const firstItem = domainData.profileItems[0];
      if (this.currentLanguage === 'ar' && firstItem.profile_domain_name_ar && firstItem.profile_domain_name_ar.trim() !== '') {
        return firstItem.profile_domain_name_ar;
      } else if (this.currentLanguage === 'en' && firstItem.profile_domain_name_en && firstItem.profile_domain_name_en.trim() !== '') {
        return firstItem.profile_domain_name_en;
      }
    }
    
    // Fallback to the stored domain name
    return domainData.domain;
  }

  // Helper method to get category display name for CategoryTableRow
  getCategoryDisplayName(categoryData: CategoryTableRow): string {
    if (categoryData.categoryObject) {
      return this.getLanguageField(categoryData.categoryObject, 'name') || categoryData.category;
    }
    return categoryData.category;
  }

  // Refresh data when language changes
  private refreshDataForLanguage() {
    // Reprocess the existing data with the new language
    if (this.originalCategoryDataForTable.length > 0) {
      // Get the raw data from the original processed data
      const rawData = this.getRawDataFromProcessedData();
      this.processCategoryAndDomainDataForTable(rawData);
      // Force change detection
      this.cdr.detectChanges();
    }
  }

  // Helper method to reconstruct raw data from processed data
  private getRawDataFromProcessedData(): any[] {
    const rawData: any[] = [];
    
    this.originalCategoryDataForTable.forEach(category => {
      category.domains.forEach(domain => {
        domain.profileItems.forEach(item => {
          rawData.push({
            ...item,
            profile_category_name: category.categoryObject?.name || category.category,
            profile_category_name_ar: category.categoryObject?.name_ar || '',
            profile_category_name_en: category.categoryObject?.name_en || '',
            profile_category_object: category.categoryObject,
            profile_domain_name: domain.domainObject?.name || domain.domain,
            profile_domain_name_ar: item.profile_domain_name_ar || domain.domainObject?.name_ar || '',
            profile_domain_name_en: item.profile_domain_name_en || domain.domainObject?.name_en || '',
            profile_domain_object: domain.domainObject
          });
        });
      });
    });
    
    return rawData;
  }

  private generateHtmlReport(): string {
    const currentLang = this.getCurrentLanguage();
    const isArabic = currentLang === 'ar';
    
    // Generate HTML content for Arabic and French text
    let html = `
      <html dir="${isArabic ? 'rtl' : 'ltr'}" lang="${currentLang}">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section-title { background-color: #f2f2f2; padding: 10px; margin: 20px 0 15px 0; font-weight: bold; }
          .category-section { margin-bottom: 30px; }
          .category-header { background-color: #f2f2f2; padding: 10px; margin-bottom: 15px; }
          .domain-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .domain-table th, .domain-table td { border: 1px solid #ddd; padding: 8px; text-align: ${isArabic ? 'right' : 'left'}; }
          .domain-table th { background-color: #e6e6e6; }
          .progress-bar { background-color: #f0f0f0; height: 20px; border-radius: 10px; overflow: hidden; }
          .progress-fill { background-color: #4CAF50; height: 100%; transition: width 0.3s; }
          .detailed-items-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .detailed-items-table th, .detailed-items-table td { border: 1px solid #ddd; padding: 8px; text-align: ${isArabic ? 'right' : 'left'}; }
          .detailed-items-table th { background-color: #28a745; color: white; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${this.translate.instant('skills_summary.export.title')}</h1>
        </div>
        
        <div class="section-title">
          ${this.translate.instant('skills_summary.export.summary_title')}
        </div>
    `;
    
    this.categoryDataForTable.forEach(category => {
      html += `
        <div class="category-section">
          <div class="category-header">
                         <h2>${this.getCategoryDisplayName(category)}</h2>
            <p>${this.translate.instant('skills_summary.export.overall_progress')}: ${category.overallProgress}%</p>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${category.overallProgress}%"></div>
            </div>
          </div>
      `;
      
      if (category.domains.length > 0) {
        html += `
          <table class="domain-table">
            <thead>
              <tr>
                <th>${this.translate.instant('skills_summary.export.domain')}</th>
                <th>${this.translate.instant('skills_summary.export.total_items')}</th>
                <th>${this.translate.instant('skills_summary.export.acquired')}</th>
                <th>${this.translate.instant('skills_summary.export.partial')}</th>
                <th>${this.translate.instant('skills_summary.export.not_acquired')}</th>
                <th>${this.translate.instant('skills_summary.export.not_evaluated')}</th>
                <th>${this.translate.instant('skills_summary.export.progress')}</th>
              </tr>
            </thead>
            <tbody>
        `;
        
                 category.domains.forEach(domain => {
           html += `
             <tr>
               <td>${this.getDomainDisplayName(domain)}</td>
               <td>${domain.totalItems}</td>
               <td>${domain.acquired}</td>
               <td>${domain.partial}</td>
               <td>${domain.notAcquired}</td>
               <td>${domain.notEvaluated}</td>
               <td>${domain.progressPercentage}%</td>
             </tr>
           `;
         });
        
        html += `
            </tbody>
          </table>
        `;
      }
      
      html += `</div>`;
    });
    
    // Add detailed items section
    html += `
        <div class="page-break"></div>
        <div class="section-title">
          ${this.translate.instant('skills_summary.export.detailed_items_title')}
        </div>
        <table class="detailed-items-table">
          <thead>
            <tr>
              <th>${this.translate.instant('skills_summary.export.category')}</th>
              <th>${this.translate.instant('skills_summary.export.domain')}</th>
              <th>${this.translate.instant('skills_summary.export.item_name')}</th>
              <th>${this.translate.instant('skills_summary.export.item_status')}</th>
              <th>${this.translate.instant('skills_summary.export.item_comments')}</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    this.categoryDataForTable.forEach(category => {
      category.domains.forEach(domain => {
        domain.profileItems.forEach(item => {
                     html += `
             <tr>
               <td>${this.getCategoryDisplayName(category)}</td>
               <td>${this.getDomainDisplayName(domain)}</td>
               <td>${this.getItemLanguageField(item, 'description') || this.getItemLanguageField(item, 'name')}</td>
               <td>${this.getEtatLabel(item.etat)}</td>
               <td>${this.getItemLanguageField(item, 'comentaire') || this.translate.instant('skills_summary.domain_items.no_comment')}</td>
             </tr>
           `;
        });
      });
    });
    
    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    return html;
  }
}