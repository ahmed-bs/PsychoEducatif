import { AfterViewInit, Component, ElementRef, OnInit, OnDestroy, HostListener } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-Evaluation',
  templateUrl: './Evaluation.component.html',
  styleUrls: ['./Evaluation.component.css']
})
export class EvaluationComponent implements OnInit, AfterViewInit, OnDestroy {
  private languageSubscription!: Subscription;

  constructor(
    private elementRef: ElementRef,
    private translate: TranslateService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    // Initialize translation with current language from shared service
    this.translate.setDefaultLang('fr');
    const currentLang = this.sharedService.getCurrentLanguage();
    this.translate.use(currentLang);

    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
    });

    // Initialize animations after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.initializeAnimations();
    }, 100);
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.checkScrollAnimations();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScrollAnimations();
  }

  ngAfterViewInit() {
    // Récupération des éléments DOM
    const menuBtn = this.elementRef.nativeElement.querySelector('#menu-btn');
    const navLinks = this.elementRef.nativeElement.querySelector('#nav-links');
    
    if (menuBtn && navLinks) {
      const menuBtnIcon = menuBtn.querySelector('i');

      // Gestion du clic sur le bouton menu
      menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        const isOpen = navLinks.classList.contains('open');
        if (menuBtnIcon) {
          menuBtnIcon.setAttribute('class', isOpen ? 'ri-close-line' : 'ri-menu-line');
        }
      });

      // Fermeture du menu lors d'un clic sur les liens
      navLinks.addEventListener('click', () => {
        navLinks.classList.remove('open');
        if (menuBtnIcon) {
          menuBtnIcon.setAttribute('class', 'ri-menu-line');
        }
      });
    }

    // Check animations again after view init to catch elements already in viewport
    setTimeout(() => {
      this.checkScrollAnimations();
    }, 200);
  }

  private initializeAnimations() {
    // Add initial animations for elements that should be visible on load
    this.addInitialAnimations();
    
    // Check for scroll animations
    this.checkScrollAnimations();
  }

  private addInitialAnimations() {
    // Add visible class to elements that should animate on page load
    const headerElements = document.querySelectorAll('.header__image__card');
    headerElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('visible');
      }, index * 200);
    });

    // Animate the main header content
    const headerContent = document.querySelector('.header__content');
    if (headerContent) {
      setTimeout(() => {
        headerContent.classList.add('visible');
      }, 500);
    }
  }

  private checkScrollAnimations() {
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in, .stagger-animation > *');
    
    animatedElements.forEach(element => {
      if (this.isElementInViewport(element)) {
        element.classList.add('visible');
      }
    });

    // Special handling for timeline items
    const timelineItems = document.querySelectorAll('.timeline-container .vertical-scrollable-timeline li');
    timelineItems.forEach((item, index) => {
      if (this.isElementInViewport(item)) {
        setTimeout(() => {
          item.classList.add('visible');
        }, index * 300);
      }
    });

    // Special handling for grid boxes in skills section
    const gridBoxes = document.querySelectorAll('.grid-box');
    gridBoxes.forEach((box, index) => {
      if (this.isElementInViewport(box)) {
        setTimeout(() => {
          box.classList.add('visible');
        }, index * 200);
      }
    });
  }

  private isElementInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    // Trigger animation when element is 20% visible
    const triggerPoint = windowHeight * 0.8;
    
    return (
      rect.top <= triggerPoint &&
      rect.bottom >= 0
    );
  }
}
