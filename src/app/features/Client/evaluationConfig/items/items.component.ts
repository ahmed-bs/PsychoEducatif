import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { MessageService } from 'primeng/api';
import { Category, Domain, Item, ProfileDataService } from 'src/app/core/services/profileData.service';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css'],
  providers: [MessageService]
})
export class ItemsComponent implements OnInit {
  category: Category | null = null;
  domaines: Domain[] = [];
  loading: boolean = true;
  showFilters: boolean = false;
  displayAddDomainDialog: boolean = false;
  displayAddItemDialog: boolean = false;
  displayEditDialog: boolean = false;
  editMode: 'domain' | 'item' | null = null;

  newDomain: Partial<Domain> = {
    name: '',
    description: '',
    level: 'Niveau 1',
    code: ''
  };

  newItem: Partial<Item> = {
    name: '',
    description: '',
    code: ''
  };

  selectedDomain: Domain | null = null;
  selectedItem: Item | null = null;

  constructor(
    private location: Location,
    private profileDataService: ProfileDataService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.profileDataService.getCategories().subscribe({
      next: (categories) => {
        const targetCategory = categories.find(c => c.name === 'Grille évaluation tout petit 1 à 5ans');
        if (targetCategory) {
          this.category = targetCategory;
          this.profileDataService.getDomainsByCategory(targetCategory.id).subscribe({
            next: (domains) => {
              this.domaines = domains;
              // Fetch items for each domain
              domains.forEach(domain => {
                this.profileDataService.getItemsByDomain(domain.id).subscribe({
                  next: (items) => {
                    domain.items = items;
                    this.domaines = [...this.domaines]; // Trigger change detection
                  },
                  error: () => this.showError('Failed to load items')
                });
              });
              this.loading = false;
            },
            error: () => {
              this.showError('Failed to load domains');
              this.loading = false;
            }
          });
        } else {
          this.showError('Category not found');
          this.loading = false;
        }
      },
      error: () => {
        this.showError('Failed to load category');
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
    this.newDomain = { name: '', description: '', level: 'Niveau 1', code: '' };
    this.displayAddDomainDialog = true;
  }

  showAddItemDialog(domain: Domain) {
    this.selectedDomain = domain;
    this.newItem = { name: '', description: '', code: '' };
    this.displayAddItemDialog = true;
  }

  addDomain() {
    if (this.newDomain.name && this.newDomain.code && this.category) {
      this.newDomain.template_category = this.category.id;
      this.profileDataService.createDomain(this.newDomain).subscribe({
        next: (domain) => {
          domain.items = [];
          this.domaines.push(domain);
          this.displayAddDomainDialog = false;
          this.showSuccess('Domain added successfully');
        },
        error: () => this.showError('Failed to add domain')
      });
    }
  }

  addItem() {
    if (this.newItem.name && this.newItem.code && this.selectedDomain) {
      this.newItem.template_domain = this.selectedDomain.id;
      this.profileDataService.createItem(this.newItem).subscribe({
        next: (item) => {
          if (!this.selectedDomain!.items) {
            this.selectedDomain!.items = [];
          }
          this.selectedDomain!.items.push(item);
          this.domaines = [...this.domaines]; // Trigger change detection
          this.displayAddItemDialog = false;
          this.showSuccess('Item added successfully');
        },
        error: () => this.showError('Failed to add item')
      });
    }
  }

  editDomaine(entity: Domain | Item) {
    this.editMode = 'domain' in entity ? 'item' : 'domain';
    if (this.editMode === 'domain') {
      this.selectedDomain = entity as Domain;
      this.newDomain = { ...entity };
    } else {
      this.selectedItem = entity as Item;
      this.newItem = { ...entity };
    }
    this.displayEditDialog = true;
  }

  updateEntity() {
    if (this.editMode === 'domain' && this.selectedDomain) {
      this.profileDataService.updateDomain(this.selectedDomain.id, this.newDomain).subscribe({
        next: (updatedDomain) => {
          const index = this.domaines.findIndex(d => d.id === updatedDomain.id);
          this.domaines[index] = updatedDomain;
          this.displayEditDialog = false;
          this.showSuccess('Domain updated successfully');
        },
        error: () => this.showError('Failed to update domain')
      });
    } else if (this.editMode === 'item' && this.selectedItem && this.selectedDomain) {
      this.profileDataService.updateItem(this.selectedItem.id, this.newItem).subscribe({
        next: (updatedItem) => {
          const domainIndex = this.domaines.findIndex(d => d.id === this.selectedDomain!.id);
          const itemIndex = this.domaines[domainIndex].items!.findIndex(i => i.id === updatedItem.id);
          this.domaines[domainIndex].items![itemIndex] = updatedItem;
          this.domaines = [...this.domaines]; // Trigger change detection
          this.displayEditDialog = false;
          this.showSuccess('Item updated successfully');
        },
        error: () => this.showError('Failed to update item')
      });
    }
  }

  deleteDomaine(entity: Domain | Item) {
    const isDomain = 'items' in entity;
    if (isDomain) {
      this.profileDataService.deleteDomain((entity as Domain).id).subscribe({
        next: () => {
          this.domaines = this.domaines.filter(d => d.id !== (entity as Domain).id);
          this.showSuccess('Domain deleted successfully');
        },
        error: () => this.showError('Failed to delete domain')
      });
    } else {
      const item = entity as Item;
      const domain = this.domaines.find(d => d.items?.some(i => i.id === item.id));
      if (domain) {
        this.profileDataService.deleteItem(item.id).subscribe({
          next: () => {
            domain.items = domain.items!.filter(i => i.id !== item.id);
            this.domaines = [...this.domaines]; // Trigger change detection
            this.showSuccess('Item deleted successfully');
          },
          error: () => this.showError('Failed to delete item')
        });
      }
    }
  }

  showSuccess(message: string) {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
  }

  showError(message: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }
}