import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { GoalService } from 'src/app/core/services/goal.service';
import { ProfileCategory } from 'src/app/core/models/ProfileCategory';
import { ProfileDomain } from 'src/app/core/models/ProfileDomain';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { debounceTime, distinctUntilChanged, filter, switchMap, take, forkJoin, map, catchError, of } from 'rxjs';
import Swal from 'sweetalert2';
import { TranslateModule, TranslateService } from '@ngx-translate/core'; 
import { SharedService } from 'src/app/core/services/shared.service';

@Component({
  selector: 'app-add-goal-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './add-goal-modal.component.html',
  styleUrl: './add-goal-modal.component.css'
})

export class AddGoalModalComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() goalToEdit: any | null = null;
  @Input() currentProfileId: number | null = null;
  @Input() selectedDate: string | null = null; 

  @Output() close = new EventEmitter<void>();
  @Output() goalSaved = new EventEmitter<any>();

  goalForm!: FormGroup;
  isEditMode: boolean = false;
  priorities = ['low', 'medium', 'high'];
  repetitionTypes = ['none', 'daily', 'weekly', 'monthly'];
  availableCategories: ProfileCategory[] = [];
  availableDomains: ProfileDomain[] = [];

  constructor(
    private fb: FormBuilder,
    private goalService: GoalService,
    private domainService: ProfileDomainService,
    private profileCategoryService: ProfileCategoryService,
    private translate: TranslateService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    
    this.initForm();

    this.goalForm.get('category_id')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter(categoryId => categoryId !== null)
      )
      .subscribe(categoryId => {
        this.availableDomains = []; 
        this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false }); 
        this.loadDomains(categoryId);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    
    if (changes['isVisible'] || changes['goalToEdit'] || changes['selectedDate']) {

      
      if (changes['isVisible'] && !changes['isVisible'].currentValue && changes['isVisible'].previousValue) {
        
        this.resetForm();
        this.goalToEdit = null;
        this.isEditMode = false;
        this.availableCategories = [];
        this.availableDomains = [];
        return; 
      }

      
      if (this.isVisible) { 
        this.isEditMode = !!this.goalToEdit;

        
        if (!this.goalForm || (changes['goalToEdit'] && changes['goalToEdit'].previousValue !== changes['goalToEdit'].currentValue)) {
            this.initForm();
        }

        
        if (this.currentProfileId && (changes['currentProfileId'] || changes['goalToEdit'] || this.availableCategories.length === 0)) {
            this.profileCategoryService.getCategories(this.currentProfileId).subscribe(
                categories => {
                    this.availableCategories = categories;
                    this.cdr.detectChanges(); // Force change detection after categories are loaded

                    if (this.isEditMode && this.goalToEdit) {
                        // Ensure categories are loaded before populating form
                        // Use setTimeout to ensure the form and categories are fully initialized and rendered
                        setTimeout(() => {
                            this.populateForm(this.goalToEdit);
                            this.cdr.detectChanges(); // Force change detection after populating form
                        }, 100); // Increased delay to ensure DOM is ready
                    } else {
                        
                        if (this.availableCategories.length > 0 && this.goalForm.get('category_id')?.value === null) {
                            this.goalForm.get('category_id')?.setValue(this.availableCategories[0].id, { emitEvent: true });
                        }
                        
                        if (this.selectedDate) {
                            this.goalForm.get('target_date')?.setValue(this.selectedDate);
                        }
                    }
                },
                error => {
                    console.error('Error loading categories in ngOnChanges:', error);
                    this.availableCategories = [];
                    this.goalForm.get('category_id')?.setValue(null, { emitEvent: false });
                    this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false });
                }
            );
        } else if (!this.currentProfileId) {
            console.warn('Modal: currentProfileId is null, cannot load categories.');
            this.availableCategories = [];
            this.availableDomains = [];
            this.goalForm.get('category_id')?.setValue(null, { emitEvent: false });
            this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false });
        }

        
        
        if (!this.isEditMode && changes['selectedDate']) {
            this.goalForm.get('target_date')?.setValue(this.selectedDate);
        }
      }
    }
  }

  initForm(): void {
    this.goalForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      target_date: ['', Validators.required],
      priority: ['medium', Validators.required],
      repetition_type: ['none', Validators.required],
      category_id: [null, Validators.required],
      domain_id: [{ value: null, disabled: true }, Validators.required]
    });
  }

  populateForm(goal: any): void {
    console.log("Populate Form: ", goal)
    
    // Helper function to safely extract ID from various formats
    const extractId = (value: any): number | null => {
      if (value === null || value === undefined) {
        return null;
      }
      
      // If it's already a number, return it
      if (typeof value === 'number' && !isNaN(value)) {
        return value;
      }
      
      // If it's an object with an id property, extract the id
      if (typeof value === 'object' && value !== null && 'id' in value) {
        const id = value.id;
        if (typeof id === 'number' && !isNaN(id)) {
          return id;
        }
        if (typeof id === 'string') {
          const numId = Number(id);
          return isNaN(numId) ? null : numId;
        }
      }
      
      // If it's a string, try to convert to number
      if (typeof value === 'string') {
        const numId = Number(value);
        return isNaN(numId) ? null : numId;
      }
      
      return null;
    };
    
    // Extract domain_id from goal.domain.id
    const domainIdToPatch = extractId(goal.domain?.id || goal.domain_id);
    
    // The domain object doesn't have profile_category, so we need to find it
    // by checking which category contains this domain
    // We'll do this after categories are loaded

    // Ensure priority and repetition_type are valid values
    const validPriority = goal.priority && this.priorities.includes(goal.priority) ? goal.priority : 'medium';
    const validRepetitionType = goal.repetition_type && this.repetitionTypes.includes(goal.repetition_type) ? goal.repetition_type : 'none';

    // Set basic fields first
    this.goalForm.get('title')?.setValue(goal.title || '', { emitEvent: false });
    this.goalForm.get('description')?.setValue(goal.description || '', { emitEvent: false });
    this.goalForm.get('target_date')?.setValue(
      goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : null, 
      { emitEvent: false }
    );
    this.goalForm.get('priority')?.setValue(validPriority, { emitEvent: false });
    this.goalForm.get('repetition_type')?.setValue(validRepetitionType, { emitEvent: false });

    // Find which category contains this domain by checking each category's domains
    if (domainIdToPatch !== null && !isNaN(domainIdToPatch)) {
      // Use requestAnimationFrame to ensure the view is ready
      requestAnimationFrame(() => {
        // Double check categories are available
        if (this.availableCategories.length === 0) {
          console.warn('Categories not loaded yet, retrying...');
          setTimeout(() => this.populateForm(goal), 100);
          return;
        }

        // Find which category contains this domain by checking all categories in parallel
        const findCategoryForDomain = (domainId: number): Promise<number | null> => {
          return new Promise((resolve) => {
            if (this.availableCategories.length === 0) {
              resolve(null);
              return;
            }

            // Create observables for all category domain checks
            const categoryChecks = this.availableCategories
              .filter(cat => cat.id !== undefined)
              .map(category => 
                this.domainService.getDomains(category.id!).pipe(
                  take(1),
                  map(domains => ({
                    categoryId: category.id!,
                    containsDomain: domains.some(d => d.id === domainId)
                  })),
                  catchError(() => of({ categoryId: category.id!, containsDomain: false }))
                )
              );

            // Use forkJoin to check all categories in parallel
            forkJoin(categoryChecks).subscribe(
              results => {
                const foundCategory = results.find(r => r.containsDomain);
                resolve(foundCategory ? foundCategory.categoryId : null);
              },
              error => {
                console.error('Error checking categories:', error);
                resolve(null);
              }
            );
          });
        };

        // Find the category that contains this domain
        findCategoryForDomain(domainIdToPatch).then(categoryIdToPatch => {
          if (categoryIdToPatch !== null) {
            // Find the exact category object
            const category = this.availableCategories.find(c => c.id === categoryIdToPatch);
            
            if (category && category.id !== undefined) {
              // Set category_id
              this.goalForm.get('category_id')?.setValue(category.id, { emitEvent: false, onlySelf: false });
              this.cdr.detectChanges();
              
              // Load domains for the category
              this.domainService.getDomains(categoryIdToPatch).pipe(take(1)).subscribe(
                domains => {
                  this.availableDomains = domains;
                  this.cdr.detectChanges();
                  
                  // Use requestAnimationFrame again for domains
                  requestAnimationFrame(() => {
                    if (this.availableDomains.length > 0) {
                      this.goalForm.get('domain_id')?.enable();
                      
                      // Find the exact domain object
                      const domain = this.availableDomains.find(d => d.id === domainIdToPatch);
                      if (domain && domain.id !== undefined) {
                        this.goalForm.get('domain_id')?.setValue(domain.id, { emitEvent: false, onlySelf: false });
                        this.cdr.detectChanges();
                      } else {
                        console.warn('Domain not found in loaded domains:', domainIdToPatch);
                        this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false });
                      }
                    } else {
                      this.goalForm.get('domain_id')?.disable();
                      this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false });
                    }
                  });
                },
                error => {
                  console.error('Modal: Error loading domains for category', categoryIdToPatch, ':', error);
                  this.availableDomains = [];
                  this.goalForm.get('domain_id')?.disable();
                  this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false });
                }
              );
            } else {
              console.warn('Category not found:', categoryIdToPatch);
            }
          } else {
            console.warn('Could not find category for domain:', domainIdToPatch);
            this.goalForm.get('category_id')?.setValue(null, { emitEvent: false });
            this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false });
            this.availableDomains = [];
            this.goalForm.get('domain_id')?.disable();
          }
        });
      });
    } else {
      console.warn('Modal: Invalid or missing domain ID');
      this.goalForm.get('category_id')?.setValue(null, { emitEvent: false });
      this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false });
      this.availableDomains = [];
      this.goalForm.get('domain_id')?.disable();
    }
  }


  resetForm(): void {
    this.goalForm.reset({
      priority: 'medium',
      repetition_type: 'none',
      category_id: null,
      domain_id: null
    });
    this.availableDomains = [];
    this.availableCategories = [];
    this.goalForm.get('domain_id')?.disable();
  }


  loadCategories(profileId: number): void {
    if (!profileId) {
      this.availableCategories = [];
      this.goalForm.get('category_id')?.setValue(null, { emitEvent: false });
      return;
    }
    this.profileCategoryService.getCategories(profileId).subscribe({
      next: (categories: ProfileCategory[]) => {
        this.availableCategories = categories;

        if (!this.isEditMode && this.availableCategories.length > 0 && this.goalForm.get('category_id')?.value === null) {
          this.goalForm.get('category_id')?.setValue(this.availableCategories[0].id, { emitEvent: true });
        } else if (this.availableCategories.length === 0) {
          this.goalForm.get('category_id')?.setValue(null, { emitEvent: false });
        }
      },
      error: (error) => {
        console.error('Modal: Error loading categories:', error);
        this.availableCategories = [];
        this.goalForm.get('category_id')?.setValue(null, { emitEvent: false });
      }
    });
  }


  loadDomains(categoryId: number): void {
    if (!categoryId) {
      this.availableDomains = [];
      this.goalForm.get('domain_id')?.disable();
      this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false });
      return;
    }

    this.domainService.getDomains(categoryId).subscribe({
      next: (domains: ProfileDomain[]) => {
        this.availableDomains = domains;
        if (this.availableDomains.length > 0) {
          this.goalForm.get('domain_id')?.enable();
          
          if (this.isEditMode && this.goalToEdit && this.goalToEdit.domain_id &&
            this.availableDomains.some(d => d.id === this.goalToEdit.domain_id)) {
            this.goalForm.get('domain_id')?.setValue(this.goalToEdit.domain_id, { emitEvent: false });
          } else {
            
            this.goalForm.get('domain_id')?.setValue(this.availableDomains[0].id, { emitEvent: false });
          }
        } else {
          this.goalForm.get('domain_id')?.disable();
          this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false });
        }
      },
      error: (error) => {
        console.error('Modal: Error loading domains for category', categoryId, ':', error);
        this.availableDomains = [];
        this.goalForm.get('domain_id')?.disable();
        this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false });
      }
    });
  }


  onSubmit(): void {
    if (this.goalForm.valid && this.currentProfileId !== null) {
      const formData = { ...this.goalForm.value };

      if (formData.target_date) {
        formData.target_date = new Date(formData.target_date).toISOString().split('T')[0];
      }

      delete formData.category_id;

      formData.profile_id = this.currentProfileId;

      if (this.isEditMode && this.goalToEdit && this.goalToEdit.id) {
        this.goalService.updateGoal(this.goalToEdit.id, formData).subscribe({
          next: (response) => {
            this.goalSaved.emit(response);
            this.onCloseModal();
            Swal.fire({
              icon: 'success',
              title: this.translate.instant('add_goal_modal.success_messages.goal_updated'),
              text: this.translate.instant('add_goal_modal.success_messages.goal_updated_text', { title: response.title }),
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error updating goal:', error);
            Swal.fire('Erreur', this.translate.instant('add_goal_modal.error_messages.update_failed'), 'error');
          }
        });
      } else {
        this.goalService.createGoal(formData).subscribe({
          next: (response) => {
            this.goalSaved.emit(response);
            this.onCloseModal();
            Swal.fire({
              icon: 'success',
              title: this.translate.instant('add_goal_modal.success_messages.goal_created'),
              text: this.translate.instant('add_goal_modal.success_messages.goal_created_text', { title: response.title }),
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error creating goal:', error);
            Swal.fire('Erreur', this.translate.instant('add_goal_modal.error_messages.create_failed'), 'error');
          }
        });
      }
    } else {
      console.error('Form is invalid or currentProfileId is missing. Mark all as touched.');
      this.goalForm.markAllAsTouched();
      if (this.currentProfileId === null) {
        Swal.fire('Attention', this.translate.instant('add_goal_modal.error_messages.no_profile_selected'), 'warning');
      } else {
        Swal.fire('Attention', 'Veuillez remplir tous les champs requis.', 'warning');
      }
    }
  }

  onCloseModal(): void {
    this.resetForm();
    this.goalToEdit = null;
    this.isEditMode = false;
    this.close.emit();
  }

  // Get current language
  private getCurrentLanguage(): string {
    return this.sharedService.getCurrentLanguage();
  }

  // Helper method to get the appropriate field based on language for categories
  getLanguageField(category: ProfileCategory, fieldName: string): string {
    const currentLang = this.getCurrentLanguage();
    if (currentLang === 'ar') {
      const arabicField = category[`${fieldName}_ar` as keyof ProfileCategory] as string;
      const fallbackField = category[fieldName as keyof ProfileCategory] as string;
      return arabicField || fallbackField || '';
    } else {
      const frenchField = category[fieldName as keyof ProfileCategory] as string;
      const fallbackField = category[`${fieldName}_ar` as keyof ProfileCategory] as string;
      return frenchField || fallbackField || '';
    }
  }

  // Helper method to get the appropriate field based on language for domains
  getDomainLanguageField(domain: ProfileDomain, fieldName: string): string {
    const currentLang = this.getCurrentLanguage();
    if (currentLang === 'ar') {
      const arabicField = domain[`${fieldName}_ar` as keyof ProfileDomain] as string;
      const fallbackField = domain[fieldName as keyof ProfileDomain] as string;
      return arabicField || fallbackField || '';
    } else {
      const frenchField = domain[fieldName as keyof ProfileDomain] as string;
      const fallbackField = domain[`${fieldName}_ar` as keyof ProfileDomain] as string;
      return frenchField || fallbackField || '';
    }
  }

  // Helper method to get translated priority label
  getPriorityLabel(priority: string): string {
    return this.translate.instant(`add_goal_modal.priority.${priority}`);
  }

  // Helper method to get translated repetition type label
  getRepetitionTypeLabel(repetitionType: string): string {
    return this.translate.instant(`add_goal_modal.repetition_type.${repetitionType}`);
  }
}