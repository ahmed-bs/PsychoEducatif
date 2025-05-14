// src/app/items/items.component.ts
import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css'],
  providers: [MessageService],
})
export class ItemsComponent implements OnInit {
  category: ProfileCategory | null = null;
  domains: ProfileDomain[] = [];
  loading: boolean = true;
  showFilters: boolean = false;
  displayAddDomainDialog: boolean = false;
  displayAddItemDialog: boolean = false;

  newDomain: Partial<ProfileDomain> = { name: '', description: '' };
  newItem: Partial<ProfileItem> = { name: '', description: '', etat: 'NON_COTE' };
  selectedDomain: ProfileDomain | null = null;
  selectedItem: ProfileItem | null = null;
  categoryId: number | null = null;
  profileId: number = 1; // Default profile ID; make dynamic if needed
  itemsByDomain: { [domainId: number]: ProfileItem[] } = {}; // Store items for each domain

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
console.log('Query params:', params);

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
  this.loading = true;
  
  // Using RxJS operators for better async handling
  this.profileCategoryService.retrieve(this.categoryId!).pipe(
    switchMap(category => {
      this.category = category;
      console.log('ProfileCategory loaded:', category);
      return this.profileDomainService.getDomains(this.categoryId!);
    }),
    switchMap(domains => {
      this.domains = domains;
      const itemRequests = domains.map(domain => 
        this.profileItemService.getItems(domain.id).pipe(
          tap(items => {
            this.itemsByDomain[domain.id] = items;
          }),
          catchError(error => {
            console.error(`Error loading items for domain ${domain.id}`, error);
            return of([]); // Return empty array on error
          })
        )
      );
      return forkJoin(itemRequests);
    })
  ).subscribe({
    next: () => {
      this.domains = [...this.domains]; // Trigger change detection
      this.loading = false;
    },
    error: (error) => {
      console.error('Error loading data:', error);
      this.showError('Failed to load data');
      this.loading = false;
    }
  });
  this.loading = false;
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

  showAddItemDialog(domain: ProfileDomain) {
    this.selectedDomain = domain;
    this.newItem = { name: '', description: '', etat: 'NON_COTE' };
    this.displayAddItemDialog = true;
  }

  showEditDomainDialog(domain: ProfileDomain) {
    this.selectedDomain = domain;
    this.newDomain = { ...domain };
    this.displayAddDomainDialog = true;
  }

  showEditItemDialog(item: ProfileItem, domain: ProfileDomain) {
    this.selectedDomain = domain;
    this.selectedItem = item;
    this.newItem = { ...item };
    this.displayAddItemDialog = true;
  }

  addDomain() {


    if (!this.newDomain.name || !this.category) {
      this.showError('Name is required');
      return;
    }
    this.profileDomainService.create(this.category.id!, this.newDomain).subscribe({
      next: (domain) => {
        this.domains.push(domain);
        this.itemsByDomain[domain.id] = [];
        this.displayAddDomainDialog = false;
        this.showSuccess('ProfileDomain added successfully');
      },
      error: (error) => this.showError(error.message),
    });
  }

  addItem() {
    if (!this.newItem.name || !this.selectedDomain) {
      this.showError('Name is required');
      return;
    }
    this.profileItemService.create(this.selectedDomain.id, this.newItem).subscribe({
      next: (item) => {
        if (!this.itemsByDomain[this.selectedDomain!.id]) {
          this.itemsByDomain[this.selectedDomain!.id] = [];
        }
        this.itemsByDomain[this.selectedDomain!.id].push(item);
        this.domains = [...this.domains]; // Trigger change detection
        this.displayAddItemDialog = false;
        this.showSuccess('ProfileItem added successfully');
      },
      error: (error) => this.showError(error.message),
    });
  }

  updateDomain() {
    if (!this.newDomain.name || !this.selectedDomain) {
      this.showError('Name is required');
      return;
    }
    this.profileDomainService.update(this.selectedDomain.id, this.newDomain).subscribe({
      next: (updatedDomain) => {
        const index = this.domains.findIndex((d) => d.id === updatedDomain.id);
        this.domains[index] = updatedDomain;
        this.displayAddDomainDialog = false;
        this.showSuccess('ProfileDomain updated successfully');
      },
      error: (error) => this.showError(error.message),
    });
  }

  updateItem() {
    if (!this.newItem.name || !this.selectedItem || !this.selectedDomain) {
      this.showError('Name is required');
      return;
    }
    this.profileItemService.update(this.selectedItem.id, this.newItem).subscribe({
      next: (updatedItem) => {
        const itemIndex = this.itemsByDomain[this.selectedDomain!.id].findIndex((i) => i.id === updatedItem.id);
        this.itemsByDomain[this.selectedDomain!.id][itemIndex] = updatedItem;
        this.domains = [...this.domains]; // Trigger change detection
        this.displayAddItemDialog = false;
        this.showSuccess('ProfileItem updated successfully');
      },
      error: (error) => this.showError(error.message),
    });
  }

  deleteDomain(domain: ProfileDomain) {
    if (confirm(`Are you sure you want to delete ${domain.name}?`)) {
      this.profileDomainService.destroy(domain.id).subscribe({
        next: () => {
          this.domains = this.domains.filter((d) => d.id !== domain.id);
          delete this.itemsByDomain[domain.id];
          this.showSuccess('ProfileDomain deleted successfully');
        },
        error: (error) => this.showError(error.message),
      });
    }
  }

  deleteItem(item: ProfileItem, domain: ProfileDomain) {
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
      this.profileItemService.destroy(item.id).subscribe({
        next: () => {
          this.itemsByDomain[domain.id] = this.itemsByDomain[domain.id].filter((i) => i.id !== item.id);
          this.domains = [...this.domains]; // Trigger change detection
          this.showSuccess('ProfileItem deleted successfully');
        },
        error: (error) => this.showError(error.message),
      });
    }
  }

  showSuccess(message: string) {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
  }

  showError(message: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }
}