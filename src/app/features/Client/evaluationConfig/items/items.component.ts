// src/app/items/items.component.ts
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
  encapsulation: ViewEncapsulation.ShadowDom
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
    { label: 'Non coté', value: 'NON_COTE' as ItemStatus },
    { label: 'Acquis', value: 'ACQUIS' as ItemStatus },
    { label: 'Partiel', value: 'PARTIEL' as ItemStatus },
    { label: 'Non acquis', value: 'NON_ACQUIS' as ItemStatus }
  ];

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private profileCategoryService: ProfileCategoryService,
    private profileDomainService: ProfileDomainService,
    private profileItemService: ProfileItemService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.categoryId = +params['categoryId'] || null;
      if (this.categoryId) {
        this.loadData();
      } else {
        this.showError('No category ID provided');
        this.loading = false;
      }
    });
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
        this.showError('Failed to load data');
        this.loading = false;
      }
    });
  }

  addDomain() {
    if (!this.newDomain.name || !this.categoryId) {
      this.showError('Name and category are required');
      return;
    }

    this.profileDomainService.create(this.categoryId, this.newDomain).subscribe({
      next: (domain) => {
        this.domains.push(domain as DomainWithUI);
        this.itemsByDomain[domain.id] = [];
        this.displayAddDomainDialog = false;
        this.showSuccess('Domain added successfully');
        this.newDomain = { name: '', description: '' };
      },
      error: (error) => this.showError(error.message)
    });
  }

  addItem() {
    if (!this.selectedDomain?.id || !this.newItem.name) {
      this.showError('Name and domain are required');
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
        this.showSuccess('Item added successfully');
        this.resetNewItem();
      },
      error: (error) => this.showError(error.message)
    });
  }

  updateDomain() {
    if (!this.selectedDomain?.id || !this.newDomain.name) {
      this.showError('Name and domain are required');
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
        this.showSuccess('Domain updated successfully');
      },
      error: (error) => this.showError(error.message)
    });
  }

  updateItem() {
    if (!this.selectedDomain?.id || !this.selectedItem?.id || !this.newItem.name) {
      this.showError('Name, item, and domain are required');
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
        this.showSuccess('Item updated successfully');
        this.resetNewItem();
      },
      error: (error) => this.showError(error.message)
    });
  }

  deleteDomain(domain: DomainWithUI) {
    if (!domain.id || !confirm(`Are you sure you want to delete ${domain.name}?`)) {
      return;
    }

    const domainId = domain.id;
    this.profileDomainService.destroy(domainId).subscribe({
      next: () => {
        this.domains = this.domains.filter((d) => d.id !== domainId);
        delete this.itemsByDomain[domainId];
        this.showSuccess('Domain deleted successfully');
      },
      error: (error) => this.showError(error.message)
    });
  }

  deleteItem(item: ProfileItem, domain: DomainWithUI) {
    if (!item.id || !domain.id || !confirm(`Are you sure you want to delete ${item.name}?`)) {
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
        this.showSuccess('Item deleted successfully');
      },
      error: (error) => this.showError(error.message)
    });
  }

  toggleDomain(domain: DomainWithUI) {
    domain.expanded = !domain.expanded;
  }


  saveCompetence() {
    // Implement save/update logic
    this.displayAddCompetenceDialog = false;
    this.editingCompetence = false;
  }

  showSuccess(message: string) {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
  }

  showError(message: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
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