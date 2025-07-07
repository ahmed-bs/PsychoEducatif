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
    ToggleButtonModule

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

  filterStatuses: any[] = [
    { label: 'Tous les statuts', value: 'ALL' },
    { label: 'Acquis', value: 'ACQUIS' },
    { label: 'Partiel', value: 'PARTIEL' },
    { label: 'Non Acquis', value: 'NON_ACQUIS' },
    { label: 'Non Évalué', value: 'NON_COTE' }
  ];
  selectedFilterStatus: string = 'ALL';

  private originalCategoryDataForTable: CategoryTableRow[] = [];

  domainItemsVisibility: { [domainName: string]: boolean } = {};

  constructor(
    private profileItemService: ProfileItemService,
    private profileCategoryService: ProfileCategoryService,
    private profileDomainService: ProfileDomainService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('childId');
      if (id) {
        this.profileId = +id;
      }
      this.loadSummaryData();
    });

    
    this.exportItems = [
      {
        label: 'Exporter en Excel', 
        icon: 'pi pi-file-excel',
        command: () => {
          this.exportExcel();
        },
      },
      {
        label: 'Exporter en PDF', 
        icon: 'pi pi-file-pdf',
        command: () => {
          this.exportPdf();
        },
      },
    ];
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
        categories.forEach((cat) => categoryMap.set(cat.id!, cat.name || 'Unknown Category'));

        const categoryDomainItemRequests = categories.map((category) =>
          this.profileDomainService.getDomains(category.id!).pipe(
            switchMap((domains) => {
              if (domains.length === 0) {
                return of({ categoryId: category.id, categoryName: category.name, domains: [], items: [] });
              }
              const domainMap = new Map<number, string>();
              domains.forEach((dom) => domainMap.set(dom.id, dom.name || 'Unknown Domain'));

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
        this.error = 'Échec du chargement des données récapitulatives. Veuillez réessayer plus tard.';
        this.isLoading = false;
      },
    });
  }

  processCategoryAndDomainDataForTable(rawData: any[]): void {
    const categoryDataMap: { [categoryName: string]: CategoryTableRow } = {};

    rawData.forEach(categoryResult => {
      const categoryName = categoryResult.categoryName || 'Unknown Category';
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
        const domainName = item.profile_domain_name || 'Unknown Domain';
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
      const categoryName = categoryResult.categoryName || 'Unknown Category';
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
        const domainName = item.profile_domain_name || 'Unknown Domain';
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
    switch (etat) {
      case 'ALL':
        return 'Tous'
      case 'ACQUIS':
        return 'Acquis';
      case 'PARTIEL':
        return 'Partiel';
      case 'NON_ACQUIS':
        return 'Non Acquis';
      case 'NON_COTE':
        return 'Non Évalué';
      default:
        return 'Inconnu';
    }
  }

  
  exportExcel(): void {
    import('xlsx').then((xlsx) => {
      const exportData: any[] = [];

      
      exportData.push({ 'Résumé des Compétences': 'Export généré le ' + new Date().toLocaleDateString('fr-FR') });
      exportData.push({}); 

      this.categoryDataForTable.forEach(category => {
        
        exportData.push({ 'Catégorie': category.category, '': '', '': '', '': '', '': '', '': '' }); 
        exportData.push({
          'Catégorie': '', 
          'Domaine': 'Domaine',
          'Total Items': 'Total Items',
          'Acquises': 'Acquises',
          'Partielles': 'Partielles',
          'Non Acquises': 'Non Acquises',
          'Non Évaluées': 'Non Évaluées',
          'Progression (%)': 'Progression (%)'
        }); 

        category.domains.forEach(domain => {
          exportData.push({
            'Catégorie': '', 
            'Domaine': domain.domain,
            'Total Items': domain.totalItems,
            'Acquises': domain.acquired,
            'Partielles': domain.partial,
            'Non Acquises': domain.notAcquired,
            'Non Évaluées': domain.notEvaluated,
            'Progression (%)': domain.progressPercentage + '%',
          });
        });
        exportData.push({}); 
      });

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, 'resume_competences');
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
    doc.text('Résumé des Compétences', 40, 20);
    doc.text('Export généré le ' + new Date().toLocaleDateString('fr-FR'), 40, 40);

    let finalBody: any[] = [];
    this.categoryDataForTable.forEach(category => {
        
        
        finalBody.push([{ content: `Catégorie: ${category.category}`, colSpan: 8, styles: { fillColor: [224, 242, 247], textColor: [0, 86, 179], fontStyle: 'bold' } }]);

        
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
        head: [['', 'Domaine', 'Total', 'Acquises', 'Partielles', 'Non Acquises', 'Non Évaluées', 'Progression (%)']],
        body: finalBody,
        theme: 'striped',
        headStyles: { fillColor: [0, 123, 255] },
        margin: { top: 60 },
        
        didParseCell: (data) => {
            
            const cellContent = (data.cell.raw as any)?.content; 
            if (data.section === 'body' && typeof cellContent === 'string' && cellContent.startsWith('Catégorie:')) {
                data.cell.styles.fillColor = [224, 242, 247];
                data.cell.styles.textColor = [0, 86, 179];
                data.cell.styles.fontStyle = 'bold';
            }
        },
    });

    doc.save('resume_competences.pdf');
  }
}

