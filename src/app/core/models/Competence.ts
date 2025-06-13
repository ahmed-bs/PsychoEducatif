export interface Competence {
  id:string;
  categorie: string; // ex. "La communication expressive"
  sousCompetences: SousCompetence[];
  statut?: string; // Optionnel : "acquise", "non acquise", "en cours d’acquisition"
 
}

export interface SousCompetence {
  description: string; // ex. "Dirige bien son regard vers l’autre lorsqu’il s’adresse à lui"
  statut: string; // "acquise", "non acquise", "en cours d’acquisition"
  comentaire: string;
}