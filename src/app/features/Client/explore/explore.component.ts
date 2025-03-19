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
  activeIndex = 0;
  @ViewChild('carousel', { static: false }) carousel!: ElementRef;

  cards = [
    { title: 'Video 1', description: 'Description 1', image: 'https://via.placeholder.com/300x200' },
    { title: 'Video 2', description: 'Description 2', image: 'https://via.placeholder.com/300x200' },
    { title: 'Video 3', description: 'Description 3', image: 'https://via.placeholder.com/300x200' },
    { title: 'Video 4', description: 'Description 4', image: 'https://via.placeholder.com/300x200' },
    { title: 'Video 5', description: 'Description 5', image: 'https://via.placeholder.com/300x200' },
    { title: 'Video 6', description: 'Description 6', image: 'https://via.placeholder.com/300x200' },
    { title: 'Video 3', description: 'Description 3', image: 'https://via.placeholder.com/300x200' },
    { title: 'Video 4', description: 'Description 4', image: 'https://via.placeholder.com/300x200' },
    { title: 'Video 5', description: 'Description 5', image: 'https://via.placeholder.com/300x200' },
    { title: 'Video 6', description: 'Description 6', image: 'https://via.placeholder.com/300x200' },
    { title: 'Video 3', description: 'Description 3', image: 'https://via.placeholder.com/300x200' },
    { title: 'Video 4', description: 'Description 4', image: 'https://via.placeholder.com/300x200' },
    { title: 'Video 5', description: 'Description 5', image: 'https://via.placeholder.com/300x200' },
    { title: 'Video 6', description: 'Description 6', image: 'https://via.placeholder.com/300x200' },
  ];

  scrollAmount = 200; // Adjust scrolling speed

  prev() {
    this.carousel.nativeElement.scrollBy({ left: -this.scrollAmount, behavior: 'smooth' });
  }

  next() {
    this.carousel.nativeElement.scrollBy({ left: this.scrollAmount, behavior: 'smooth' });
  }


  visibleCards:any[] = [];
  cardsPerView = 8; // Adjust this for more/less visible cards
  startIndex = 0;

  constructor(private competenceService: CompetenceService, private router: Router) {
    this.updateVisibleCards();
  }

  updateVisibleCards() {
    this.visibleCards = this.cards.slice(this.startIndex, this.startIndex + this.cardsPerView);
  }


  competences: any[] = [];

  



  naviguerVersQuiz(categorie: string) {
    this.router.navigate(['/Dashboard-client/client/quiz', categorie]);
  }

}
