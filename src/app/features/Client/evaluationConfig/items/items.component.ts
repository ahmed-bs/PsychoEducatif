import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';

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
export class ItemsComponent implements OnInit {
  category: ProfileCategory | null = null;
  domains: DomainWithUI[] = [];
  loading: boolean = true;
  showFilters: boolean = false;
  displayAddDomainDialog = false;
  displayAddItemDialog = false;
  displayAddCompetenceDialog = false;
  editingCompetence = false;
  
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
    private translate: TranslateService
  ) {
    this.translate.addLangs(['fr', 'ar']);
    this.translate.setDefaultLang('fr');
    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang?.match(/fr|ar/) ? browserLang : 'fr');
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

  getEtatLabel(etat: string): string {
    return this.translate.instant('items.items_by_domain.status_labels.' + etat) || this.translate.instant('items.items_by_domain.status_labels.NON_COTE');
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
    if (!this.newDomain.name || !this.categoryId) {
      this.translate.get('items.messages.error.name_and_category_required').subscribe((text) => {
        this.showError(text);
      });
      return;
    }

    this.profileDomainService.create(this.categoryId, this.newDomain).subscribe({
      next: (domain) => {
        this.domains.push(domain as DomainWithUI);
        this.itemsByDomain[domain.id] = [];
        this.displayAddDomainDialog = false;
        this.translate.get('items.messages.success.domain_added').subscribe((text) => {
          this.showSuccess(text);
        });
        this.newDomain = { name: '', description: '' };
      },
      error: (error) => {
        this.translate.get('items.messages.error.generic_error', { error: error.message }).subscribe((text) => {
          this.showError(text);
        });
      }
    });
  }

  addItem() {
    if (!this.selectedDomain?.id || !this.newItem.name) {
      this.translate.get('items.messages.error.name_and_domain_required').subscribe((text) => {
        this.showError(text);
      });
      return;
    }

    const domainId = this.selectedDomain.id;
    this.profileItemService.create(domainId, this.newItem).subscribe({
      next: (item) => {
        if (!this.itemsByDomain[domainId]) {
          this.itemsByDomain[domainId] = [];
        }
        this.itemsByDomain[domainId].push(item);
        this.displayAddItemDialog = false;
        this.translate.get('items.messages.success.item_added').subscribe((text) => {
          this.showSuccess(text);
        });
        this.resetNewItem();
      },
      error: (error) => {
        this.translate.get('items.messages.error.generic_error', { error: error.message }).subscribe((text) => {
          this.showError(text);
        });
      }
    });
  }

  updateDomain() {
    if (!this.selectedDomain?.id || !this.newDomain.name) {
      this.translate.get('items.messages.error.name_and_domain_required').subscribe((text) => {
        this.showError(text);
      });
      return;
    }

    const domainId = this.selectedDomain.id;
    this.profileDomainService.update(domainId, this.newDomain).subscribe({
      next: (updatedDomain) => {
        const index = this.domains.findIndex((d) => d.id === updatedDomain.id);
        if (index !== -1) {
          this.domains[index] = updatedDomain as DomainWithUI;
        }
        this.displayAddDomainDialog = false;
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
    if (!this.selectedDomain?.id || !this.selectedItem?.id || !this.newItem.name) {
      this.translate.get('items.messages.error.name_item_domain_required').subscribe((text) => {
        this.showError(text);
      });
      return;
    }

    const domainId = this.selectedDomain.id;
    const itemId = this.selectedItem.id;

    this.profileItemService.update(itemId, this.newItem).subscribe({
      next: (updatedItem) => {
        const items = this.itemsByDomain[domainId] || [];
        const itemIndex = items.findIndex((i: ProfileItem) => i.id === updatedItem.id);
        if (itemIndex !== -1) {
          this.itemsByDomain[domainId][itemIndex] = updatedItem;
        }
        this.displayAddItemDialog = false;
        this.translate.get('items.messages.success.item_updated').subscribe((text) => {
          this.showSuccess(text);
        });
        this.resetNewItem();
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

    this.translate.get('items.messages.confirm.delete_domain', { domainName: domain.name }).subscribe((message) => {
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
    this.newDomain = { ...domain };
    this.displayAddDomainDialog = true;
  }

  showEditItemDialog(item: ProfileItem, domain: DomainWithUI) {
    this.selectedDomain = domain;
    this.selectedItem = item;
    this.newItem = { ...item };
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
}