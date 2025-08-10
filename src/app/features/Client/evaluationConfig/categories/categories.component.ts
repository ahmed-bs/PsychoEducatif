import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ProfileCategory } from 'src/app/core/models/ProfileCategory';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
  providers: [MessageService],
})
export class CategoriesComponent implements OnInit, OnDestroy {
  displayAddUserDialog: boolean = false;
  showFilters: boolean = false;
  categories: ProfileCategory[] = [];
  newCategory: Partial<ProfileCategory> = { name: '', description: '' };
  profileId!: number;
  loading: boolean = true;
  isEditMode: boolean = false;
  viewMode: 'grid' | 'list' | 'table' = 'grid'; // Add view mode property
  private languageSubscription: Subscription;

  constructor(
    private router: Router,
    private profileCategoryService: ProfileCategoryService,
    private messageService: MessageService,
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
    });
  }

  ngOnInit() {
    this.loadCategories();
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  loadCategories() {
    this.loading = true;
    this.profileId = parseInt(localStorage.getItem('selectedChildId') || '0', 10);
    this.profileCategoryService.getCategories(this.profileId).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
      },
      error: (error) => {
        this.translate.get('categories.messages.error.generic_error', { error: error.message }).subscribe((text) => {
          this.showError(text);
        });
        this.loading = false;
      },
    });
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  setViewMode(mode: 'grid' | 'list' | 'table') {
    this.viewMode = mode;
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
      this.translate.get('categories.messages.error.name_required').subscribe((text) => {
        this.showError(text);
      });
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
        this.translate.get('categories.messages.success.category_added').subscribe((text) => {
          this.showSuccess(text);
        });
      },
      error: (error) => {
        this.translate.get('categories.messages.error.generic_error', { error: error.message }).subscribe((text) => {
          this.showError(text);
        });
      },
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
          this.translate.get('categories.messages.success.category_updated').subscribe((text) => {
            this.showSuccess(text);
          });
        },
        error: (error) => {
          this.translate.get('categories.messages.error.generic_error', { error: error.message }).subscribe((text) => {
            this.showError(text);
          });
        },
      });
    }
  }

  deleteCategory(profileCategory: ProfileCategory) {
    if (profileCategory.id) {
      this.translate.get('categories.messages.confirm.delete_category', { categoryName: profileCategory.name }).subscribe((message) => {
        if (!confirm(message)) {
          return;
        }

        this.profileCategoryService.destroy(profileCategory.id!).subscribe({
          next: () => {
            this.categories = this.categories.filter((c) => c.id !== profileCategory.id);
            this.translate.get('categories.messages.success.category_deleted').subscribe((text) => {
              this.showSuccess(text);
            });
          },
          error: (error) => {
            this.translate.get('categories.messages.error.generic_error', { error: error.message }).subscribe((text) => {
              this.showError(text);
            });
          },
        });
      });
    }
  }

  navigateToDomains(profileCategory: ProfileCategory) {
    this.router.navigate(['Dashboard-client/client/evaluations_configurations/items'], {
      queryParams: { categoryId: profileCategory.id },
    });
  }

  showSuccess(message: string) {
    this.messageService.add({ severity: 'success', summary: this.translate.instant('categories.messages.success.summary'), detail: message });
  }

  showError(message: string) {
    this.messageService.add({ severity: 'error', summary: this.translate.instant('categories.messages.error.summary'), detail: message });
  }
}