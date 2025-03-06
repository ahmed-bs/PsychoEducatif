import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-users_list',
  templateUrl: './users_list.component.html',
  styleUrls: ['./users_list.component.css']
})
export class Users_listComponent implements OnInit {
  parents: any[] = [];
  constructor() { }

  ngOnInit() {
    this.parents = [
        {
          image: 'https://bootdey.com/img/Content/avatar/avatar5.png',
          name: 'Sophie Martin',
          role: 'Mère',
          children: [
            {
              name: 'Léo Martin',
              age: 6,
              progress: 'Amélioration continue',
              evaluationFrequency: 'Hebdomadaire',
              supportStrategies: 'Renforcement positif, routines structurées'
            }
          ],
          category: 'Accompagnement parental actif',
          categoryClass: 'bg-soft-base',
          indicatorClass: 'bg-base'
        },
        {
          image: 'https://bootdey.com/img/Content/avatar/avatar2.png',
          name: 'Marc Dubois',
          role: 'Père',
          children: [
            {
              name: 'Emma Dubois',
              age: 4,
              progress: 'Besoin d’adaptation',
              evaluationFrequency: 'Mensuelle',
              supportStrategies: 'Communication visuelle, gestion du stress'
            }
          ],
          category: 'Soutien modéré',
          categoryClass: 'bg-soft-warning',
          indicatorClass: 'bg-warning'
        },
        {
          image: 'https://bootdey.com/img/Content/avatar/avatar3.png',
          name: 'Nadia Lefevre',
          role: 'Mère',
          children: [
            {
              name: 'Tom Lefevre',
              age: 5,
              progress: 'Grandes améliorations',
              evaluationFrequency: 'Bihebdomadaire',
              supportStrategies: 'Activités sociales encadrées, imitation guidée'
            }
          ],
          category: 'Parent engagé',
          categoryClass: 'bg-soft-success',
          indicatorClass: 'bg-success'
        },
        {
          image: 'https://bootdey.com/img/Content/avatar/avatar4.png',
          name: 'David Morel',
          role: 'Tuteur',
          children: [
            {
              name: 'Lucas Morel',
              age: 7,
              progress: 'Progrès variables',
              evaluationFrequency: 'Quotidienne',
              supportStrategies: 'Thérapie ABA, structuration des tâches'
            }
          ],
          category: 'Accompagnement structuré',
          categoryClass: 'bg-soft-danger',
          indicatorClass: 'bg-danger'
        },
        {
          image: 'https://bootdey.com/img/Content/avatar/avatar5.png',
          name: 'Caroline Petit',
          role: 'Mère',
          children: [
            {
              name: 'Mia Petit',
              age: 3,
              progress: 'Premiers apprentissages',
              evaluationFrequency: 'Hebdomadaire',
              supportStrategies: 'Stimulation sensorielle, jeux interactifs'
            }
          ],
          category: 'Nouveau suivi',
          categoryClass: 'bg-soft-info',
          indicatorClass: 'bg-info'
        }
      ];

  }

}