import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CompetenceService } from 'src/app/core/services/Competence.service';




@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css'],
 
})
export class ExploreComponent implements OnInit {

  @ViewChild('scroller') scroller!: ElementRef;
  competences: any[] = [];
  currentIndex = 0;
  cardsToShow = 3;

  constructor(private competenceService: CompetenceService, private router: Router) {}

  ngOnInit() {
    this.competences = this.competenceService.getCompetences();
  }

  naviguerVersQuiz(categorie: string) {
    console.log(categorie);
    this.router.navigate(['/Dashboard-client/client/quiz', categorie]);
  }

  scrollLeft() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.scrollToCurrentIndex();
    }
  }

  scrollRight() {
    if (this.currentIndex < this.competences.length - this.cardsToShow) {
      this.currentIndex++;
      this.scrollToCurrentIndex();
    }
  }

  private scrollToCurrentIndex() {
    const cardWidth = this.scroller.nativeElement.querySelector('.col-md-4').offsetWidth;
    const scrollPosition = this.currentIndex * cardWidth;
    
    this.scroller.nativeElement.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
  }

}
