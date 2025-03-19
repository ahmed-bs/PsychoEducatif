import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CompetenceService } from 'src/app/core/services/Competence.service';

@Component({
  standalone:true,
  selector: 'app-evaluations',
  templateUrl: './evaluations.component.html',
  styleUrls: ['./evaluations.component.css'],
  imports:[CommonModule,FormsModule],
})
export class EvaluationsComponent implements OnInit {

  categorie: string = '';
  competences: any[] = [];
  colonnesAffichees: string[] = ['categorie', 'sousCompetences'];
 

  constructor(private competenceService: CompetenceService
    ,private router: Router,    private route: ActivatedRoute,) {}

  ngOnInit(): void {
    this.competences = this.competenceService.getCompetences();
    this.categorie = this.route.snapshot.paramMap.get('categorie') || '';
  }

  // constructor() { }

  // ngOnInit() {
  // }
  // communicationSkills: any[] = [];
  // autonomySkills: any[] = [];

  // addRow(type: 'communication' | 'autonomy'): void {
  //   const newRow = { skill: '', eval1: '', eval2: '', comments: '' };
  //   if (type === 'communication') {
  //     this.communicationSkills.push(newRow);
  //   } else {
  //     this.autonomySkills.push(newRow);
  //   }
  // }
}
