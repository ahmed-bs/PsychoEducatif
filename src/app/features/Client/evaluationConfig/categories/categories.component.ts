// src/app/categories/categories.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ProfileCategory } from 'src/app/core/models/ProfileCategory';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
  providers: [MessageService],
})
export class CategoriesComponent implements OnInit {
  displayAddUserDialog: boolean = false;
  showFilters: boolean = false;
  categories: ProfileCategory[] = [];
  newCategory: Partial<ProfileCategory> = { name: '', description: '' };
  profileId: number = 1; // Default profile ID; make dynamic if needed
  loading: boolean = true;
  isEditMode: boolean = false; // Track if dialog is for editing

  constructor(
    private router: Router,
    private profileCategoryService: ProfileCategoryService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.profileCategoryService.getCategories(this.profileId).subscribe({
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

  showEditDialog(profileCategory: ProfileCategory) {
    this.newCategory = { ...profileCategory };
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
    this.profileCategoryService.create(this.profileId, this.newCategory).subscribe({
      next: (profileCategory) => {
        this.categories.push(profileCategory);
        this.displayAddUserDialog = false;
        this.showSuccess('ProfileCategory added successfully');
      },
      error: (error) => this.showError(error.message),
    });
  }

  updateCategory() {
    if (this.newCategory.id) {
      this.profileCategoryService.update(this.newCategory.id, this.newCategory).subscribe({
        next: (updatedCategory) => {
          const index = this.categories.findIndex((c) => c.id === updatedCategory.id);
          if (index !== -1) {
            this.categories[index] = updatedCategory;
          }
          this.displayAddUserDialog = false;
          this.showSuccess('ProfileCategory updated successfully');
        },
        error: (error) => this.showError(error.message),
      });
    }
  }

  deleteCategory(profileCategory: ProfileCategory) {
    if (confirm(`Are you sure you want to delete ${profileCategory.name}?`)) {
      this.profileCategoryService.destroy(profileCategory.id!).subscribe({
        next: () => {
          this.categories = this.categories.filter((c) => c.id !== profileCategory.id);
          this.showSuccess('ProfileCategory deleted successfully');
        },
        error: (error) => this.showError(error.message),
      });
    }
  }

  navigateToDomains(profileCategory: ProfileCategory) {
    // Navigate to a domains page for this profileCategory
    this.router.navigate(['Dashboard-client/client/evaluations_configurations/items'], {
      queryParams: { categoryId: profileCategory.id },
    });
  }

  showSuccess(message: string) {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
  }

  showError(message: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }
}