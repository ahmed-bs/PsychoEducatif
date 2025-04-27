import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG modules
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { ProfileService } from 'src/app/core/services/profile.service';
import { Profile } from 'src/app/core/models/profile.model';
import { HttpClientModule } from '@angular/common/http';

@Component({
  standalone: true,
  providers: [],
  selector: 'app-pick_profile',
  templateUrl: './pick_profile.component.html',
  styleUrls: ['./pick_profile.component.css'],
  imports: [DialogModule, ButtonModule, InputTextModule, FormsModule, CommonModule,HttpClientModule],
})
export class PickProfileComponent implements OnInit {
  children: Profile[] = [];
  filteredChildren: Profile[] = [];
  searchTerm: string = '';

  // Dialog properties
  displayDialog: boolean = false;
  displayEditDialog: boolean = false;
  selectedChild: Profile = this.resetChild();
  newChild: Profile = this.resetChild();
  parentId!: number;
  constructor(private profileService: ProfileService, private router: Router) {

    const user = localStorage.getItem('user');
    this.parentId = user ? Number(JSON.parse(user).id) : 0;
}

  ngOnInit() {
    this.loadChildren();

    if (!this.parentId) {
      Swal.fire('Erreur', 'Impossible de charger les informations de l’utilisateur.', 'error');
      return;
    }
    console.log('Parent ID:', this.parentId); // Debugging line
  }


  loadChildren() {
    this.profileService.getProfilesByParent(this.parentId).subscribe({
      next: (children) => {
        this.children = children.map(child => ({
          ...child,
          imageUrl: child.image_url || 'https://source.unsplash.com/random/300x300/?child,portrait'
        }));
        this.filteredChildren = [...this.children];
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de charger les profils.', 'error');
      }
    });
  }

  // Filter children based on search term
  filterChildren() {
    if (!this.searchTerm) {
      this.filteredChildren = [...this.children];
    } else {
      this.filteredChildren = this.children.filter(child =>
        `${child.first_name} ${child.last_name}`.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  // Open dialog to add a new child
  showDialog() {
    this.newChild = this.resetChild();
    this.displayDialog = true;
  }

  // Add a new child
  addChild() {
    if (this.newChild.first_name && this.newChild.last_name && this.newChild.birth_date) {
      this.profileService.createChild(this.newChild).subscribe({
        next: (child) => {
          this.children.push({
            ...child,
            image_url: child.image_url || 'assets/image_client/default-image.avif'
          });
          this.filteredChildren = [...this.children];
          this.displayDialog = false;
          Swal.fire('Succès', 'Profil ajouté avec succès.', 'success');
        },
        error: (err) => {
          Swal.fire('Erreur', 'Impossible d’ajouter le profil.', 'error');
        }
      });
    } else {
      Swal.fire('Erreur', 'Veuillez remplir tous les champs obligatoires.', 'warning');
    }
  }

  // Open dialog to edit a child
  showEditDialog(child: Profile) {
    this.selectedChild = { ...child };
    this.displayEditDialog = true;
  }

  // Save changes to a child
  saveChild() {
    this.profileService.updateChild(this.selectedChild).subscribe({
      next: (updatedChild) => {
        const index = this.children.findIndex(c => c.id === updatedChild.id);
        if (index !== -1) {
          this.children[index] = { ...updatedChild, image_url: this.children[index].image_url };
          this.filteredChildren = [...this.children];
        }
        this.displayEditDialog = false;
        Swal.fire('Succès', 'Profil mis à jour avec succès.', 'success');
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de mettre à jour le profil.', 'error');
      }
    });
  }

  // Disable (delete) a child with confirmation
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
      if (result.isConfirmed) {
        this.profileService.deleteChild(child.id!).subscribe({
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

  // Navigate to child dashboard
  navigateToClient(childId: number) {
    localStorage.setItem('selectedChildId', childId.toString());
    this.router.navigate(['/Dashboard-client/client/Kids_profiles', childId]);
  }

  // Cancel and close dialogs
  cancel() {
    this.newChild = this.resetChild();
    this.displayDialog = false;
  }

  cancelEdit() {
    this.displayEditDialog = false;
  }

  // Reset child model
  private resetChild(): Profile {
    return {
      first_name: '',
      last_name: '',
      birth_date: '',
      diagnosis: '',
      notes: '',
      is_active: true
    };
  }
}