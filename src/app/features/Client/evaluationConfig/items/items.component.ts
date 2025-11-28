import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, forkJoin, of, switchMap, tap } from 'rxjs';
import { ProfileCategory } from 'src/app/core/models/ProfileCategory';
import { ProfileDomain } from 'src/app/core/models/ProfileDomain';
import { ProfileItem } from 'src/app/core/models/ProfileItem';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { ProfileItemService } from 'src/app/core/services/ProfileItem.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { InputSwitchModule } from 'primeng/inputswitch';

type ItemStatus = ProfileItem['etat'];

interface NewDomain {
  id?: number;
  name: string;
  description: string;
}

interface DomainWithUI extends ProfileDomain {
  expanded?: boolean;
}

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css'],
  providers: [MessageService],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class ItemsComponent implements OnInit, OnDestroy {
  category: ProfileCategory | null = null;
  domains: DomainWithUI[] = [];
  domainsWithDisplayNames: any[] = [];
  loading: boolean = true;
  showFilters: boolean = false;
  displayAddDomainDialog = false;
  displayAddItemDialog = false;
  displayAddCompetenceDialog = false;
  editingCompetence = false;
  currentLanguage: string = 'fr';
  private languageSubscription: Subscription;
  
  newDomain: NewDomain = {
    name: '',
    description: ''
  };

  newItem: Partial<ProfileItem> = { 
    name: '', 
    description: '', 
    etat: 'NON_COTE' 
  };
  
  selectedDomain: DomainWithUI | null = null;
  selectedItem: ProfileItem | null = null;
  categoryId: number | null = null;
  profileId: number = 1;
  itemsByDomain: Record<number, ProfileItem[]> = {};
  selectedDescriptionItem: ProfileItem | null = null;

  statusOptions = [
    { label: this.translate.instant('items.items_by_domain.status_labels.NON_COTE'), value: 'NON_COTE' as ItemStatus },
    { label: this.translate.instant('items.items_by_domain.status_labels.ACQUIS'), value: 'ACQUIS' as ItemStatus },
    { label: this.translate.instant('items.items_by_domain.status_labels.PARTIEL'), value: 'PARTIEL' as ItemStatus },
    { label: this.translate.instant('items.items_by_domain.status_labels.NON_ACQUIS'), value: 'NON_ACQUIS' as ItemStatus }
  ];

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private profileCategoryService: ProfileCategoryService,
    private profileDomainService: ProfileDomainService,
    private profileItemService: ProfileItemService,
    private messageService: MessageService,
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
    // Initialize current language
    this.currentLanguage = localStorage.getItem('selectedLanguage') || 'fr';
    
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
      this.currentLanguage = lang;
      // Update status options when language changes
      this.updateStatusOptions();
      // Update domains with display names when language changes
      this.updateDomainsWithDisplayNames();
      // Update form fields if editing
      this.updateFormFieldsForLanguage();
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.categoryId = +params['categoryId'] || null;
      if (this.categoryId) {
        this.loadData();
      } else {
        this.translate.get('items.messages.error.no_category_id').subscribe((text) => {
          this.showError(text);
        });
        this.loading = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  private updateStatusOptions() {
    this.statusOptions = [
      { label: this.translate.instant('items.items_by_domain.status_labels.NON_COTE'), value: 'NON_COTE' as ItemStatus },
      { label: this.translate.instant('items.items_by_domain.status_labels.ACQUIS'), value: 'ACQUIS' as ItemStatus },
      { label: this.translate.instant('items.items_by_domain.status_labels.PARTIEL'), value: 'PARTIEL' as ItemStatus },
      { label: this.translate.instant('items.items_by_domain.status_labels.NON_ACQUIS'), value: 'NON_ACQUIS' as ItemStatus }
    ];
  }

  getEtatLabel(etat: string): string {
    return this.translate.instant('items.items_by_domain.status_labels.' + etat) || this.translate.instant('items.items_by_domain.status_labels.NON_COTE');
  }

  // Helper method to get the appropriate field for ProfileItem based on language
  getItemLanguageField(item: ProfileItem, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      // For Arabic language, use _ar fields
      if (fieldName === 'name') {
        return item.name_ar || '';
      } else if (fieldName === 'description') {
        return item.description_ar || '';
      } else if (fieldName === 'comentaire') {
        return item.commentaire_ar || '';
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

  // Show description popup for mobile
  showDescriptionPopup(item: ProfileItem, event: Event): void {
    event.stopPropagation();
    this.selectedDescriptionItem = item;
  }

  // Hide description popup
  hideDescriptionPopup(): void {
    this.selectedDescriptionItem = null;
  }

  // Check if description popup is open for an item
  isDescriptionPopupOpen(item: ProfileItem): boolean {
    return this.selectedDescriptionItem?.id === item.id;
  }

  // Helper method to get the appropriate field for ProfileDomain based on language
  getDomainLanguageField(domain: ProfileDomain, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      // For Arabic language, use _ar fields
      if (fieldName === 'name') {
        return domain.name_ar || '';
      } else if (fieldName === 'description') {
        return domain.description_ar || '';
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

  // Helper method to get the display name for domain dropdown
  getDomainDisplayName(domain: ProfileDomain): string {
    return this.getDomainLanguageField(domain, 'name');
  }

  // Update domains with display names for dropdown
  private updateDomainsWithDisplayNames() {
    this.domainsWithDisplayNames = this.domains.map(domain => ({
      ...domain,
      displayName: this.getDomainLanguageField(domain, 'name')
    }));
  }

  loadData() {
    if (!this.categoryId) return;
    
    this.loading = true;
    this.profileCategoryService.retrieve(this.categoryId).pipe(
      switchMap(category => {
        this.category = category;
        return this.profileDomainService.getDomains(this.categoryId!);
      }),
      switchMap(domains => {
        this.domains = domains as DomainWithUI[];
        this.updateDomainsWithDisplayNames();
        const itemRequests = domains.map(domain => 
          this.profileItemService.getItems(domain.id).pipe(
            tap(items => {
              this.itemsByDomain[domain.id] = items;
            }),
            catchError(error => {
              console.error(`Error loading items for domain ${domain.id}`, error);
              return of([]);
            })
          )
        );
        return forkJoin(itemRequests);
      })
    ).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.translate.get('items.messages.error.load_data_failed').subscribe((text) => {
          this.showError(text);
        });
        this.loading = false;
      }
    });
  }

  addDomain() {
    if (!this.categoryId) {
      this.translate.get('items.messages.error.name_and_category_required').subscribe((text) => {
        this.showError(text);
      });
      return;
    }

    // Validate language-specific content
    if (!this.validateLanguageContent('domain')) {
      return;
    }

    let createData: any = { ...this.newDomain };

    // Handle Arabic fields for backend create
    if (this.currentLanguage === 'ar') {
      createData = {
        name_ar: this.newDomain.name,
        description_ar: this.newDomain.description
        // Don't send name and description when using Arabic fields
      };
    } else {
      createData = {
        name: this.newDomain.name,
        description: this.newDomain.description
        // Don't send name_ar and description_ar when using French fields
      };
    }

    this.profileDomainService.create(this.categoryId, createData).subscribe({
      next: (domain) => {
        this.domains.push(domain as DomainWithUI);
        this.itemsByDomain[domain.id] = [];
        this.updateDomainsWithDisplayNames();
        this.closeDomainDialog();
        this.translate.get('items.messages.success.domain_added').subscribe((text) => {
          this.showSuccess(text);
        });
      },
      error: (error) => {
        this.translate.get('items.messages.error.generic_error', { error: error.message }).subscribe((text) => {
          this.showError(text);
        });
      }
    });
  }

  addItem() {
    if (!this.selectedDomain?.id) {
      this.translate.get('items.messages.error.name_and_domain_required').subscribe((text) => {
        this.showError(text);
      });
      return;
    }

    // Validate language-specific content
    if (!this.validateLanguageContent('item')) {
      return;
    }

    const domainId = this.selectedDomain.id;
    let createData: any = { ...this.newItem };

    // Handle Arabic fields for backend create
    if (this.currentLanguage === 'ar') {
      createData = {
        name_ar: this.newItem.name,
        description_ar: this.newItem.description,
        etat: this.newItem.etat
        // Don't send name and description when using Arabic fields
      };
    } else {
      createData = {
        name: this.newItem.name,
        description: this.newItem.description,
        etat: this.newItem.etat
        // Don't send name_ar and description_ar when using French fields
      };
    }

    this.profileItemService.create(domainId, createData).subscribe({
      next: (item) => {
        if (!this.itemsByDomain[domainId]) {
          this.itemsByDomain[domainId] = [];
        }
        this.itemsByDomain[domainId].push(item);
        this.closeItemDialog();
        this.translate.get('items.messages.success.item_added').subscribe((text) => {
          this.showSuccess(text);
        });
      },
      error: (error) => {
        this.translate.get('items.messages.error.generic_error', { error: error.message }).subscribe((text) => {
          this.showError(text);
        });
      }
    });
  }

  updateDomain() {
    if (!this.selectedDomain?.id) {
      this.translate.get('items.messages.error.name_and_domain_required').subscribe((text) => {
        this.showError(text);
      });
      return;
    }

    // Validate language-specific content
    if (!this.validateLanguageContent('domain')) {
      return;
    }

    const domainId = this.selectedDomain.id;
    let updateData: any = { ...this.newDomain };

    // Handle Arabic fields for backend update
    if (this.currentLanguage === 'ar') {
      updateData = {
        name_ar: this.newDomain.name,
        description_ar: this.newDomain.description
        // Don't send name and description when using Arabic fields
      };
    } else {
      updateData = {
        name: this.newDomain.name,
        description: this.newDomain.description
        // Don't send name_ar and description_ar when using French fields
      };
    }

    this.profileDomainService.update(domainId, updateData).subscribe({
      next: (updatedDomain) => {
        const index = this.domains.findIndex((d) => d.id === updatedDomain.id);
        if (index !== -1) {
          this.domains[index] = updatedDomain as DomainWithUI;
          // Update domainsWithDisplayNames as well
          this.updateDomainsWithDisplayNames();
        }
        this.closeDomainDialog();
        this.translate.get('items.messages.success.domain_updated').subscribe((text) => {
          this.showSuccess(text);
        });
      },
      error: (error) => {
        this.translate.get('items.messages.error.generic_error', { error: error.message }).subscribe((text) => {
          this.showError(text);
        });
      }
    });
  }

  updateItem() {
    if (!this.selectedDomain?.id || !this.selectedItem?.id) {
      this.translate.get('items.messages.error.name_item_domain_required').subscribe((text) => {
        this.showError(text);
      });
      return;
    }

    // Validate language-specific content
    if (!this.validateLanguageContent('item')) {
      return;
    }

    const domainId = this.selectedDomain.id;
    const itemId = this.selectedItem.id;
    let updateData: any = { ...this.newItem };

    // Handle Arabic fields for backend update
    if (this.currentLanguage === 'ar') {
      updateData = {
        name_ar: this.newItem.name,
        description_ar: this.newItem.description,
        etat: this.newItem.etat
        // Don't send name and description when using Arabic fields
      };
    } else {
      updateData = {
        name: this.newItem.name,
        description: this.newItem.description,
        etat: this.newItem.etat
        // Don't send name_ar and description_ar when using French fields
      };
    }

    this.profileItemService.update(itemId, updateData).subscribe({
      next: (updatedItem) => {
        const items = this.itemsByDomain[domainId] || [];
        const itemIndex = items.findIndex((i: ProfileItem) => i.id === updatedItem.id);
        if (itemIndex !== -1) {
          this.itemsByDomain[domainId][itemIndex] = updatedItem;
        }
        this.closeItemDialog();
        this.translate.get('items.messages.success.item_updated').subscribe((text) => {
          this.showSuccess(text);
        });
      },
      error: (error) => {
        this.translate.get('items.messages.error.generic_error', { error: error.message }).subscribe((text) => {
          this.showError(text);
        });
      }
    });
  }

  deleteDomain(domain: DomainWithUI) {
    if (!domain.id) return;

    this.translate.get('items.messages.confirm.delete_domain', { domainName: this.getDomainLanguageField(domain, 'name') }).subscribe((message) => {
      if (!confirm(message)) {
        return;
      }

      const domainId = domain.id;
      this.profileDomainService.destroy(domainId).subscribe({
        next: () => {
          this.domains = this.domains.filter((d) => d.id !== domainId);
          delete this.itemsByDomain[domainId];
          this.translate.get('items.messages.success.domain_deleted').subscribe((text) => {
            this.showSuccess(text);
          });
        },
        error: (error) => {
          this.translate.get('items.messages.error.generic_error', { error: error.message }).subscribe((text) => {
            this.showError(text);
          });
        }
      });
    });
  }

  deleteItem(item: ProfileItem, domain: DomainWithUI) {
    if (!item.id || !domain.id) return;

    this.translate.get('items.messages.confirm.delete_item', { itemName: item.name }).subscribe((message) => {
      if (!confirm(message)) {
        return;
      }

      const domainId = domain.id;
      const itemId = item.id;

      this.profileItemService.destroy(itemId).subscribe({
        next: () => {
          if (this.itemsByDomain[domainId]) {
            this.itemsByDomain[domainId] = this.itemsByDomain[domainId].filter(
              (i: ProfileItem) => i.id !== itemId
            );
          }
          this.translate.get('items.messages.success.item_deleted').subscribe((text) => {
            this.showSuccess(text);
          });
        },
        error: (error) => {
          this.translate.get('items.messages.error.generic_error', { error: error.message }).subscribe((text) => {
            this.showError(text);
          });
        }
      });
    });
  }

  toggleIsPeu(item: ProfileItem, domain: DomainWithUI, event: any) {
    if (!item.id || !domain.id) return;

    const domainId = domain.id;
    const itemId = item.id;
    
    // Get the new value from the event (PrimeNG InputSwitch onChange provides event.checked)
    // If event.checked is not available, use item.isPeu (which ngModel has already updated)
    const newIsPeuValue = event?.checked !== undefined ? event.checked : (item.isPeu ?? false);
    
    // Save the original item state for potential rollback
    // Since ngModel updates before onChange, we reverse the new value to get the original
    const originalIsPeuValue = !newIsPeuValue;
    const originalItem = { ...item, isPeu: originalIsPeuValue };

    // The UI is already updated by ngModel, so we just need to call the API
    const items = this.itemsByDomain[domainId] || [];
    const itemIndex = items.findIndex((i: ProfileItem) => i.id === itemId);

    // Call API to update status (always send done: false as per requirements)
    this.profileItemService.updateStatus(itemId, newIsPeuValue, false).subscribe({
      next: (updatedItem) => {
        // Update with the response from server
        if (itemIndex !== -1) {
          this.itemsByDomain[domainId][itemIndex] = updatedItem;
        }
      },
      error: (error) => {
        // Revert the optimistic update on error
        if (itemIndex !== -1) {
          this.itemsByDomain[domainId][itemIndex] = originalItem;
          // Also revert the ngModel binding
          item.isPeu = originalIsPeuValue;
        }
        this.translate.get('items.messages.error.generic_error', { error: error.message }).subscribe((text) => {
          this.showError(text);
        });
      }
    });
  }

  toggleDomain(domain: DomainWithUI) {
    domain.expanded = !domain.expanded;
  }

  saveCompetence() {
    this.displayAddCompetenceDialog = false;
    this.editingCompetence = false;
  }

  showSuccess(message: string) {
    this.messageService.add({ severity: 'success', summary: this.translate.instant('items.messages.success.summary'), detail: message });
  }

  showError(message: string) {
    this.messageService.add({ severity: 'error', summary: this.translate.instant('items.messages.error.summary'), detail: message });
  }

  goBack() {
    this.location.back();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  showAddDomainDialog() {
    this.newDomain = { name: '', description: '' };
    this.displayAddDomainDialog = true;
  }

  showAddItemDialog(domain: DomainWithUI) {
    this.selectedDomain = domain;
    this.resetNewItem();
    this.displayAddItemDialog = true;
  }

  showEditDomainDialog(domain: DomainWithUI) {
    this.selectedDomain = domain;
    if (this.currentLanguage === 'ar') {
      // For Arabic, use _ar fields
      this.newDomain = {
        id: domain.id,
        name: domain.name_ar || '',
        description: domain.description_ar || ''
      };
    } else {
      // For French, use regular fields
      this.newDomain = {
        id: domain.id,
        name: domain.name || '',
        description: domain.description || ''
      };
    }
    this.displayAddDomainDialog = true;
  }

  closeDomainDialog() {
    this.displayAddDomainDialog = false;
    this.selectedDomain = null;
    this.newDomain = { name: '', description: '' };
  }

  closeItemDialog() {
    this.displayAddItemDialog = false;
    this.selectedDomain = null;
    this.selectedItem = null;
    this.resetNewItem();
  }

  showEditItemDialog(item: ProfileItem, domain: DomainWithUI) {
    this.selectedDomain = domain;
    this.selectedItem = item;
    if (this.currentLanguage === 'ar') {
      // For Arabic, use _ar fields
      this.newItem = {
        id: item.id,
        name: item.name_ar || '',
        description: item.description_ar || '',
        etat: item.etat
      };
    } else {
      // For French, use regular fields
      this.newItem = {
        id: item.id,
        name: item.name || '',
        description: item.description || '',
        etat: item.etat
      };
    }
    this.displayAddItemDialog = true;
  }

  private resetNewItem() {
    this.newItem = { 
      name: '', 
      description: '', 
      etat: 'NON_COTE' 
    };
    this.selectedItem = null;
  }

  isEditingDomain(): boolean {
    return this.newDomain.id !== undefined && this.newDomain.id !== null;
  }

  isEditingItem(): boolean {
    return this.selectedItem !== null;
  }

  private updateFormFieldsForLanguage() {
    // Update domain form if editing
    if (this.isEditingDomain() && this.selectedDomain) {
      if (this.currentLanguage === 'ar') {
        this.newDomain.name = this.selectedDomain.name_ar || '';
        this.newDomain.description = this.selectedDomain.description_ar || '';
      } else {
        this.newDomain.name = this.selectedDomain.name || '';
        this.newDomain.description = this.selectedDomain.description || '';
      }
    }

    // Update item form if editing
    if (this.isEditingItem() && this.selectedItem) {
      if (this.currentLanguage === 'ar') {
        this.newItem.name = this.selectedItem.name_ar || '';
        this.newItem.description = this.selectedItem.description_ar || '';
      } else {
        this.newItem.name = this.selectedItem.name || '';
        this.newItem.description = this.selectedItem.description || '';
      }
    }
  }

  private validateLanguageContent(type: 'domain' | 'item'): boolean {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const frenchPattern = /[àâäéèêëïîôöùûüÿç]/i;
    
    let name: string = '';
    let description: string = '';
    
    if (type === 'domain') {
      name = this.newDomain.name;
      description = this.newDomain.description;
    } else {
      name = this.newItem.name || '';
      description = this.newItem.description || '';
    }

    // Check if fields are empty
    if (!name.trim()) {
      this.translate.get('items.messages.error.name_required').subscribe((text) => {
        this.showError(text);
      });
      return false;
    }

    if (this.currentLanguage === 'ar') {
      // For Arabic language, check if content contains Arabic characters
      if (!arabicPattern.test(name)) {
        this.translate.get('items.messages.error.arabic_content_required').subscribe((text) => {
          this.showError(text);
        });
        return false;
      }
      
      if (description && !arabicPattern.test(description)) {
        this.translate.get('items.messages.error.arabic_description_required').subscribe((text) => {
          this.showError(text);
        });
        return false;
      }
    } else {
      // For French language, check if content contains French characters
      if (!frenchPattern.test(name)) {
        this.translate.get('items.messages.error.french_content_required').subscribe((text) => {
          this.showError(text);
        });
        return false;
      }
      
      if (description && !frenchPattern.test(description)) {
        this.translate.get('items.messages.error.french_description_required').subscribe((text) => {
          this.showError(text);
        });
        return false;
      }
    }

    return true;
  }


}