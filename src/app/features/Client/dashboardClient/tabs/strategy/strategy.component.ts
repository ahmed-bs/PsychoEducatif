import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Strategy, CategoryWithPartielItems } from 'src/app/core/models/strategy';
import { AddStrategyModalComponent } from '../../modals/add-strategy-modal/add-strategy-modal.component';
import { Subscription, forkJoin, of } from 'rxjs';
import { StrategyService } from 'src/app/core/services/strategy.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { FormsModule } from '@angular/forms';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileDomain } from 'src/app/core/models/ProfileDomain';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { Router } from '@angular/router';
import { switchMap, map, catchError } from 'rxjs/operators';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

interface DomainWithPartielItems extends ProfileDomain {
  items?: ProfileItem[];
  partielItems?: ProfileItem[];
  partiel_count?: number;
  categoryName?: string;
  categoryNameAr?: string;
  expanded?: boolean;
}

@Component({
  selector: 'app-strategy',
  standalone: true,
  imports: [CommonModule, AddStrategyModalComponent, TranslateModule, FormsModule, DropdownModule, ButtonModule, TooltipModule],
  templateUrl: './strategy.component.html',
  styleUrls: ['./strategy.component.css']
})
export class StrategyComponent implements OnInit, OnDestroy {
  @Input() currentProfileId: number | null = null;

  strategies: Strategy[] = [];
  showAddStrategyModal: boolean = false;
  strategyToEdit: Strategy | null = null;
  categoriesWithPartielItems: CategoryWithPartielItems[] = [];
  domainsWithPartielItems: DomainWithPartielItems[] = [];
  currentLanguage: string = 'fr';
  isLoadingCategories: boolean = false;
  isLoadingDomains: boolean = false;
  selectedItemForComment: ProfileItem | null = null;
  showCommentModal: boolean = false;
  commentText: string = '';
  selectedItemForStrategy: ProfileItem | null = null;
  showStrategyModal: boolean = false;
  strategyText: string = '';
  updatingItem: boolean = false;
  selectedStatusFilter: string | null = 'PARTIEL';
  statusFilterOptions: any[] = [];
  filteredDomainsWithPartielItems: DomainWithPartielItems[] = [];

  private strategiesSubscription: Subscription | undefined;
  private saveSubscription: Subscription | undefined;
  private deleteSubscription: Subscription | undefined;
  private categoriesSubscription: Subscription | undefined;
  private languageSubscription: Subscription;

