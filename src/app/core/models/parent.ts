import { Child } from "./child";


export class Parent {
    id: number;
    image: string; // Photo du parent ou avatar
    name: string; // Nom du parent/tuteur
    relationship: string; // Lien avec l'enfant (Père, Mère, Tuteur légal)
    contact: string; // Email ou numéro de téléphone
    location: string; // Ville/Pays du parent
    registrationDate: Date; // Date d'inscription à l'application
    supportLevel: string; // Niveau d'implication (Actif, Occasionnel, En attente)
    children: Child[]; // Liste des enfants suivis
  
    constructor(
      id: number,
      image: string,
      name: string,
      relationship: string,
      contact: string,
      location: string,
      registrationDate: Date,
      supportLevel: string,
      children: Child[] = []
    ) {
      this.id = id;
      this.image = image;
      this.name = name;
      this.relationship = relationship;
      this.contact = contact;
      this.location = location;
      this.registrationDate = registrationDate;
      this.supportLevel = supportLevel;
      this.children = children;
    }
  }
  