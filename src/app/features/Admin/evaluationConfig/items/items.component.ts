import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class ItemsComponent implements OnInit {
showAddUserDialog() {
throw new Error('Method not implemented.');
}
  constructor(private location: Location) { }
  domaines: any[] = [];
  loading: boolean = true;
  showFilters: boolean = false;
  displayAddDomaineDialog = false;
  
  newDomaine = {
    title: '',
    description: '',
    code: ''
  };
  
  showAddDomaineDialog() {
    this.displayAddDomaineDialog = true;
  }
  
  addDomaine() {
    if (this.newDomaine.title && this.newDomaine.code) {
      const newDomaineEntry = { ...this.newDomaine, id: this.domaines.length + 1 };
      this.domaines.push(newDomaineEntry);
      this.displayAddDomaineDialog = false;
    }
  }
  
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  
  editDomaine(domaine: any) {
    // Add your edit logic here (navigate to edit page or open dialog)
    console.log('Edit domaine:', domaine);
  }
  
  deleteDomaine(id: number) {
    // Add your delete logic here (confirmation and delete)
    console.log('Delete domaine with ID:', id);
  }
  
  ngOnInit() {
    this.domaines = [
      {
        title: "Hygiène corporelle",
 description: 'Assurer l\'hygiène et le bien-être du corps', code: 'HYG-001',
        items: [
          { code: "HC01", title: "Se laver les mains", description: "L'enfant doit se laver les mains avant et après les repas." },
          { code: "HC02", title: "Se brosser les dents", description: "L'enfant apprend à se brosser les dents après les repas." }
        ]
      },
      {
        title: "Propreté", description: 'Maintenir la propreté des lieux et des objets', code: 'PRO-002',
        items: [
          { code: "P01", title: "Utiliser les toilettes", description: "L'enfant doit être capable d'utiliser les toilettes de manière autonome." },
          { code: "P02", title: "Jeter les déchets", description: "L'enfant doit jeter ses déchets dans la poubelle." }
        ]
      },
      {
        title: "Habillage/Déshabillage",description: 'Savoir s\'habiller et se déshabiller correctement', code: 'HAB-003' ,
        items: [
          { code: "HD01", title: "Mettre ses chaussures", description: "L'enfant apprend à mettre et enlever ses chaussures." },
          { code: "HD02", title: "S'habiller seul", description: "L'enfant doit être capable de s'habiller sans aide." }
        ]
      },
      {
        title: "Prise des repas", description: 'Apprendre à manger de manière autonome', code: 'REP-004',
        items: [
          { code: "PR01", title: "Utiliser les couverts", description: "L'enfant doit savoir utiliser une cuillère et une fourchette." },
          { code: "PR02", title: "Boire sans renverser", description: "L'enfant apprend à boire proprement." }
        ]
      }
    ];
    
    
this.loading = false;
  }
  goBack() {
    this.location.back();
  }
}
