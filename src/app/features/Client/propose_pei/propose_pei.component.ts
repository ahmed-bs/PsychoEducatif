import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { ProfileCategory } from 'src/app/core/models/ProfileCategory';
import { ProfileDomain } from 'src/app/core/models/ProfileDomain';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';
import { BackButtonComponent } from 'src/app/shared/back-button/back-button.component';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

interface CategoryWithPartielItems extends ProfileCategory {
  domains?: DomainWithPartielItems[];
}

interface DomainWithPartielItems extends ProfileDomain {
  partielItems?: ProfileItem[];
  categoryName?: string;
  categoryNameAr?: string;
  categoryNameEn?: string;
  expanded?: boolean;
}

@Component({
  selector: 'app-propose_pei',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    BackButtonComponent,
    InputSwitchModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './propose_pei.component.html',
  styleUrls: ['./propose_pei.component.css']
})
export class Propose_peiComponent implements OnInit, OnDestroy {
  profileId: number | null = null;
  categoriesWithPartielItems: CategoryWithPartielItems[] = [];
  filteredCategoriesWithPartielItems: CategoryWithPartielItems[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  currentLanguage: string = 'fr';
  searchTerm: string = '';
  updatingItems: Set<number> = new Set();
  private languageSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private profileItemService: ProfileItemService,
    private profileCategoryService: ProfileCategoryService,
    private profileDomainService: ProfileDomainService,
    private translate: TranslateService,
    private sharedService: SharedService,
    private messageService: MessageService
  ) {
    // Initialize current language
    this.currentLanguage = localStorage.getItem('selectedLanguage') || 'fr';
    this.translate.use(this.currentLanguage);
    
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
      this.currentLanguage = lang;
    });
  }

  ngOnInit() {
    // Get profileId from route params or localStorage
    this.route.params.subscribe(params => {
      const childId = params['childId'];
      if (childId) {
        this.profileId = parseInt(childId, 10);
        this.loadPartielItems();
      } else {
        // Try to get from localStorage
        const storedChildId = localStorage.getItem('selectedChildId');
        if (storedChildId) {
          this.profileId = parseInt(storedChildId, 10);
          this.loadPartielItems();
        } else {
          this.error = this.translate.instant('peu.no_profile_selected') || 'No profile selected';
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  loadPartielItems() {
    if (!this.profileId) {
      this.error = this.translate.instant('peu.no_profile_id') || 'No profile ID available';
      return;
    }

    this.isLoading = true;
    this.error = null;

    // Load categories
    this.profileCategoryService.getCategories(this.profileId).pipe(
      switchMap(categories => {
        if (categories.length === 0) {
          return of([]);
        }

        // For each category, load domains
        const categoryRequests = categories.map(category => 
          this.profileDomainService.getDomains(category.id || 0).pipe(
            switchMap(domains => {
              if (domains.length === 0) {
                return of({
                  ...category,
                  domains: []
                } as CategoryWithPartielItems);
              }

              // For each domain, load items and filter for PARTIEL
              const domainRequests = domains.map(domain => 
                this.profileItemService.getItems(domain.id, this.profileId).pipe(
                  map(items => {
                    // Filter items with etat === 'PARTIEL'
                    const partielItems = items.filter(item => item.etat === 'PARTIEL');
                    
                    // Normalize items to ensure both commentaire spellings are available
                    const normalizedPartielItems = partielItems.map(item => {
                      const commentaireValue = (item as any).commentaire || item.comentaire || '';
                      return {
                        ...item,
                        comentaire: commentaireValue,
                        commentaire: commentaireValue,
                        profile_domain_name: domain.name || '',
                        profile_domain_name_ar: domain.name_ar || '',
                        profile_domain_name_en: (domain as any).name_en || '',
                        profile_category_name: category.name || '',
                        profile_category_name_ar: category.name_ar || '',
                        profile_category_name_en: (category as any).name_en || ''
                      } as ProfileItem;
                    });

                    return {
                      ...domain,
                      partielItems: normalizedPartielItems,
                      categoryName: category.name || '',
                      categoryNameAr: category.name_ar || '',
                      categoryNameEn: (category as any).name_en || '',
                      expanded: false
                    } as DomainWithPartielItems;
                  }),
                  catchError(error => {
                    console.error(`Error loading items for domain ${domain.id}:`, error);
                    return of({
                      ...domain,
                      partielItems: [],
                      categoryName: category.name || '',
                      categoryNameAr: category.name_ar || '',
                      categoryNameEn: (category as any).name_en || '',
                      expanded: false
                    } as DomainWithPartielItems);
                  })
                )
              );

              return forkJoin(domainRequests).pipe(
                map(domainsWithItems => ({
                  ...category,
                  domains: domainsWithItems.filter(d => (d.partielItems?.length || 0) > 0)
                } as CategoryWithPartielItems))
              );
            }),
            catchError(error => {
              console.error(`Error loading domains for category ${category.id}:`, error);
              return of({
                ...category,
                domains: []
              } as CategoryWithPartielItems);
            })
          )
        );

        return forkJoin(categoryRequests);
      })
    ).subscribe({
      next: (results) => {
        // Filter out categories with no partiel items
        this.categoriesWithPartielItems = results.filter(cat => 
          cat.domains && cat.domains.length > 0
        );
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading partiel items:', error);
        this.error = this.translate.instant('peu.failed_to_load') || 'Failed to load items';
        this.isLoading = false;
      }
    });
  }

  applyFilter() {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredCategoriesWithPartielItems = [...this.categoriesWithPartielItems];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    this.filteredCategoriesWithPartielItems = this.categoriesWithPartielItems
      .map(category => {
        const filteredDomains = category.domains
          ?.map(domain => {
            const filteredItems = domain.partielItems?.filter(item => {
              const itemName = this.getItemName(item).toLowerCase();
              const itemDescription = this.getItemDescription(item).toLowerCase();
              const itemComment = this.getItemComment(item).toLowerCase();
              const domainName = this.getDomainName(domain).toLowerCase();
              const categoryName = this.getCategoryName(category).toLowerCase();

              return itemName.includes(searchLower) ||
                     itemDescription.includes(searchLower) ||
                     itemComment.includes(searchLower) ||
                     domainName.includes(searchLower) ||
                     categoryName.includes(searchLower);
            });

            if (filteredItems && filteredItems.length > 0) {
              return {
                ...domain,
                partielItems: filteredItems
              } as DomainWithPartielItems;
            }
            return null;
          })
          .filter((domain): domain is DomainWithPartielItems => domain !== null) || [];

        if (filteredDomains.length > 0) {
          return {
            ...category,
            domains: filteredDomains
          } as CategoryWithPartielItems;
        }
        return null;
      })
      .filter((category): category is CategoryWithPartielItems => category !== null);
  }

  onSearchChange() {
    this.applyFilter();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilter();
  }

  toggleDomain(categoryIndex: number, domainIndex: number) {
    const category = this.categoriesWithPartielItems[categoryIndex];
    if (category && category.domains) {
      const domain = category.domains[domainIndex];
      if (domain) {
        domain.expanded = !domain.expanded;
      }
    }
  }

  getLanguageField(item: any, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      return item[`${fieldName}_ar`] || item[fieldName] || '';
    } else if (this.currentLanguage === 'en') {
      return item[`${fieldName}_en`] || item[fieldName] || '';
    }
    return item[fieldName] || '';
  }

  getCategoryName(category: CategoryWithPartielItems): string {
    return this.getLanguageField(category, 'name');
  }

  getDomainName(domain: DomainWithPartielItems): string {
    return this.getLanguageField(domain, 'name');
  }

  getItemName(item: ProfileItem): string {
    return this.getLanguageField(item, 'name');
  }

  getItemDescription(item: ProfileItem): string {
    return this.getLanguageField(item, 'description');
  }

  getItemComment(item: ProfileItem): string {
    const comment = (item as any).commentaire || item.comentaire || '';
    return comment;
  }

  getTotalFilteredItems(): number {
    return this.filteredCategoriesWithPartielItems.reduce((total, category) => {
      return total + (category.domains?.reduce((domainTotal, domain) => {
        return domainTotal + (domain.partielItems?.length || 0);
      }, 0) || 0);
    }, 0);
  }

  toggleIsPeu(item: ProfileItem, categoryIndex: number, domainIndex: number, event: any) {
    if (!item.id) return;

    const itemId = item.id;
    const newIsPeuValue = event?.checked !== undefined ? event.checked : (item.isPeu ?? false);
    const originalIsPeuValue = !newIsPeuValue;

    // Mark item as updating
    this.updatingItems.add(itemId);

    // Save original state for rollback
    const originalItem = { ...item, isPeu: originalIsPeuValue };

    // Determine which categories array to use
    const categoriesArray = this.searchTerm ? this.filteredCategoriesWithPartielItems : this.categoriesWithPartielItems;
    const category = categoriesArray[categoryIndex];
    const domain = category?.domains?.[domainIndex];
    
    // Validate that category and domain exist
    if (!category || !domain) {
      this.updatingItems.delete(itemId);
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('propose_pei.update_error'),
        detail: this.translate.instant('propose_pei.update_error_detail'),
        life: 5000
      });
      return;
    }
    
    const items = domain.partielItems || [];
    const itemIndex = items.findIndex((i: ProfileItem) => i.id === itemId);

    // Call API to update status
    this.profileItemService.updateStatus(itemId, newIsPeuValue, false).subscribe({
      next: (updatedItem) => {
        // Update with the response from server
        if (itemIndex !== -1 && items[itemIndex]) {
          items[itemIndex] = { ...items[itemIndex], ...updatedItem };
        }
        
        // Also update in the original array if using filtered
        if (this.searchTerm && category.id && domain.id) {
          const originalCategory = this.categoriesWithPartielItems.find(cat => cat.id === category.id);
          const originalDomain = originalCategory?.domains?.find(d => d.id === domain.id);
          const originalItems = originalDomain?.partielItems || [];
          const originalItemIndex = originalItems.findIndex((i: ProfileItem) => i.id === itemId);
          if (originalItemIndex !== -1 && originalItems[originalItemIndex]) {
            originalItems[originalItemIndex] = { ...originalItems[originalItemIndex], ...updatedItem };
          }
        }

        this.updatingItems.delete(itemId);
      },
      error: (error) => {
        // Revert the optimistic update on error
        if (itemIndex !== -1 && items[itemIndex]) {
          items[itemIndex] = originalItem;
          item.isPeu = originalIsPeuValue;
        }

        this.updatingItems.delete(itemId);
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('propose_pei.update_error'),
          detail: error.message || this.translate.instant('propose_pei.update_error_detail'),
          life: 5000
        });
      }
    });
  }

  isItemUpdating(itemId: number): boolean {
    return this.updatingItems.has(itemId);
  }
}
