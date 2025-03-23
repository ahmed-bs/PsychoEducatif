import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Child } from 'src/app/core/models/child';
import Swal from 'sweetalert2';

//primeng module
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

@Component({
  standalone:true,
  selector: 'app-kids_profiles',
  templateUrl: './kids_profiles.component.html',
  styleUrls: ['./kids_profiles.component.css'],
  imports: [DialogModule, ButtonModule, InputTextModule, FormsModule, CommonModule],
  providers: [MessageService] 
})
export class Kids_profilesComponent implements OnInit {

  children: Child[] = [
    {
      id: 1,
      parentId: 100,
      name: 'Emma Dubois',
      age: 6,
      diagnosisDate: new Date('2020-05-15'),
      evaluationScore: 75,
      objectives: ['Améliorer la communication', 'Développer les compétences sociales'],
      progress: 'En progrès',
      recommendedStrategies: ['Renforcement positif', 'Jeux structurés'],
      imageUrl: 'assets/image_client/homme-lunettes-chemise-bleue-sourit_905719-6916.avif'
    },
    {
      id: 2,
      parentId: 101,
      name: 'Lucas Martin',
      age: 8,
      diagnosisDate: new Date('2019-08-20'),
      evaluationScore: 82,
      objectives: ['Augmenter l’autonomie', 'Gérer les émotions'],
      progress: 'Stable',
      recommendedStrategies: ['Routines visuelles', 'Temps calme'],
      imageUrl: 'assets/image_client/téléchargement.jpeg'
    },
    {
      id: 3,
      parentId: 101,
      name: 'Lucas Martin',
      age: 8,
      diagnosisDate: new Date('2019-08-20'),
      evaluationScore: 82,
      objectives: ['Augmenter l’autonomie', 'Gérer les émotions'],
      progress: 'Stable',
      recommendedStrategies: ['Routines visuelles', 'Temps calme'],
      imageUrl: 'assets/image_client/jeune-homme-souriant-aux-lunettes_1308-174373.avif'
    }

  ];



  filteredChildren: Child[] = []; // Liste filtrée
  searchTerm: string = '';
  childId: any | null = null;

  // Propriétés pour le dialog
  displayDialog: boolean = false;
  displayEditDialog: boolean = false; // Contrôle le dialogue de modification
  selectedChild: any = {};
  newChild: Child = {
    id: 0, // Sera généré dynamiquement ou via un service
    parentId: 0, // À définir selon le contexte (ex: ID du parent connecté)
    name: '',
    age: 0,
    diagnosisDate: new Date(),
    evaluationScore: 0,
    objectives: [],
    progress: 'En progrès',
    recommendedStrategies: [],
    imageUrl: ''
  };


  constructor(private router: Router,private route: ActivatedRoute,private messageService: MessageService) {}

  ngOnInit() {
    this.childId = this.route.snapshot.paramMap.get('childId'); // Récupère l'ID de l'URL
  console.log('Enfant sélectionné ID:', this.childId);

  // Convertir l'ID en nombre (Angular récupère souvent des chaînes)
  const parsedId = this.childId ? parseInt(this.childId, 10) : null;

  // Charger les enfants
  this.filteredChildren = [...this.children]; 

  if (parsedId) {
    this.selectedChild = this.filteredChildren.find(child => child.id === parsedId);
    console.log('Données de l’enfant sélectionné:', this.selectedChild);
  }
 
  }

  // Filtrer les enfants en fonction du terme de recherche
  filterChildren() {
    if (!this.searchTerm) {
      this.filteredChildren = [...this.children]; // Réinitialise si vide
    } else {
      this.filteredChildren = this.children.filter(child =>
        child.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }
    // Fonction pour sélectionner un enfant et mettre à jour le profil
    selectChild(child: Child) {
      this.selectedChild = child;
    }
  

  // Ouvrir le dialog
  showDialog() {
    this.displayDialog = true;
  }

  // Ajouter un enfant et fermer le dialog
  addChild() {
    if (this.newChild.name && this.newChild.age) {
      const newId = this.children.length + 1; // Simple génération d'ID (remplacez par un service si besoin)
      this.children.push({
        ...this.newChild,
        id: newId,
        parentId: 100, // Exemple statique, à adapter
        imageUrl: 'assets/image_client/default-image.avif',
        objectives: this.newChild.objectives.length ? this.newChild.objectives : ['À définir'],
        recommendedStrategies: this.newChild.recommendedStrategies.length ? this.newChild.recommendedStrategies : ['À définir']
      });
      this.resetNewChild();
      this.filteredChildren = [...this.children];
      this.displayDialog = false;
    }
  }

  // Réinitialiser le modèle
  resetNewChild() {
    this.newChild = {
      id: 0,
      parentId: 0,
      name: '',
      age: 0,
      diagnosisDate: new Date(),
      evaluationScore: 0,
      objectives: [],
      progress: 'En progrès',
      recommendedStrategies: [],
      imageUrl: ''
    };
  }

  // Annuler et fermer le dialog
  cancel() {
    this.resetNewChild();
    this.displayDialog = false;
  }


  // Ouvre le dialogue de modification avec les données de l'enfant
  showEditDialog(child: any) {
    this.selectedChild = { ...child }; // Crée une copie pour éviter de modifier directement l'original
    this.displayEditDialog = true;
  }

  // Ferme le dialogue de modification
  cancelEdit() {
    this.displayEditDialog = false;
  }


  // Enregistre les modifications
  saveChild() {
    const index = this.children.findIndex(c => c.id === this.selectedChild.id); // Recherche par ID
    if (index !== -1) {
      this.children[index] = { ...this.selectedChild };
      this.filteredChildren = [...this.children]; // Met à jour la liste filtrée
    }
    this.displayEditDialog = false;
  }

 // Désactive un enfant avec confirmation SweetAlert2
 disableChild(child: any) {
  Swal.fire({
    title: 'Êtes-vous sûr ?',
    text: `Voulez-vous vraiment désactiver ${child.name} ?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545', // Rouge pour le bouton de confirmation
    cancelButtonColor: '#6c757d', // Gris pour le bouton d'annulation
    confirmButtonText: 'Oui, désactiver',
    cancelButtonText: 'Annuler'
  }).then((result) => {
    if (result.isConfirmed) {
      // Logique de désactivation ici
      console.log('Désactiver:', child);
      // Exemple : Supprimer l'enfant de la liste (ou marquer comme désactivé)
      const index = this.children.indexOf(child);
      if (index !== -1) {
        this.children.splice(index, 1); // Supprime l'enfant
        // Ou mettez à jour un statut : child.isActive = false;
      }
      Swal.fire(
        'Désactivé !',
        `${child.name} a été désactivé avec succès.`,
        'success'
      );
    }
  });
}

}
