import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { InputTextareaModule } from 'primeng/inputtextarea';
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
  displayDeleteDialog: boolean = false;
  showFilters: boolean = false;
  categories: ProfileCategory[] = [];
  newCategory: Partial<ProfileCategory> = { name: '', name_ar: '', name_en: '', description: '', description_ar: '', description_en: '' };
  categoryToDelete: ProfileCategory | null = null;
  profileId!: number;
  loading: boolean = true;
  isEditMode: boolean = false;
  viewMode: 'grid' | 'list' | 'table' = 'grid';
  currentLanguage: string = 'fr';
  private languageSubscription: Subscription;
  selectedDescriptionCategory: ProfileCategory | null = null;
  isMobile: boolean = false;

  constructor(
    private router: Router,
    private profileCategoryService: ProfileCategoryService,
    private messageService: MessageService,
    private translate: TranslateService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize current language
    this.currentLanguage = localStorage.getItem('selectedLanguage') || 'fr';
    
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
      this.currentLanguage = lang;
      // Force change detection
      this.refreshDisplay();
      this.cdr.detectChanges();
    });
  }

  ngOnInit() {
    // Set default view mode based on screen size
    this.setDefaultViewMode();
    this.loadCategories();
  }

  // Set default view mode - list for mobile, grid for desktop
  private setDefaultViewMode(): void {
    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth <= 768;
      this.viewMode = this.isMobile ? 'list' : 'grid';
    }
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  // Get current language
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  // Force refresh display when language changes
  refreshDisplay() {
    // Trigger change detection by updating a property
    this.categories = [...this.categories];
  }

  // Helper method to get the appropriate field based on language
  getLanguageField(category: ProfileCategory, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      // For Arabic language, use _ar fields
      if (fieldName === 'name') {
        return category.name_ar || '';
      } else if (fieldName === 'description') {
        return category.description_ar || '';
      }
    } else if (this.currentLanguage === 'en') {
      // For English language, use _en fields
      if (fieldName === 'name') {
        return category.name_en || '';
      } else if (fieldName === 'description') {
        return category.description_en || '';
      }
    } else {
      // For French language, use non-_ar fields
      if (fieldName === 'name') {
        return category.name || '';
      } else if (fieldName === 'description') {
        return category.description || '';
      }
    }
    return '';
  }

  // Show description popup for mobile
  showDescriptionPopup(category: ProfileCategory, event: Event): void {
    event.stopPropagation();
    this.selectedDescriptionCategory = category;
  }

  // Hide description popup
  hideDescriptionPopup(): void {
    this.selectedDescriptionCategory = null;
  }

  // Check if description popup is open for a category
  isDescriptionPopupOpen(category: ProfileCategory): boolean {
    return this.selectedDescriptionCategory?.id === category.id;
  }

  // Helper method to prepare form data based on current language
  private prepareFormDataForLanguage(data: Partial<ProfileCategory>): Partial<ProfileCategory> {
    const preparedData: Partial<ProfileCategory> = {};

    // Always preserve the ID
    if (data.id) {
      preparedData.id = data.id;
    }

    if (this.currentLanguage === 'ar') {
      // For Arabic language, use _ar fields for form display
      preparedData.name = data.name_ar?.trim() || '';
      preparedData.description = data.description_ar?.trim() || '';
      // Keep original fields for backend
      preparedData.name_ar = data.name_ar?.trim() || '';
      preparedData.description_ar = data.description_ar?.trim() || '';
      preparedData.name_en = data.name_en?.trim() || '';
      preparedData.description_en = data.description_en?.trim() || '';
    } else if (this.currentLanguage === 'en') {
      // For English language, use _en fields for form display
      preparedData.name = data.name_en?.trim() || '';
      preparedData.description = data.description_en?.trim() || '';
      // Keep all fields for backend
      preparedData.name_ar = data.name_ar?.trim() || '';
      preparedData.description_ar = data.description_ar?.trim() || '';
      preparedData.name_en = data.name_en?.trim() || '';
      preparedData.description_en = data.description_en?.trim() || '';
    } else {
      // For French language, use non-_ar fields for form display
      preparedData.name = data.name?.trim() || '';
      preparedData.description = data.description?.trim() || '';
      // Keep _ar and _en fields for backend
      preparedData.name_ar = data.name_ar?.trim() || '';
      preparedData.description_ar = data.description_ar?.trim() || '';
      preparedData.name_en = data.name_en?.trim() || '';
      preparedData.description_en = data.description_en?.trim() || '';
    }

    return preparedData;
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
    // Prevent switching to table view on mobile
    if (this.isMobile && mode === 'table') {
      return;
    }
    this.viewMode = mode;
  }

  showAddUserDialog() {
    console.log('showAddUserDialog called - resetting for new category');
    this.newCategory = { name: '', name_ar: '', name_en: '', description: '', description_ar: '', description_en: '' };
    this.isEditMode = false;
    this.displayAddUserDialog = true;
    console.log('After showAddUserDialog:');
    console.log('- isEditMode:', this.isEditMode);
    console.log('- newCategory.id:', this.newCategory.id);
  }

  showEditDialog(profileCategory: ProfileCategory) {
    console.log('showEditDialog called with profileCategory:', profileCategory);
    
    // Prepare the form data based on current language
    this.newCategory = this.prepareFormDataForLanguage({
      ...profileCategory,
      name: profileCategory.name || '',
      name_ar: profileCategory.name_ar || '',
      name_en: profileCategory.name_en || '',
      description: profileCategory.description || '',
      description_ar: profileCategory.description_ar || '',
      description_en: profileCategory.description_en || ''
    });
    
    // Ensure the ID is preserved
    this.newCategory.id = profileCategory.id;
    
    this.isEditMode = true;
    this.displayAddUserDialog = true;
    
    console.log('After showEditDialog:');
    console.log('- isEditMode:', this.isEditMode);
    console.log('- newCategory.id:', this.newCategory.id);
    console.log('- newCategory object:', this.newCategory);
  }

  saveCategory() {
    // Create a clean data object for the API call
    // Preserve all existing language fields and update the current language field
    const categoryData: Partial<ProfileCategory> = {
      // Preserve existing values for all language fields
      name: this.newCategory.name?.trim() || '',
      name_ar: this.newCategory.name_ar?.trim() || '',
      name_en: this.newCategory.name_en?.trim() || '',
      description: this.newCategory.description?.trim() || '',
      description_ar: this.newCategory.description_ar?.trim() || '',
      description_en: this.newCategory.description_en?.trim() || ''
    };

    // Map the form input (newCategory.name/description) to the appropriate backend field based on current language
    // The form field contains the edited value for the current language
    if (this.currentLanguage === 'ar') {
      // When editing in Arabic, newCategory.name contains the Arabic value from form
      categoryData.name_ar = this.newCategory.name?.trim() || '';
      categoryData.description_ar = this.newCategory.description?.trim() || '';
    } else if (this.currentLanguage === 'en') {
      // When editing in English, newCategory.name contains the English value from form
      categoryData.name_en = this.newCategory.name?.trim() || '';
      categoryData.description_en = this.newCategory.description?.trim() || '';
    } else {
      // When editing in French, newCategory.name contains the French value from form
      categoryData.name = this.newCategory.name?.trim() || '';
      categoryData.description = this.newCategory.description?.trim() || '';
    }

    // Check if at least one of name, name_ar, or name_en is provided
    if (!categoryData.name && !categoryData.name_ar && !categoryData.name_en) {
      this.translate.get('categories.messages.error.name_required').subscribe((text) => {
        this.showError(text);
      });
      return;
    }

    console.log('isEditMode:', this.isEditMode);
    console.log('newCategory.id:', this.newCategory.id);
    console.log('newCategory object:', this.newCategory);
    
    if (this.isEditMode && this.newCategory.id) {
      console.log('Updating category with ID:', this.newCategory.id);
      console.log('Category data to send 44444444444444444444444444444444444444444444444444444444444');
      this.updateCategory(categoryData);
    } else {
      console.log('Category data to send tttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt');
      console.log('Going to addCategory because:');
      console.log('- isEditMode is:', this.isEditMode);
      console.log('- newCategory.id is:', this.newCategory.id);
      this.addCategory(categoryData);
    }
  }

  addCategory(categoryData: Partial<ProfileCategory>) {
    this.profileCategoryService.create(this.profileId, categoryData).subscribe({
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

  updateCategory(categoryData: Partial<ProfileCategory>) {
    if (this.newCategory.id) {
      console.log('Updating category with ID:', this.newCategory.id);
      console.log('Category data to send:', categoryData);
      this.profileCategoryService.update(this.newCategory.id, categoryData).subscribe({
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
    this.categoryToDelete = profileCategory;
    this.displayDeleteDialog = true;
  }

  confirmDelete() {
    if (this.categoryToDelete && this.categoryToDelete.id) {
      this.profileCategoryService.destroy(this.categoryToDelete.id).subscribe({
        next: () => {
          this.categories = this.categories.filter((c) => c.id !== this.categoryToDelete!.id);
          this.translate.get('categories.messages.success.category_deleted').subscribe((text) => {
            this.showSuccess(text);
          });
          this.displayDeleteDialog = false;
          this.categoryToDelete = null;
        },
        error: (error) => {
          this.translate.get('categories.messages.error.generic_error', { error: error.message }).subscribe((text) => {
            this.showError(text);
          });
          this.displayDeleteDialog = false;
          this.categoryToDelete = null;
        },
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