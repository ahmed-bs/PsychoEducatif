

import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormControl, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { GoalService } from 'src/app/core/services/goal.service';
import { ProfileCategory } from 'src/app/core/models/ProfileCategory';
import { ProfileDomain } from 'src/app/core/models/ProfileDomain';
import { ProfileDomainService } from 'src/app/core/services/ProfileDomain.service';
import { ProfileCategoryService } from 'src/app/core/services/ProfileCategory.service';
import { debounceTime, distinctUntilChanged, filter, switchMap, take } from 'rxjs'; 

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
    if ((changes['isVisible'] && changes['isVisible'].currentValue === true && !changes['isVisible'].previousValue) ||
        (changes['goalToEdit'] && changes['goalToEdit'].currentValue !== changes['goalToEdit'].previousValue)) {

      this.isEditMode = !!this.goalToEdit;
      this.initForm(); 

      if (this.currentProfileId) {
        this.profileCategoryService.getCategories(this.currentProfileId).subscribe(
          categories => {
            this.availableCategories = categories;

            if (this.isEditMode && this.goalToEdit) {
              this.populateForm(this.goalToEdit);
            } else {
              if (this.availableCategories.length > 0 && this.goalForm.get('category_id')?.value === null) {
                this.goalForm.get('category_id')?.setValue(this.availableCategories[0].id, { emitEvent: true });
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
      } else {
        console.warn('Modal: currentProfileId is null, cannot load categories.');
        this.availableCategories = [];
        this.availableDomains = [];
        this.goalForm.get('category_id')?.setValue(null, { emitEvent: false });
        this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false });
      }
    }

    
    if (changes['isVisible'] && !changes['isVisible'].currentValue && changes['isVisible'].previousValue) {
      this.resetForm();
      this.goalToEdit = null; 
      this.isEditMode = false;
      this.availableCategories = [];
      this.availableDomains = [];
    }
  }

  initForm(): void {
    this.goalForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      target_date: ['', Validators.required],
      priority: ['medium', Validators.required],
      category_id: [null, Validators.required],
      domain_id: [null, Validators.required],
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
      domain_id: null 
    }, { emitEvent: true }); 
    
    this.goalForm.patchValue({
      title: goal.title,
      description: goal.description,
      target_date: goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : null,
      priority: goal.priority,
      category_id: categoryIdToPatch,
      domain_id: null 
    }, { emitEvent: false }); 

    if (categoryIdToPatch) {
      this.loadDomains(categoryIdToPatch);
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
        this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false });
        return;
    }

    this.domainService.getDomains(categoryId).subscribe({
        next: (domains: ProfileDomain[]) => {
            this.availableDomains = domains;
            if (this.availableDomains.length > 0) {
                this.goalForm.get('domain_id')?.setValue(this.availableDomains[0].id, { emitEvent: false });
            } else {
                this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false });
            }
        },
        error: (error) => {
            console.error('Modal: Error loading domains for category', categoryId, ':', error);
            this.availableDomains = [];
            this.goalForm.get('domain_id')?.setValue(null, { emitEvent: false });
        }
    });
  }


  onSubmit(): void {
    if (this.goalForm.valid) {
      const formData = { ...this.goalForm.value };

      if (formData.target_date) {
        formData.target_date = new Date(formData.target_date).toISOString().split('T')[0];
      }

      delete formData.category_id; 

      if (this.isEditMode && this.goalToEdit && this.goalToEdit.id) {
        this.goalService.updateGoal(this.goalToEdit.id, formData).subscribe({
          next: (response) => {
            this.goalSaved.emit(response);
            this.onCloseModal();
          },
          error: (error) => {
            console.error('Error updating goal:', error);
          }
        });
      } else {
        this.goalService.createGoal(formData).subscribe({
          next: (response) => {
            this.goalSaved.emit(response);
            this.onCloseModal();
          },
          error: (error) => {
            console.error('Error creating goal:', error);
          }
        });
      }
    } else {
      console.error('Form is invalid. Mark all as touched.');
      this.goalForm.markAllAsTouched();
    }
  }

  onCloseModal(): void {
    this.resetForm(); 
    this.goalToEdit = null;
    this.isEditMode = false;
    this.close.emit();
  }
}