import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SousCompetence } from 'src/app/core/models/Competence';
import { CompetenceService } from 'src/app/core/services/Competence.service';


@Component({
  standalone: true,
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css'],
  imports: [
    FormsModule,
    CommonModule
  ]
})
export class QuizComponent implements OnInit {

  categorie: string = '';
  sousCompetences: SousCompetence[] = [];
  currentIndex: number = 0; // Index de la sous-compétence actuelle

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private competenceService: CompetenceService
  ) {}

  ngOnInit(): void {
    this.categorie = this.route.snapshot.paramMap.get('categorie') || '';
    const competence = this.competenceService.getCompetences().find(c => c.categorie === this.categorie);
    this.sousCompetences = competence ? competence.sousCompetences : [];
  }

  precedent() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  suivant() {
    if (this.currentIndex < this.sousCompetences.length - 1) {
      this.currentIndex++;
    }
  }

  soumettreQuiz(categorie: string) {
    this.sousCompetences.forEach(sousCompetence => {
      this.competenceService.updateSousCompetence(this.categorie, sousCompetence);
    });
    this.router.navigate(['/Dashboard-client/client/evaluations',categorie]);
  }

}
