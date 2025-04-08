import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CompetenceService } from 'src/app/core/services/Competence.service';




@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css'],
 
})
export class ExploreComponent implements OnInit {


  ngOnInit() {
    this.competences = this.competenceService.getCompetences();
  }



  constructor(private competenceService: CompetenceService, private router: Router) {
  }



  competences: any[] = [];

  



  naviguerVersQuiz(categorie: string) {
    console.log(categorie);
    this.router.navigate(['/Dashboard-client/client/quiz', categorie]);
  }

}
