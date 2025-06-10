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
import Swal from 'sweetalert2';
import { ProfileService } from 'src/app/core/services/profile.service';
import { Profile } from 'src/app/core/models/profile.model';
import { CreateProfileRequest, UpdateProfileRequest } from 'src/app/core/models/createprofile.model';

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
    InputTextareaModule
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
    { label: 'Male', value: 'M' },
    { label: 'Female', value: 'F' }
  ];
  parentId: number = 0;
  error: string | null = null;

  constructor(private profileService: ProfileService, private router: Router) {
    const user = localStorage.getItem('user');
    this.parentId = user ? Number(JSON.parse(user).id) : 0;
  }

  ngOnInit() {
    if (!this.parentId) {
      Swal.fire('Erreur', "Impossible de charger les informations de l'utilisateur.", 'error');
      return;
    }
    this.loadChildren();
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
      progress: 'En progrès',
      recommended_strategies: [],
      image_url: '',
      is_active: true
    };
  }
  loadChildren() {
    this.profileService.getProfilesByParent(this.parentId).subscribe({
      next: (children) => {
        this.children = children.map(child => ({
          ...child,
          image_url: child.image_url || 'https://source.unsplash.com/random/300x300/?child,portrait'
        }));
        this.filteredChildren = [...this.children];
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de charger les profils.', 'error');
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
    this.selectedChild = {
      first_name: child.first_name,
      last_name: child.last_name,
      birth_date: child.birth_date,
      gender: child.gender,
      diagnosis: child.diagnosis || '',
      notes: child.notes || ''
    };
    this.birthDate = new Date(child.birth_date);
    this.updatedisplayDialog = true;
    this.error = null;
  }
  addChild() {
    if (this.newChild.first_name && this.newChild.last_name && this.newChild.birth_date) {
      this.isLoading = true; // Set loading to true
      this.profileService.createChildProfile(this.newChild).subscribe({
        next: (child) => {
          this.children.push({
            ...child,
            image_url: child.image_url || 'https://source.unsplash.com/random/300x300/?child,portrait'
          });
          this.filteredChildren = [...this.children];
          this.displayDialog = false;
          this.isLoading = false; // Set loading to false
          Swal.fire('Succès', 'Profil ajouté avec succès.', 'success');
        },
        error: (err) => {
          this.isLoading = false; // Set loading to false
          Swal.fire('Erreur', 'Impossible d’ajouter le profil.', 'error');
        }
      });
    } else {
      Swal.fire('Erreur', 'Veuillez remplir tous les champs obligatoires.', 'warning');
    }

  }

  saveChild() {
    if (this.selectedChild) {
      this.profileService.updateChildProfile(this.selectedChild).subscribe({
        next: (updatedChild) => {
          const index = this.children.findIndex(c => c.id === updatedChild.id);
          if (index !== -1) {
            this.children[index] = { ...updatedChild, image_url: this.children[index].image_url };
            this.filteredChildren = [...this.children];
          }
          this.displayDialog = false;
          Swal.fire('Succès', 'Profil mis à jour avec succès.', 'success');
        },
        error: (err) => {
          Swal.fire('Erreur', 'Impossible de mettre à jour le profil.', 'error');
        }
      });
    }
  }
  saveProfile() {
    if (!this.profileForm.first_name || !this.profileForm.last_name || !this.birthDate) {
      this.error = 'Prénom, nom de famille et date de naissance sont obligatoires.';
      return;
    }

    // Format birth_date to YYYY-MM-DD
    const formattedBirthDate = this.birthDate.toISOString().split('T')[0];
    this.profileForm.birth_date = formattedBirthDate;

    if (this.isEditMode && this.selectedChild?.id) {
      const updateData: UpdateProfileRequest = { ...this.profileForm };
      this.profileService.updateChildProfile(this.selectedChild).subscribe({
        next: (updatedChild) => {
          const index = this.children.findIndex(c => c.id === updatedChild.id);
          if (index !== -1) {
            this.children[index] = {
              ...updatedChild,
              image_url: this.children[index].image_url // Preserve image_url
            };
            this.filteredChildren = [...this.children];
          }
          console.log('Updated child:', updatedChild);

          this.displayDialog = false;
          Swal.fire('Succès', 'Profil mis à jour avec succès.', 'success');
        },
        error: (err) => {
          this.error = err.message;
        }
      });
    } else {
      const createData: CreateProfileRequest = this.profileForm as CreateProfileRequest;
      this.profileService.createChildProfile(createData).subscribe({
        next: (newChild) => {
          this.children.push({
            ...newChild,
            image_url: newChild.image_url || 'https://source.unsplash.com/random/300x300/?child,portrait'
          });
          this.filteredChildren = [...this.children];
          this.displayDialog = false;
          Swal.fire('Succès', 'Profil ajouté avec succès.', 'success');
        },
        error: (err) => {
          this.error = err.message;
        }
      });
    }
  }

  disableChild(child: Profile) {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: `Voulez-vous vraiment désactiver ${child.first_name} ${child.last_name} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, désactiver',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed && child.id) {
        this.profileService.deleteChildProfile(child.id).subscribe({
          next: () => {
            this.children = this.children.filter(c => c.id !== child.id);
            this.filteredChildren = [...this.children];
            Swal.fire('Désactivé', `${child.first_name} ${child.last_name} a été désactivé.`, 'success');
          },
          error: (err) => {
            Swal.fire('Erreur', 'Impossible de désactiver le profil.', 'error');
          }
        });
      }
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