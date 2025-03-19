import { Injectable } from '@angular/core';
import { Competence, SousCompetence } from '../models/Competence';

@Injectable({
  providedIn: 'root'
})
export class CompetenceService {
  private competences: Competence[] = [
    {
      id:'1',
      categorie: 'La communication expressive',
      sousCompetences: [
        { description: 'Dirige bien son regard vers l’autre lorsqu’il s’adresse à lui', statut: '' },
        { description: 'Regarde un objet que l’autre regarde (attention conjointe)', statut: '' },
        { description: 'Sait répéter au moins 5 sons (ex : A, i, O)', statut: '' },
        { description: 'Sait répéter au moins 3 syllabes (ex : BA)', statut: '' },
        { description: 'Sait répéter au moins 3 mots', statut: '' },
        { description: 'Sait répéter une phrase courte', statut: '' },
        { description: 'Sait répéter la mélodie d’une chanson', statut: '' },
        { description: 'Sait répéter des bruits (voiture, train, cochon, vache)', statut: '' },
      ],
    },
    {
      id:'2',
      categorie: 'Communication Réceptive ',
      sousCompetences: [
        { description: 'Se retourner à l’appel de son prénom', statut: '' },
        { description: 'Se retourner vers la personne qui parle', statut: '' },
        { description: 'Exécute au moins 5 consignes d’action simples (« donnes, assieds-toi, fais un bisou, ranges…)', statut: '' },
        { description: 'Mémorise et exécute deux consignes consécutives (ex : assieds-toi et ranges…)', statut: '' },
        { description: 'Réagit aux gestes communicatifs (on lui tend la main pour qu’il la sert, on pointe pour qu’il regarde, ou des mimiques faciales, hochement de tête…)', statut: '' },
        { description: 'Montre 3 parties du corps sur lui', statut: '' },
        { description: 'Montre 3 parties du corps sur une autre personne / un bonhomme', statut: '' },
        { description: 'Montre 3 parties du visage sur lui', statut: '' },
        { description: 'Montre 3 parties du visage sur une autre personne / un bonhomme', statut: '' },
      ],
    },
    // Ajoutez d'autres catégories comme "La communication réceptive", "Interactions sociales", etc.
  ];

  getCompetences(): Competence[] {
    return this.competences;
  }

  updateSousCompetence(categorie: string, sousCompetence: SousCompetence) {
    const competence = this.competences.find(c => c.categorie === categorie);
    if (competence) {
      const index = competence.sousCompetences.findIndex(s => s.description === sousCompetence.description);
      if (index !== -1) {
        competence.sousCompetences[index] = sousCompetence;
      }
    }
  }
}