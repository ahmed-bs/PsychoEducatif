import { Component, OnInit ,HostListener } from '@angular/core';
import {
  trigger,
  style,
  state,
  animate,
  transition,
} from '@angular/animations';

@Component({
  selector: 'app-Accueil',
  templateUrl: './Accueil.component.html',
  styleUrls: ['./Accueil.component.css'],
  animations: [
    // Animation for fade-in/out effects
    trigger('fadeInOut', [
      state('void', style({ opacity: 0 })),
      transition(':enter', [animate('2s ease-in')]),
      transition(':leave', [animate('1s ease-out')]),
    ]),

    // Scroll animation trigger
    trigger('slideIn', [
      state('hidden', style({ opacity: 0, transform: 'translateY(50px)' })),
      state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('hidden => visible', [animate('0.8s ease-out')]),
    ])
  ],
})
export class AccueilComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  // Variable to track the visibility of sections
  isVisible = true;
  
  // Track sections' visibility on scroll
  @HostListener('window:scroll', [])
  onScroll(): void {
    const elements = document.querySelectorAll('.scroll-section');
    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        element.classList.add('visible'); // Add visible class to apply the animation
      } else {
        element.classList.remove('visible');
      }
    });
  }

  // Toggle visibility function (optional)
  toggleVisibility() {
    this.isVisible = !this.isVisible;
  }

}
