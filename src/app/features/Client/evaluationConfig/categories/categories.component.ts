// src/app/categories/categories.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Category, ProfileDataService } from 'src/app/core/services/profileData.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
  providers: [MessageService],
})
export class CategoriesComponent implements OnInit {
  displayAddUserDialog: boolean = false;
  showFilters: boolean = false;
  categories: Category[] = [];
  newCategory: Partial<Category> = { name: '', description: '' };
  profileId: number = 1; // Default profile ID; make dynamic if needed
  loading: boolean = true;
  isEditMode: boolean = false; // Track if dialog is for editing

  constructor(
    private router: Router,
    private profileDataService: ProfileDataService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.profileDataService.getCategories(this.profileId).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
      },
      error: (error) => {
        this.showError(error.message);
        this.loading = false;
      },
    });
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  showAddUserDialog() {
    this.newCategory = { name: '', description: '' };
    this.isEditMode = false;
    this.displayAddUserDialog = true;
  }

  showEditDialog(category: Category) {
    this.newCategory = { ...category };
    this.isEditMode = true;
    this.displayAddUserDialog = true;
  }

  saveCategory() {
    if (!this.newCategory.name) {
      this.showError('Name is required');
      return;
    }

    if (this.isEditMode && this.newCategory.id) {
      this.updateCategory();
    } else {
      this.addCategory();
    }
  }

  addCategory() {
    this.profileDataService.createCategory(this.profileId, this.newCategory).subscribe({
      next: (category) => {
        this.categories.push(category);
        this.displayAddUserDialog = false;
        this.showSuccess('Category added successfully');
      },
      error: (error) => this.showError(error.message),
    });
  }

  updateCategory() {
    if (this.newCategory.id) {
      this.profileDataService.updateCategory(this.newCategory.id, this.newCategory).subscribe({
        next: (updatedCategory) => {
          const index = this.categories.findIndex((c) => c.id === updatedCategory.id);
          if (index !== -1) {
            this.categories[index] = updatedCategory;
          }
          this.displayAddUserDialog = false;
          this.showSuccess('Category updated successfully');
        },
        error: (error) => this.showError(error.message),
      });
    }
  }

  deleteCategory(category: Category) {
    if (confirm(`Are you sure you want to delete ${category.name}?`)) {
      this.profileDataService.deleteCategory(category.id).subscribe({
        next: () => {
          this.categories = this.categories.filter((c) => c.id !== category.id);
          this.showSuccess('Category deleted successfully');
        },
        error: (error) => this.showError(error.message),
      });
    }
  }

  navigateToDomains(category: Category) {
    // Navigate to a domains page for this category
    this.router.navigate(['Dashboard-client/client/evaluations_configurations/items'], {
      queryParams: { categoryId: category.id },
    });
  }

  showSuccess(message: string) {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
  }

  showError(message: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }
}