  constructor(
    private strategyService: StrategyService,
    private translate: TranslateService,
    private sharedService: SharedService,
    private profileDomainService: ProfileDomainService,
    private profileItemService: ProfileItemService,
    private router: Router
  ) {
    // Initialize current language
    this.currentLanguage = this.sharedService.getCurrentLanguage();
    
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
      this.currentLanguage = lang;
    });
  }

  ngOnInit(): void {
    // Initialize translation with current language
    const currentLang = this.sharedService.getCurrentLanguage();
    this.translate.use(currentLang);
    this.currentLanguage = currentLang;

    // Initialize status filter options
    this.initializeStatusFilterOptions();

    if (this.currentProfileId) {
      this.loadStrategies();
    } else {
      console.warn('StrategyComponent initialized without a currentProfileId. Cannot load strategies.');
    }

    // Load categories with partiel items
    this.loadCategoriesWithPartielItems();
  }

  initializeStatusFilterOptions(): void {
    // Subscribe to language changes to update filter options
    this.sharedService.languageChange$.subscribe(() => {
      this.updateStatusFilterOptions();
    });
    this.updateStatusFilterOptions();
  }

  updateStatusFilterOptions(): void {
    this.translate.get([
      'dashboard_tabs.strategy.filter.all',
      'dashboard_tabs.strategy.table.status_options.partiel',
      'dashboard_tabs.strategy.table.status_options.acquis',
      'dashboard_tabs.strategy.table.status_options.non_acquis'
    ]).subscribe(translations => {
      this.statusFilterOptions = [
        { label: translations['dashboard_tabs.strategy.filter.all'], value: null },
        { label: translations['dashboard_tabs.strategy.table.status_options.partiel'], value: 'PARTIEL' },
        { label: translations['dashboard_tabs.strategy.table.status_options.acquis'], value: 'ACQUIS' },
        { label: translations['dashboard_tabs.strategy.table.status_options.non_acquis'], value: 'NON_ACQUIS' }
      ];
    });
  }

  ngOnDestroy(): void {
    this.strategiesSubscription?.unsubscribe();
    this.saveSubscription?.unsubscribe();
    this.deleteSubscription?.unsubscribe();
    this.categoriesSubscription?.unsubscribe();
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }
  
  loadStrategies(): void {
    if (this.currentProfileId) {
      this.strategiesSubscription = this.strategyService.getStrategies(this.currentProfileId).subscribe({
        next: (data) => {
          this.strategies = data;
        },
        error: (error) => {
          console.error('Error loading strategies:', error);
        }
      });
    }
  }

  loadCategoriesWithPartielItems(): void {
    this.isLoadingCategories = true;
    this.isLoadingDomains = true;
    this.categoriesSubscription = this.strategyService.getCategoriesWithPartielItems().subscribe({
      next: (response) => {
        this.categoriesWithPartielItems = response.data || [];
        this.isLoadingCategories = false;
        // Load domains for all categories
        this.loadDomainsWithPartielItems();
      },
      error: (error) => {
        console.error('Error loading categories with partiel items:', error);
        this.isLoadingCategories = false;
        this.isLoadingDomains = false;
      }
    });
  }

  loadDomainsWithPartielItems(): void {
    if (this.categoriesWithPartielItems.length === 0) {
      this.isLoadingDomains = false;
      return;
    }

    // Fetch domains for each category
    const domainRequests = this.categoriesWithPartielItems.map(category =>
      this.profileDomainService.getDomains(category.value).pipe(
        switchMap((domains: ProfileDomain[]) => {
          if (domains.length === 0) return of([]);
          
          // Get items for each domain to check for partiel status
          const itemRequests = domains.map(domain =>
            this.profileItemService.getItems(domain.id).pipe(
              map((items: ProfileItem[]) => {
                // Normalize items to ensure both commentaire spellings are available
                const normalizedItems = items.map(item => {
                  // API returns commentaire (with 'n'), ensure both spellings are available
                  const commentaireValue = (item as any).commentaire || item.comentaire || '';
                  return {
                    ...item,
                    // Set both spellings for compatibility
                    comentaire: commentaireValue,
                    commentaire: commentaireValue
                  } as any;
                });
                
                // Keep all items for filtering, but also track partiel items
                const partielItems = normalizedItems.filter(item => item.etat === 'PARTIEL');
                // Return domain if it has any items (not just partiel)
                if (normalizedItems.length > 0) {
                  return {
                    ...domain,
                    items: normalizedItems,
                    partielItems: normalizedItems, // Store all items for filtering
                    partiel_count: partielItems.length,
                    categoryName: category.label,
                    categoryNameAr: category.label_ar,
                    expanded: false
                  } as DomainWithPartielItems;
                }
                return null;
              }),
              catchError(() => of(null))
            )
          );
          
          return forkJoin(itemRequests).pipe(
            map((results: (DomainWithPartielItems | null)[]) => 
              results.filter((domain): domain is DomainWithPartielItems => domain !== null)
            )
          );
        }),
        catchError(() => of([]))
      )
    );

    forkJoin(domainRequests).subscribe({
      next: (results) => {
        // Flatten the array of arrays
        this.domainsWithPartielItems = results.flat();
        this.applyStatusFilter();
        this.isLoadingDomains = false;
      },
      error: (error) => {
        console.error('Error loading domains with partiel items:', error);
        this.isLoadingDomains = false;
      }
    });
  }

  applyStatusFilter(): void {
    if (!this.selectedStatusFilter) {
      this.filteredDomainsWithPartielItems = [...this.domainsWithPartielItems];
      return;
    }

    const filtered: DomainWithPartielItems[] = [];
    this.domainsWithPartielItems.forEach(domain => {
      const filteredItems = domain.partielItems?.filter(item => item.etat === this.selectedStatusFilter) || [];
      if (filteredItems.length > 0) {
        filtered.push({
          ...domain,
          partielItems: filteredItems,
          partiel_count: filteredItems.length
        });
      }
    });
    this.filteredDomainsWithPartielItems = filtered;
  }

  onStatusFilterChange(): void {
    this.applyStatusFilter();
  }

  getDomainLanguageField(domain: DomainWithPartielItems, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      if (fieldName === 'name') {
        return domain.name_ar || domain.name || '';
      } else if (fieldName === 'description') {
        return domain.description_ar || domain.description || '';
      }
    } else {
      if (fieldName === 'name') {
        return domain.name || '';
      } else if (fieldName === 'description') {
        return domain.description || '';
      }
    }
    return '';
  }

  getCategoryName(domain: DomainWithPartielItems): string {
    if (this.currentLanguage === 'ar' && domain.categoryNameAr) {
      return domain.categoryNameAr;
    }
    return domain.categoryName || '';
  }

  formatPercentage(value: number | undefined | null): string {
    if (value === undefined || value === null) return '0.00';
    return value.toFixed(2);
  }

  hasComment(item: ProfileItem): boolean {
    const commentaireFr = (item as any).commentaire || item.comentaire || '';
    const commentaireAr = item.commentaire_ar || '';
    return !!(commentaireFr || commentaireAr);
  }

  hasStrategy(item: ProfileItem): boolean {
    if (this.currentLanguage === 'ar') {
      return !!(item.strategie_ar && item.strategie_ar.trim());
    }
    return !!(item.strategie && item.strategie.trim());
  }

  toggleDomainExpansion(domain: DomainWithPartielItems): void {
    domain.expanded = !domain.expanded;
  }

  navigateToQuiz(domainId: number | undefined): void {
    if (domainId) {
      this.router.navigate(['/Dashboard-client/client/quiz', domainId]);
    }
  }

  navigateToQuizWithItem(domainId: number | undefined, itemId: number | undefined, event: Event): void {
    event.stopPropagation(); // Prevent row click event
    if (domainId) {
      // Navigate to quiz with domain ID - the quiz component will handle showing items
      this.router.navigate(['/Dashboard-client/client/quiz', domainId]);
    }
  }

  getItemLanguageField(item: ProfileItem, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      if (fieldName === 'name') {
        return item.name_ar || item.name || '';
      } else if (fieldName === 'description') {
        return item.description_ar || item.description || '';
      } else if (fieldName === 'comentaire') {
        // API returns commentaire (with 'n'), prioritize that
        return item.commentaire_ar || (item as any).commentaire || item.comentaire || '';
      } else if (fieldName === 'strategie') {
        return item.strategie_ar || item.strategie || '';
      }
    } else {
      if (fieldName === 'name') {
        return item.name || '';
      } else if (fieldName === 'description') {
        return item.description || '';
      } else if (fieldName === 'comentaire') {
        // API returns commentaire (with 'n'), prioritize that
        return (item as any).commentaire || item.comentaire || '';
      } else if (fieldName === 'strategie') {
        return item.strategie || '';
      }
    }
    return '';
  }

  openCommentModal(item: ProfileItem, event: Event): void {
    event.stopPropagation();
    this.selectedItemForComment = item;
    // Get comment based on current language
    // API returns commentaire (with 'n'), prioritize that
    const commentaireFr = (item as any).commentaire || item.comentaire || '';
    if (this.currentLanguage === 'ar') {
      this.commentText = item.commentaire_ar || commentaireFr || '';
    } else {
      this.commentText = commentaireFr;
    }
    this.showCommentModal = true;
  }

  closeCommentModal(): void {
    this.showCommentModal = false;
    this.selectedItemForComment = null;
    this.commentText = '';
  }

  openStrategyModal(item: ProfileItem, event: Event): void {
    event.stopPropagation();
    this.selectedItemForStrategy = item;
    if (this.currentLanguage === 'ar') {
      this.strategyText = item.strategie_ar || item.strategie || '';
    } else {
      this.strategyText = item.strategie || '';
    }
    this.showStrategyModal = true;
  }

  closeStrategyModal(): void {
    this.showStrategyModal = false;
    this.selectedItemForStrategy = null;
    this.strategyText = '';
  }

  exportPdf(): void {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const usableWidth = pageWidth - (margin * 2);
    
    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(this.translate.instant('dashboard_tabs.strategy.export.title'), margin, 30);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const filterText = this.selectedStatusFilter 
      ? `${this.translate.instant('dashboard_tabs.strategy.export.filter')}: ${this.getStatusLabel(this.selectedStatusFilter)}`
      : this.translate.instant('dashboard_tabs.strategy.export.all_items');
    doc.text(filterText, margin, 50);
    
    // Prepare table data
    const tableData: any[] = [];
    this.filteredDomainsWithPartielItems.forEach(domain => {
      domain.partielItems?.forEach(item => {
        tableData.push([
          this.getCategoryName(domain),
          this.getDomainLanguageField(domain, 'name'),
          this.getItemLanguageField(item, 'name'),
          this.getItemLanguageField(item, 'description'),
          this.getStatusLabel(item.etat),
          this.getItemLanguageField(item, 'comentaire') || '-',
          this.getItemLanguageField(item, 'strategie') || '-'
        ]);
      });
    });

    // Headers
    const headers = [
      this.translate.instant('dashboard_tabs.strategy.export.category'),
      this.translate.instant('dashboard_tabs.strategy.export.domain'),
      this.translate.instant('dashboard_tabs.strategy.export.item_name'),
      this.translate.instant('dashboard_tabs.strategy.export.description'),
      this.translate.instant('dashboard_tabs.strategy.export.status'),
      this.translate.instant('dashboard_tabs.strategy.export.comment'),
      this.translate.instant('dashboard_tabs.strategy.export.strategy')
    ];

    // Calculate column widths as percentages of usable width
    // Category: 10%, Domain: 12%, Name: 15%, Description: 20%, Status: 8%, Comment: 15%, Strategy: 20%
    const colWidths = [
      usableWidth * 0.10,  // Category
      usableWidth * 0.12,  // Domain
      usableWidth * 0.15,  // Item Name
      usableWidth * 0.20,  // Description
      usableWidth * 0.08,  // Status
      usableWidth * 0.15,  // Comment
      usableWidth * 0.20   // Strategy
    ];

    // Create table
    autoTable(doc, {
      startY: 70,
      head: [headers],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [34, 197, 94], // green-600
        font: 'helvetica',
        fontSize: 9,
        textColor: [255, 255, 255]
      },
      bodyStyles: {
        font: 'helvetica',
        fontSize: 8
      },
      margin: { top: 70, left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      columnStyles: {
        0: { cellWidth: colWidths[0], halign: 'left' },
        1: { cellWidth: colWidths[1], halign: 'left' },
        2: { cellWidth: colWidths[2], halign: 'left' },
        3: { cellWidth: colWidths[3], halign: 'left' },
        4: { cellWidth: colWidths[4], halign: 'center' },
        5: { cellWidth: colWidths[5], halign: 'left' },
        6: { cellWidth: colWidths[6], halign: 'left' }
      }
    });

    doc.save('strategies_export.pdf');
  }

  exportExcel(): void {
    import('xlsx').then((xlsx) => {
      const exportData: any[] = [];
      
      this.filteredDomainsWithPartielItems.forEach(domain => {
        domain.partielItems?.forEach(item => {
          exportData.push({
            [this.translate.instant('dashboard_tabs.strategy.export.category')]: this.getCategoryName(domain),
            [this.translate.instant('dashboard_tabs.strategy.export.domain')]: this.getDomainLanguageField(domain, 'name'),
            [this.translate.instant('dashboard_tabs.strategy.export.item_name')]: this.getItemLanguageField(item, 'name'),
            [this.translate.instant('dashboard_tabs.strategy.export.description')]: this.getItemLanguageField(item, 'description'),
            [this.translate.instant('dashboard_tabs.strategy.export.status')]: this.getStatusLabel(item.etat),
            [this.translate.instant('dashboard_tabs.strategy.export.comment')]: this.getItemLanguageField(item, 'comentaire') || '',
            [this.translate.instant('dashboard_tabs.strategy.export.strategy')]: this.getItemLanguageField(item, 'strategie') || ''
          });
        });
      });

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = { Sheets: { 'Data': worksheet }, SheetNames: ['Data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, 'strategies_export');
    });
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, fileName + '_' + new Date().getTime() + EXCEL_EXTENSION);
  }

  saveComment(): void {
    if (!this.selectedItemForComment) return;

    this.updatingItem = true;
    const updateData: any = {};
    
    if (this.currentLanguage === 'ar') {
      updateData.commentaire_ar = this.commentText;
      // Keep the French comment if it exists
      if (this.selectedItemForComment.comentaire || (this.selectedItemForComment as any).commentaire) {
        updateData.commentaire = (this.selectedItemForComment as any).commentaire || this.selectedItemForComment.comentaire;
      }
    } else {
      updateData.commentaire = this.commentText;
      // Keep the Arabic comment if it exists
      if (this.selectedItemForComment.commentaire_ar) {
        updateData.commentaire_ar = this.selectedItemForComment.commentaire_ar;
      }
    }

    this.profileItemService.update(this.selectedItemForComment.id, updateData).subscribe({
      next: (updatedItem) => {
        // Update the item in the domain's partielItems array
        const domain = this.domainsWithPartielItems.find(d => 
          d.partielItems?.some(item => item.id === updatedItem.id)
        );
        if (domain && domain.partielItems) {
          const itemIndex = domain.partielItems.findIndex(item => item.id === updatedItem.id);
          if (itemIndex !== -1) {
            // Update the item with the new data
            domain.partielItems[itemIndex] = {
              ...domain.partielItems[itemIndex],
              ...updatedItem
            };
          }
        }
        this.closeCommentModal();
        this.updatingItem = false;
      },
      error: (error) => {
        console.error('Error updating comment:', error);
        this.updatingItem = false;
        alert(this.translate.instant('dashboard_tabs.strategy.messages.comment_update_error'));
      }
    });
  }

  updateItemStatus(item: ProfileItem, newStatus: 'ACQUIS' | 'NON_ACQUIS' | 'PARTIEL', event: Event): void {
    event.stopPropagation();
    
    if (item.etat === newStatus) return;

    this.updatingItem = true;
    this.profileItemService.update(item.id, { etat: newStatus }).subscribe({
      next: (updatedItem) => {
        // Update the item in the domain's partielItems array
        const domain = this.domainsWithPartielItems.find(d => 
          d.partielItems?.some(i => i.id === updatedItem.id)
        );
        
        if (domain && domain.partielItems) {
          const itemIndex = domain.partielItems.findIndex(i => i.id === updatedItem.id);
          if (itemIndex !== -1) {
            // If status changed from PARTIEL, remove from partielItems
            if (newStatus !== 'PARTIEL') {
              domain.partielItems.splice(itemIndex, 1);
              domain.partiel_count = (domain.partiel_count || 0) - 1;
              // If no more partiel items, remove domain from list
              if (domain.partielItems.length === 0) {
                const domainIndex = this.domainsWithPartielItems.findIndex(d => d.id === domain.id);
                if (domainIndex !== -1) {
                  this.domainsWithPartielItems.splice(domainIndex, 1);
                }
              }
            } else {
              domain.partielItems[itemIndex] = updatedItem;
            }
          }
        }
        this.updatingItem = false;
      },
      error: (error) => {
        console.error('Error updating item status:', error);
        this.updatingItem = false;
        alert(this.translate.instant('dashboard_tabs.strategy.messages.status_update_error'));
      }
    });
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'ACQUIS': 'dashboard_tabs.strategy.table.status_options.acquis',
      'NON_ACQUIS': 'dashboard_tabs.strategy.table.status_options.non_acquis',
      'PARTIEL': 'dashboard_tabs.strategy.table.status_options.partiel',
      'NON_COTE': 'dashboard_tabs.strategy.table.status_options.non_cote'
    };
    return this.translate.instant(statusMap[status] || status);
  }

  openAddStrategyModal(): void {
    this.strategyToEdit = null;
    this.showAddStrategyModal = true;
  }

  openEditStrategyModal(strategy: Strategy): void {
    this.strategyToEdit = { ...strategy };
    this.showAddStrategyModal = true;
  }

  closeAddStrategyModal(): void {
    this.showAddStrategyModal = false;
    this.strategyToEdit = null;
  }

  onStrategySaved(savedStrategy: Strategy): void {
    if (savedStrategy.id) {
      this.saveSubscription = this.strategyService.updateStrategy(savedStrategy).subscribe({
        next: (updatedStrategy) => {
          const index = this.strategies.findIndex(s => s.id === updatedStrategy.id);
          if (index !== -1) {
            this.strategies[index] = updatedStrategy;
          }
          this.closeAddStrategyModal();
        },
        error: (error) => {
          console.error('Error updating strategy:', error);
        }
      });
    } else {
      const strategyToCreate: Omit<Strategy, 'id' | 'author' | 'created_at' | 'updated_at' | 'author_username' | 'profile_name'> = {
        ...savedStrategy,
        profile: this.currentProfileId as number
      };

      this.saveSubscription = this.strategyService.createStrategy(strategyToCreate).subscribe({
        next: (newStrategy) => {
          this.strategies.push(newStrategy);
          this.closeAddStrategyModal();
        },
        error: (error) => {
          console.error('Error creating strategy:', error);
        }
      });
    }
  }

  deleteStrategy(id: number | undefined): void {
    if (id === undefined) {
      return;
    }

    if (confirm(this.translate.instant('dashboard_tabs.strategy.messages.confirm_delete'))) {
      this.deleteSubscription = this.strategyService.deleteStrategy(id).subscribe({
        next: () => {
          this.strategies = this.strategies.filter(s => s.id !== id);
        },
        error: (error) => {
          console.error('Error deleting strategy:', error);
          if (error.status === 403) {
            alert(this.translate.instant('dashboard_tabs.strategy.messages.permission_denied'));
          } else {
            alert(this.translate.instant('dashboard_tabs.strategy.messages.delete_error'));
          }
        }
      });
    }
  }
}
