
export class Child {
    id: number;
    parentId: number; // Référence au parent
    name: string; // Nom de l'enfant
    age: number; // Âge de l'enfant
    diagnosisDate: Date; // Date du diagnostic d'autisme
    evaluationScore: number; // Score d'évaluation des compétences
    objectives: string[]; // Objectifs d'apprentissage
    progress: string; // Évolution globale (ex: "En progrès", "Stable", "Besoin d'attention")
    recommendedStrategies: string[]; // Stratégies comportementales suggérées
  
    constructor(
      id: number,
      parentId: number,
      name: string,
      age: number,
      diagnosisDate: Date,
      evaluationScore: number,
      objectives: string[],
      progress: string,
      recommendedStrategies: string[]
    ) {
      this.id = id;
      this.parentId = parentId;
      this.name = name;
      this.age = age;
      this.diagnosisDate = diagnosisDate;
      this.evaluationScore = evaluationScore;
      this.objectives = objectives;
      this.progress = progress;
      this.recommendedStrategies = recommendedStrategies;
    }
  }
  