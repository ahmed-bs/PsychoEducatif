// src/app/items/items.component.ts
import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Category, Item,Domain, ProfileDataService } from 'src/app/core/services/profileData.service';
import { catchError, forkJoin, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css'],
  providers: [MessageService],
})
export class ItemsComponent implements OnInit {
  category: Category | null = null;
  domains: Domain[] = [];
  loading: boolean = true;
  showFilters: boolean = false;
  displayAddDomainDialog: boolean = false;
  displayAddItemDialog: boolean = false;
  displayEditDomainDialog: boolean = false;
  displayEditItemDialog: boolean = false;

  newDomain: Partial<Domain> = { name: '', description: '' };
  newItem: Partial<Item> = { name: '', description: '', etat: 'NON_COTE' };
  selectedDomain: Domain | null = null;
  selectedItem: Item | null = null;
  categoryId: number | null = null;
  profileId: number = 1; // Default profile ID; make dynamic if needed
  itemsByDomain: { [domainId: number]: Item[] } = {}; // Store items for each domain

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private profileDataService: ProfileDataService,
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
  this.profileDataService.getCategory(this.categoryId!).pipe(
    switchMap(category => {
      this.category = category;
      console.log('Category loaded:', category);
      return this.profileDataService.getDomainsByCategory(this.categoryId!);
    }),
    switchMap(domains => {
      this.domains = domains;
      const itemRequests = domains.map(domain => 
        this.profileDataService.getItemsByDomain(domain.id).pipe(
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

  showAddItemDialog(domain: Domain) {
    this.selectedDomain = domain;
    this.newItem = { name: '', description: '', etat: 'NON_COTE' };
    this.displayAddItemDialog = true;
  }

  showEditDomainDialog(domain: Domain) {
    this.selectedDomain = domain;
    this.newDomain = { ...domain };
    this.displayEditDomainDialog = true;
  }

  showEditItemDialog(item: Item, domain: Domain) {
    this.selectedDomain = domain;
    this.selectedItem = item;
    this.newItem = { ...item };
    this.displayEditItemDialog = true;
  }

  addDomain() {


    if (!this.newDomain.name || !this.category) {
      this.showError('Name is required');
      return;
    }
    this.profileDataService.createDomain(this.category.id, this.newDomain).subscribe({
      next: (domain) => {
        this.domains.push(domain);
        this.itemsByDomain[domain.id] = [];
        this.displayAddDomainDialog = false;
        this.showSuccess('Domain added successfully');
      },
      error: (error) => this.showError(error.message),
    });
  }

  addItem() {
    if (!this.newItem.name || !this.selectedDomain) {
      this.showError('Name is required');
      return;
    }
    this.profileDataService.createItem(this.selectedDomain.id, this.newItem).subscribe({
      next: (item) => {
        if (!this.itemsByDomain[this.selectedDomain!.id]) {
          this.itemsByDomain[this.selectedDomain!.id] = [];
        }
        this.itemsByDomain[this.selectedDomain!.id].push(item);
        this.domains = [...this.domains]; // Trigger change detection
        this.displayAddItemDialog = false;
        this.showSuccess('Item added successfully');
      },
      error: (error) => this.showError(error.message),
    });
  }

  updateDomain() {
    if (!this.newDomain.name || !this.selectedDomain) {
      this.showError('Name is required');
      return;
    }
    this.profileDataService.updateDomain(this.selectedDomain.id, this.newDomain).subscribe({
      next: (updatedDomain) => {
        const index = this.domains.findIndex((d) => d.id === updatedDomain.id);
        this.domains[index] = updatedDomain;
        this.displayEditDomainDialog = false;
        this.showSuccess('Domain updated successfully');
      },
      error: (error) => this.showError(error.message),
    });
  }

  updateItem() {
    if (!this.newItem.name || !this.selectedItem || !this.selectedDomain) {
      this.showError('Name is required');
      return;
    }
    this.profileDataService.updateItem(this.selectedItem.id, this.newItem).subscribe({
      next: (updatedItem) => {
        const itemIndex = this.itemsByDomain[this.selectedDomain!.id].findIndex((i) => i.id === updatedItem.id);
        this.itemsByDomain[this.selectedDomain!.id][itemIndex] = updatedItem;
        this.domains = [...this.domains]; // Trigger change detection
        this.displayEditItemDialog = false;
        this.showSuccess('Item updated successfully');
      },
      error: (error) => this.showError(error.message),
    });
  }

  deleteDomain(domain: Domain) {
    if (confirm(`Are you sure you want to delete ${domain.name}?`)) {
      this.profileDataService.deleteDomain(domain.id).subscribe({
        next: () => {
          this.domains = this.domains.filter((d) => d.id !== domain.id);
          delete this.itemsByDomain[domain.id];
          this.showSuccess('Domain deleted successfully');
        },
        error: (error) => this.showError(error.message),
      });
    }
  }

  deleteItem(item: Item, domain: Domain) {
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
      this.profileDataService.deleteItem(item.id).subscribe({
        next: () => {
          this.itemsByDomain[domain.id] = this.itemsByDomain[domain.id].filter((i) => i.id !== item.id);
          this.domains = [...this.domains]; // Trigger change detection
          this.showSuccess('Item deleted successfully');
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