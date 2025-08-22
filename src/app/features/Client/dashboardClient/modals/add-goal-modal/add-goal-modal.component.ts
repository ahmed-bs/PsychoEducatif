import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormControl, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { GoalService } from 'src/app/core/services/goal.service';
import { ProfileCategory } from 'src/app/core/models/ProfileCategory';
import { ProfileDomain } from 'src/app/core/models/ProfileDomain';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { debounceTime, distinctUntilChanged, filter, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-add-goal-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  availableCategories: ProfileCategory[] = [];
  availableDomains: ProfileDomain[] = [];

  constructor(
    private fb: FormBuilder,
    private goalService: GoalService,
    private domainService: ProfileDomainService,
    private profileCategoryService: ProfileCategoryService
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

        
        if (this.currentProfileId && (changes['currentProfileId'] || this.availableCategories.length === 0)) {
            this.profileCategoryService.getCategories(this.currentProfileId).subscribe(
                categories => {
                    this.availableCategories = categories;

                    if (this.isEditMode && this.goalToEdit) {
                        this.populateForm(this.goalToEdit);
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
      category_id: [null, Validators.required],
      domain_id: [{ value: null, disabled: true }, Validators.required],
      sub_objectives: this.fb.array([])
    });
  }

  get subObjectives(): FormArray {
    return this.goalForm.get('sub_objectives') as FormArray;
  }

  addSubObjective(description: string = '', isCompleted: boolean = false): void {
    this.subObjectives.push(this.fb.group({
      id: [null],
      description: [description, Validators.required],
      is_completed: [isCompleted]
    }));
  }

  removeSubObjective(index: number): void {
    this.subObjectives.removeAt(index);
  }

  populateForm(goal: any): void {
    console.log("Populate Form: ", goal)
    const categoryIdToPatch = goal.domain?.profile_category_id || null;

    
    this.goalForm.patchValue({
      title: goal.title,
      description: goal.description,
      target_date: goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : null,
      priority: goal.priority,
      category_id: categoryIdToPatch,
    }, { emitEvent: true }); 

    if (categoryIdToPatch) {
      this.domainService.getDomains(categoryIdToPatch).pipe(
        take(1)
      ).subscribe(
        domains => {
          this.availableDomains = domains;
          this.goalForm.get('domain_id')?.enable();
          this.goalForm.get('domain_id')?.setValue(goal.domain_id || null, { emitEvent: false });
        },
        error => {
          console.error('Modal: Error loading domains for category', categoryIdToPatch, ':', error);
          this.availableDomains = [];
          this.goalForm.get('domain_id')?.disable();
          this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false });
        }
      );
    }

    this.subObjectives.clear();
    goal.sub_objectives.forEach((sub: any) => {
      this.addSubObjective(sub.description, sub.is_completed);
      const lastIndex = this.subObjectives.length - 1;
      (this.subObjectives.at(lastIndex) as FormGroup).get('id')?.setValue(sub.id);
    });
  }


  resetForm(): void {
    this.goalForm.reset({
      priority: 'medium',
      category_id: null,
      domain_id: null
    });
    this.subObjectives.clear();
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
              title: 'Objectif mis à jour!',
              text: `L'objectif "${response.title}" a été mis à jour avec succès.`,
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error updating goal:', error);
            Swal.fire('Erreur', 'Impossible de mettre à jour l\'objectif.', 'error');
          }
        });
      } else {
        this.goalService.createGoal(formData).subscribe({
          next: (response) => {
            this.goalSaved.emit(response);
            this.onCloseModal();
            Swal.fire({
              icon: 'success',
              title: 'Objectif créé!',
              text: `L'objectif "${response.title}" a été créé avec succès.`,
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error creating goal:', error);
            Swal.fire('Erreur', 'Impossible de créer l\'objectif.', 'error');
          }
        });
      }
    } else {
      console.error('Form is invalid or currentProfileId is missing. Mark all as touched.');
      this.goalForm.markAllAsTouched();
      if (this.currentProfileId === null) {
        Swal.fire('Attention', 'Impossible d\'enregistrer l\'objectif: Aucun profil sélectionné.', 'warning');
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
    return localStorage.getItem('selectedLanguage') || 'fr';
  }

  // Helper method to get the appropriate field based on language
  getLanguageField(category: ProfileCategory, fieldName: string): string {
    const currentLang = this.getCurrentLanguage();
    if (currentLang === 'ar') {
      return category[`${fieldName}_ar` as keyof ProfileCategory] as string || category[fieldName as keyof ProfileCategory] as string || '';
    } else {
      return category[fieldName as keyof ProfileCategory] as string || category[`${fieldName}_ar` as keyof ProfileCategory] as string || '';
    }
  }
}