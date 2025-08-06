import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { ProfileService } from 'src/app/core/services/profile.service';
import { Profile } from 'src/app/core/models/profile.model';
import { CreateProfileRequest, UpdateProfileRequest } from 'src/app/core/models/createprofile.model';
import { AuthService } from 'src/app/core/services/authService.service';
import { environment } from 'src/environments/environment';

@Component({
  standalone: true,
  selector: 'app-pick_profile',
  templateUrl: './pick_profile.component.html',
  styleUrls: ['./pick_profile.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CalendarModule,
    DropdownModule,
    InputTextareaModule,
    TranslateModule
  ]
})
export class PickProfileComponent implements OnInit {
  children: Profile[] = [];
  filteredChildren: Profile[] = [];
  searchTerm: string = '';
  displayDialog: boolean = false;
  updatedisplayDialog: boolean = false;
  isEditMode: boolean = false;
  newChild: Profile = this.resetChild();
  selectedFile: File | null = null;
  selectedChild: Profile = {
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'M',
    diagnosis: '',
    notes: ''
  };
  profileForm: CreateProfileRequest | UpdateProfileRequest = {
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'M',
    diagnosis: '',
    notes: ''
  };
  isLoading: boolean = false;
  birthDate: Date | null = null;
  genderOptions = [
    { label: this.translate.instant('add_child_dialog.male_option'), value: 'M' },
    { label: this.translate.instant('add_child_dialog.female_option'), value: 'F' }
  ];
  parentId: number = 0;
  error: string | null = null;
  userName: string = '';

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
    private profileService: ProfileService,
    private router: Router
  ) {
    const user = localStorage.getItem('user');
    this.parentId = user ? Number(JSON.parse(user).id) : 0;

    // Initialize translation
    this.translate.addLangs(['fr', 'ar']);
    this.translate.setDefaultLang('ar');
    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang?.match(/fr|ar/) ? browserLang : 'ar');

    // Update gender options with translated labels
    this.genderOptions = [
      { label: this.translate.instant('add_child_dialog.male_option'), value: 'M' },
      { label: this.translate.instant('add_child_dialog.female_option'), value: 'F' }
    ];
  }

  ngOnInit() {
    if (!this.parentId) {
      this.translate.get(['profile_messages.load_user_error.title', 'profile_messages.load_user_error.text']).subscribe(translations => {
        Swal.fire({
          icon: 'error',
          title: translations['profile_messages.load_user_error.title'],
          text: translations['profile_messages.load_user_error.text']
        });
      });
      return;
    }
    this.userName = this.authService.currentUserValue.username;
    this.loadChildren();
  }

  setDefaultImage(event: any, child: Profile) {
    let defaultImg = '';
    if (child.gender === 'F') {
      if (child.category === 'Toddler') defaultImg = '/assets/image_client/image copy 2.png';
      else if (child.category === 'Young Child') defaultImg = '/assets/image_client/image copy 6.png';
      else if (child.category === 'Young Adult') defaultImg = '/assets/image_client/image copy 8.png';
    } else {
      if (child.category === 'Toddler') defaultImg = '/assets/image_client/image copy 3.png';
      else if (child.category === 'Young Child') defaultImg = '/assets/image_client/image copy 5.png';
      else if (child.category === 'Young Adult') defaultImg = '/assets/image_client/image copy 7.png';
    }
    event.target.src = defaultImg || '/assets/image_client/image copy 2.png';
  }

  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = (event.currentTarget as HTMLElement);
    dropZone.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = (event.currentTarget as HTMLElement);
    dropZone.classList.remove('drag-over');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = (event.currentTarget as HTMLElement);
    dropZone.classList.remove('drag-over');

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  resetChild(): Profile {
    return {
      first_name: '',
      last_name: '',
      birth_date: '',
      diagnosis: '',
      notes: '',
      evaluation_score: 0,
      objectives: [],
      progress: this.translate.instant('add_child_dialog.progress_default'),
      recommended_strategies: [],
      image_url: '',
      is_active: true
    };
  }

  loadChildren() {
    this.profileService.getProfilesByParent(this.parentId).subscribe({
      next: (children) => {
        this.children = children.map(child => {
          let imageUrl = (child as any).image || child.image_url;
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `${environment.apiUrl.slice(0, -1)}${imageUrl}`;
          }
          return {
            ...child,
            image_url: imageUrl
          };
        });
        this.filteredChildren = [...this.children];
      },
      error: (err) => {
        this.translate.get(['profile_messages.load_profiles_error.title', 'profile_messages.load_profiles_error.text']).subscribe(translations => {
          Swal.fire({
            icon: 'error',
            title: translations['profile_messages.load_profiles_error.title'],
            text: translations['profile_messages.load_profiles_error.text']
          });
        });
      }
    });
  }

  filterChildren() {
    if (!this.searchTerm) {
      this.filteredChildren = [...this.children];
    } else {
      this.filteredChildren = this.children.filter(child =>
        `${child.first_name} ${child.last_name}`
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase())
      );
    }
  }

  showDialog() {
    this.isEditMode = false;
    this.profileForm = {
      first_name: '',
      last_name: '',
      birth_date: '',
      gender: 'M',
      diagnosis: '',
      notes: ''
    };
    this.birthDate = null;
    this.displayDialog = true;
    this.error = null;
  }

  showEditDialog(child: Profile) {
    this.isEditMode = true;
    this.selectedChild = { ...child };
    this.birthDate = new Date(child.birth_date);
    this.updatedisplayDialog = true;
    this.error = null;
  }

  addChild() {
    if (this.newChild.first_name && this.newChild.last_name && this.newChild.birth_date) {
      this.isLoading = true;
      const formData = new FormData();
      formData.append('first_name', this.newChild.first_name);
      formData.append('last_name', this.newChild.last_name);
      formData.append('birth_date', this.newChild.birth_date);
      formData.append('gender', this.newChild.gender || 'M');
      formData.append('diagnosis', this.newChild.diagnosis || '');
      formData.append('notes', this.newChild.notes || '');
      if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
      }
      this.profileService.createChildProfile(formData).subscribe({
        next: (child) => {
          let imageUrl = (child as any).image || child.image_url;
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `${environment.apiUrl.slice(0, -1)}${imageUrl}`;
          }
          this.children.push({
            ...child,
            image_url: imageUrl
          });
          this.filteredChildren = [...this.children];
          this.displayDialog = false;
          this.isLoading = false;
          this.translate.get(['profile_messages.add_profile_success.title', 'profile_messages.add_profile_success.text']).subscribe(translations => {
            Swal.fire({
              icon: 'success',
              title: translations['profile_messages.add_profile_success.title'],
              text: translations['profile_messages.add_profile_success.text']
            });
          });
        },
        error: (err) => {
          this.isLoading = false;
          this.translate.get(['profile_messages.add_profile_error.title', 'profile_messages.add_profile_error.text']).subscribe(translations => {
            Swal.fire({
              icon: 'error',
              title: translations['profile_messages.add_profile_error.title'],
              text: translations['profile_messages.add_profile_error.text']
            });
          });
        }
      });
    } else {
      this.translate.get(['profile_messages.add_profile_required_fields_error.title', 'profile_messages.add_profile_required_fields_error.text']).subscribe(translations => {
        Swal.fire({
          icon: 'warning',
          title: translations['profile_messages.add_profile_required_fields_error.title'],
          text: translations['profile_messages.add_profile_required_fields_error.text']
        });
      });
    }
  }

  saveChild() {
    if (this.selectedChild && this.selectedChild.id) {
      const formData = new FormData();
      formData.append('first_name', this.selectedChild.first_name);
      formData.append('last_name', this.selectedChild.last_name);
      formData.append('birth_date', this.selectedChild.birth_date);
      formData.append('gender', this.selectedChild.gender || 'M');
      formData.append('diagnosis', this.selectedChild.diagnosis || '');
      formData.append('notes', this.selectedChild.notes || '');
      if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
      }
      this.profileService.updateChildProfile(this.selectedChild.id, formData).subscribe({
        next: (updatedChild) => {
          const index = this.children.findIndex(c => c.id === updatedChild.id);
          if (index !== -1) {
            this.children[index] = { ...updatedChild, image_url: this.children[index].image_url };
            this.filteredChildren = [...this.children];
          }
          this.updatedisplayDialog = false;
          this.translate.get(['profile_messages.update_profile_success.title', 'profile_messages.update_profile_success.text']).subscribe(translations => {
            Swal.fire({
              icon: 'success',
              title: translations['profile_messages.update_profile_success.title'],
              text: translations['profile_messages.update_profile_success.text']
            });
          });
        },
        error: (err) => {
          this.translate.get(['profile_messages.update_profile_error.title', 'profile_messages.update_profile_error.text']).subscribe(translations => {
            Swal.fire({
              icon: 'error',
              title: translations['profile_messages.update_profile_error.title'],
              text: translations['profile_messages.update_profile_error.text']
            });
          });
        }
      });
    }
  }

  saveProfile() {
    if (!this.profileForm.first_name || !this.profileForm.last_name || !this.birthDate) {
      this.error = this.translate.instant('add_child_dialog.required_fields_error');
      return;
    }

    const formattedBirthDate = this.birthDate.toISOString().split('T')[0];
    this.profileForm.birth_date = formattedBirthDate;

    if (this.isEditMode && this.selectedChild?.id) {
      const updateData: UpdateProfileRequest = { ...this.profileForm };
      const formData = new FormData();
      formData.append('first_name', this.selectedChild.first_name);
      formData.append('last_name', this.selectedChild.last_name);
      formData.append('birth_date', this.selectedChild.birth_date);
      formData.append('gender', this.selectedChild.gender || 'M');
      formData.append('diagnosis', this.selectedChild.diagnosis || '');
      formData.append('notes', this.selectedChild.notes || '');
      if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
      }
      this.profileService.updateChildProfile(this.selectedChild.id, formData).subscribe({
        next: (updatedChild) => {
          const index = this.children.findIndex(c => c.id === updatedChild.id);
          if (index !== -1) {
            this.children[index] = {
              ...updatedChild,
              image_url: (updatedChild as any).image || this.children[index].image_url
            };
            this.filteredChildren = [...this.children];
          }
          this.displayDialog = false;
          this.translate.get(['profile_messages.update_profile_success.title', 'profile_messages.update_profile_success.text']).subscribe(translations => {
            Swal.fire({
              icon: 'success',
              title: translations['profile_messages.update_profile_success.title'],
              text: translations['profile_messages.update_profile_success.text']
            });
          });
        },
        error: (err) => {
          this.error = err.message;
        }
      });
    } else {
      const createData: CreateProfileRequest = this.profileForm as CreateProfileRequest;
      const formData = new FormData();
      formData.append('first_name', this.newChild.first_name);
      formData.append('last_name', this.newChild.last_name);
      formData.append('birth_date', this.newChild.birth_date);
      formData.append('gender', this.newChild.gender || 'M');
      formData.append('diagnosis', this.newChild.diagnosis || '');
      formData.append('notes', this.newChild.notes || '');
      if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
      }
      this.profileService.createChildProfile(formData).subscribe({
        next: (newChild) => {
          let imageUrl = (newChild as any).image || newChild.image_url;
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `${environment.apiUrl.slice(0, -1)}${imageUrl}`;
          }
          this.children.push({
            ...newChild,
            image_url: imageUrl
          });
          this.filteredChildren = [...this.children];
          this.displayDialog = false;
          this.translate.get(['profile_messages.add_profile_success.title', 'profile_messages.add_profile_success.text']).subscribe(translations => {
            Swal.fire({
              icon: 'success',
              title: translations['profile_messages.add_profile_success.title'],
              text: translations['profile_messages.add_profile_success.text']
            });
          });
        },
        error: (err) => {
          this.error = err.message;
        }
      });
    }
  }

  disableChild(child: Profile) {
    const childName = `${child.first_name} ${child.last_name}`;
    this.translate.get([
      'profile_messages.disable_profile_confirm.title',
      'profile_messages.disable_profile_confirm.text',
      'profile_messages.disable_profile_confirm.confirm_button',
      'profile_messages.disable_profile_confirm.cancel_button'
    ], { childName }).subscribe(translations => {
      Swal.fire({
        title: translations['profile_messages.disable_profile_confirm.title'],
        text: translations['profile_messages.disable_profile_confirm.text'],
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: translations['profile_messages.disable_profile_confirm.confirm_button'],
        cancelButtonText: translations['profile_messages.disable_profile_confirm.cancel_button']
      }).then((result) => {
        if (result.isConfirmed && child.id) {
          this.profileService.deleteChildProfile(child.id).subscribe({
            next: () => {
              this.children = this.children.filter(c => c.id !== child.id);
              this.filteredChildren = [...this.children];
              this.translate.get([
                'profile_messages.disable_profile_success.title',
                'profile_messages.disable_profile_success.text'
              ], { childName }).subscribe(successTranslations => {
                Swal.fire({
                  icon: 'success',
                  title: successTranslations['profile_messages.disable_profile_success.title'],
                  text: successTranslations['profile_messages.disable_profile_success.text']
                });
              });
            },
            error: (err) => {
              this.translate.get([
                'profile_messages.disable_profile_error.title',
                'profile_messages.disable_profile_error.text'
              ]).subscribe(errorTranslations => {
                Swal.fire({
                  icon: 'error',
                  title: errorTranslations['profile_messages.disable_profile_error.title'],
                  text: errorTranslations['profile_messages.disable_profile_error.text']
                });
              });
            }
          });
        }
      });
    });
  }

  navigateToClient(childId: number) {
    localStorage.setItem('selectedChildId', childId.toString());
    this.router.navigate(['/Dashboard-client/client/', childId]);
  }

  cancel() {
    this.displayDialog = false;
    this.error = null;
  }
}