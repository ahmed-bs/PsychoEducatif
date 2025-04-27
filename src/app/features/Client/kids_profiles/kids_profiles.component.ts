import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Profile } from 'src/app/core/models/profile.model';
import { ProfileService } from 'src/app/core/services/profile.service';

@Component({
  standalone: true,
  selector: 'app-kids_profiles',
  templateUrl: './kids_profiles.component.html',
  styleUrls: ['./kids_profiles.component.css'],
  imports: [DialogModule, ButtonModule, InputTextModule, FormsModule, CommonModule, DropdownModule],
  providers: [MessageService]
})
export class KidsProfilesComponent implements OnInit {
  children: Profile[] = [];
  filteredChildren: Profile[] = [];
  searchTerm: string = '';
  selectedChild: Profile | null = null;
  childId: string | null = null;

  displayDialog: boolean = false;
  displayEditDialog: boolean = false;
  afficherBoiteDialoguePartage: boolean = false;

  newChild: Profile = this.resetChild();
  saisieEmail: string = '';
  accesSelectionne: any;
  optionsAcces: any[] = [
    { libelle: 'Lecture seule', valeur: 'read_only' },
    { libelle: 'Lecture et modification', valeur: 'read_write' }
  ];
  sharePermissions: any = {
    can_read: true,
    can_write: false,
    can_update: false,
    can_delete: false
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private messageService: MessageService
  ) {
    this.accesSelectionne = this.optionsAcces[0];
  }

  ngOnInit() {
    this.childId = this.route.snapshot.paramMap.get('childId');
    this.loadChildren();
    if (this.childId) {
      this.loadChild(parseInt(this.childId, 10));
    }
  }

  loadChildren() {
    this.profileService.getChildren().subscribe({
      next: (children) => {
        this.children = children.map(child => ({
          ...child,
          image_url: child.image_url || 'https://source.unsplash.com/random/300x300/?child,portrait'
        }));
        this.filteredChildren = [...this.children];
        if (this.childId) {
          this.selectedChild = this.children.find(child => child.id === parseInt(this.childId!, 10)) || null;
        }
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de charger les profils.', 'error');
      }
    });
  }

  loadChild(childId: number) {
    this.profileService.getChild(childId).subscribe({
      next: (child) => {
        this.selectedChild = {
          ...child,
          image_url: child.image_url || 'https://source.unsplash.com/random/300x300/?child,portrait'
        };
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de charger le profil.', 'error');
      }
    });
  }

  filterChildren() {
    if (!this.searchTerm) {
      this.filteredChildren = [...this.children];
    } else {
      this.filteredChildren = this.children.filter(child =>
        `${child.first_name} ${child.last_name}`.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  selectChild(child: Profile) {
    this.selectedChild = child;
    this.router.navigate(['/Dashboard-client/client/Kids_profiles', child.id]);
  }

  showDialog() {
    this.newChild = this.resetChild();
    this.displayDialog = true;
  }

  showEditDialog() {
    if (this.selectedChild) {
      this.displayEditDialog = true;
    }
  }

  showShareDialog() {
    this.saisieEmail = '';
    this.sharePermissions = { can_read: true, can_write: false, can_update: false, can_delete: false };
    this.accesSelectionne = this.optionsAcces[0];
    this.afficherBoiteDialoguePartage = true;
  }

  addChild() {
    if (this.newChild.first_name && this.newChild.last_name && this.newChild.birth_date) {
      this.profileService.createChild(this.newChild).subscribe({
        next: (child) => {
          this.children.push({
            ...child,
            image_url: child.image_url || 'https://source.unsplash.com/random/300x300/?child,portrait'
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

  saveChild() {
    if (this.selectedChild) {
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
      if (result.isConfirmed) {
        this.profileService.deleteChild(child.id!).subscribe({
          next: () => {
            this.children = this.children.filter(c => c.id !== child.id);
            this.filteredChildren = [...this.children];
            if (this.selectedChild?.id === child.id) {
              this.selectedChild = null;
            }
            Swal.fire('Désactivé', `${child.first_name} ${child.last_name} a été désactivé.`, 'success');
          },
          error: (err) => {
            Swal.fire('Erreur', 'Impossible de désactiver le profil.', 'error');
          }
        });
      }
    });
  }

  shareProfile() {
    if (!this.selectedChild || !this.saisieEmail) {
      Swal.fire('Erreur', 'Veuillez sélectionner un profil et entrer un email.', 'warning');
      return;
    }

    // For simplicity, assume saisieEmail is the ID of the parent to share with
    // In a real app, you'd need to resolve the email to a user ID via an API
    const sharedWithParentId = parseInt(this.saisieEmail, 10); // Replace with actual logic
    this.sharePermissions = {
      can_read: true,
      can_write: this.accesSelectionne.valeur === 'read_write',
      can_update: this.accesSelectionne.valeur === 'read_write',
      can_delete: false
    };

    this.profileService.shareChildProfile(this.selectedChild.id!, sharedWithParentId, this.sharePermissions).subscribe({
      next: (response) => {
        this.afficherBoiteDialoguePartage = false;
        Swal.fire('Succès', 'Profil partagé avec succès.', 'success');
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de partager le profil.', 'error');
      }
    });
  }

  cancel() {
    this.newChild = this.resetChild();
    this.displayDialog = false;
  }

  cancelEdit() {
    this.displayEditDialog = false;
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
}