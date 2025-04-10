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
        { description: 'Dirige bien son regard vers l’autre lorsqu’il s’adresse à lui', statut: '',commentaire: '' },
        { description: 'Regarde un objet que l’autre regarde (attention conjointe)', statut: '',commentaire: '' },
        { description: 'Sait répéter au moins 5 sons (ex : A, i, O)', statut: '',commentaire: '' },
        { description: 'Sait répéter au moins 3 syllabes (ex : BA)', statut: '',commentaire: '' },
        { description: 'Sait répéter au moins 3 mots', statut: '',commentaire: '' },
        { description: 'Sait répéter une phrase courte', statut: '',commentaire: '' },
        { description: 'Sait répéter la mélodie d’une chanson', statut: '',commentaire: '' },
        { description: 'Sait répéter des bruits (voiture, train, cochon, vache)', statut: '',commentaire: '' },
      ],
    },
    {
      id:'2',
      categorie: 'Communication Réceptive ',
      sousCompetences: [
        { description: 'Se retourner à l’appel de son prénom', statut: '',commentaire: '' },
        { description: 'Se retourner vers la personne qui parle', statut: '' ,commentaire: ''},
        { description: 'Exécute au moins 5 consignes d’action simples (« donnes, assieds-toi, fais un bisou, ranges…)', statut: '' ,commentaire: ''},
        { description: 'Mémorise et exécute deux consignes consécutives (ex : assieds-toi et ranges…)', statut: '',commentaire: '' },
        { description: 'Réagit aux gestes communicatifs (on lui tend la main pour qu’il la sert, on pointe pour qu’il regarde, ou des mimiques faciales, hochement de tête…)', statut: '',commentaire: '' },
        { description: 'Montre 3 parties du corps sur lui', statut: '' ,commentaire: ''},
        { description: 'Montre 3 parties du corps sur une autre personne / un bonhomme', statut: '',commentaire: '' },
        { description: 'Montre 3 parties du visage sur lui', statut: '',commentaire: '' },
        { description: 'Montre 3 parties du visage sur une autre personne / un bonhomme', statut: '' ,commentaire: ''},
      ],
    },
    {
      id:'3',
      categorie: 'Interactions sociales',
      sousCompetences: [
        { description: 'Regarde l’autre lorsqu’il lui parle', statut: '',commentaire: '' },
        { description: 'Sait faire un câlin', statut: '',commentaire: '' },
        { description: 'Sait faire un bisou', statut: '',commentaire: '' },
        { description: 'Sait faire un coucou', statut: '',commentaire: '' },
        { description: 'Sait faire un sourire', statut: '',commentaire: '' },
        { description: 'Sait faire un clin d’œil', statut: '',commentaire: '' },
        { description: 'Sait faire une grimace', statut: '',commentaire: '' },
        { description: 'Sait faire un geste de la main pour dire au revoir', statut: '',commentaire: '' },
      ],
    },
    {
      id:'4',
      categorie: 'Jeux symboliques',
      sousCompetences: [
        { description: 'Joue à faire semblant (ex : fait semblant de boire, de manger, de dormir, de se brosser les dents…)', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de conduire', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de téléphoner', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se coiffer', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se brosser les dents', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se maquiller', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se déshabiller', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se rhabiller', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se laver', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se brosser les cheveux', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se couper les cheveux', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se raser', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se parfumer', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se laver les mains', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se laver le visage', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se laver les pieds', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se laver les bras', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se laver les jambes', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se laver le ventre', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se laver le dos', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se laver les oreilles', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se laver le nez', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se laver la bouche', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se laver les dents', statut: '',commentaire: '' },
        { description: 'Joue à faire semblant de se laver les cheveux', statut: '',commentaire: '' },
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