import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ShareProfileRequest } from 'src/app/core/models/createprofile.model';
import { Parent } from 'src/app/core/models/parent';
import { Profile } from 'src/app/core/models/profile.model';
import { ProfileService } from 'src/app/core/services/profile.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-Child_profile',
  templateUrl: './Child_profile.component.html',
  styleUrls: ['./Child_profile.component.css'],
  standalone: true,
  imports: [ButtonModule, DialogModule, InputTextModule, FormsModule, CommonModule, DropdownModule],
  providers: [MessageService]
})
export class Child_profileComponent implements OnInit {

  children: Profile[] = [];
  filteredChildren: Profile[] = [];
  searchTerm: string = '';
  selectedChild: Profile | null = null;
  childId: string | null = null;
  parentId!: number;

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

  activeTab: string = 'skills'; // Default active tab
  tabs = [
    { id: 'skills', label: 'Compétences' },
    { id: 'goals', label: 'Objectifs' },
    { id: 'strategies', label: 'Stratégies' },
    { id: 'notes', label: 'Notes' }
  ];
  progressBars = [
    { id: 'progress1', width: '75%' },
    { id: 'progress2', width: '50%' },
    { id: 'progress3', width: '90%' }
  ];
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private messageService: MessageService
  ) {
    this.accesSelectionne = this.optionsAcces[0];
  }

  ngOnInit() {
    const user = localStorage.getItem('user');
    this.parentId = user ? Number(JSON.parse(user).id) : 0;
     this.childId = this.route.snapshot.paramMap.get('childId');
   //  this.parent = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
    this.loadChildren();
    if (this.childId) {
      this.loadChild(parseInt(this.childId));
    }
    setTimeout(() => {
      this.progressBars.forEach(bar => {
        const currentWidth = bar.width;
        bar.width = '0%';
        setTimeout(() => {
          bar.width = currentWidth;
        }, 100);
      });
    }, 300);
  }

  switchTab(tabId: string): void {
    this.activeTab = tabId;
  }

  isTabActive(tabId: string): boolean {
    return this.activeTab === tabId;
  }

  loadChildren() {
    this.profileService.getProfilesByParent(this.parentId).subscribe({
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
    this.profileService.getProfileById(childId).subscribe({
      next: (child) => {
        this.selectedChild = {
          ...child,
          // image_url: child.image_url || 'https://source.unsplash.com/random/300x300/?child,portrait'
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
      this.profileService.createChildProfile(this.newChild).subscribe({
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
      this.profileService.updateChildProfile(this.selectedChild).subscribe({
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
        this.profileService.deleteChildProfile(child.id!).subscribe({
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


    const sharedWithId = parseInt(this.saisieEmail, 5); 

    // Map permissions
    const permissions: ('view' | 'edit' | 'share')[] = ['view'];
    if (this.accesSelectionne.valeur === 'read_write') {
      permissions.push('edit');
    }

    // Create ShareProfileRequest
    const shareData: ShareProfileRequest = {
      shared_with_id: 5,
      permissions
    };

    this.profileService.shareChildProfile(this.selectedChild.id!, shareData).subscribe({
      next: (message) => {
        this.afficherBoiteDialoguePartage = false;
        Swal.fire('Succès', message || 'Profil partagé avec succès.', 'success');
      },
      error: (err) => {
        Swal.fire('Erreur', err.message || 'Impossible de partager le profil.', 'error');
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
  calculateAge(birthDate: string): string {
    if (!birthDate) return 'Âge inconnu';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} ans`;
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
