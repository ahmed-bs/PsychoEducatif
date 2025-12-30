import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-Accueil',
  templateUrl: './Accueil.component.html',
  styleUrls: ['./Accueil.component.css']
})
export class AccueilComponent implements OnInit, OnDestroy {
  private languageSubscription!: Subscription;
  currentLang: string = 'fr';

  videoUrl: SafeResourceUrl;

  constructor(
    private translate: TranslateService,
    private sharedService: SharedService,
    private sanitizer: DomSanitizer
  ) {
    const videoUrlString = 'https://www.youtube.com/embed/extcXqu8Ki4?autoplay=1&loop=1&playlist=extcXqu8Ki4&start=20&mute=1&playsinline=1&controls=0&showinfo=0&autohide=1&allowfullscreen=true&modestbranding=1';
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrlString);
  }

  ngOnInit() {
    // Initialize translation with current language from shared service
    this.translate.setDefaultLang('fr');
    const currentLang = this.sharedService.getCurrentLanguage();
    this.currentLang = currentLang;
    this.translate.use(currentLang);

    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.currentLang = lang;
      this.translate.use(lang);
    });

    // Initialize animations after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.initializeAnimations();
      this.initializeCustomAccordion();
    }, 100);
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  // Variable to track the visibility of sections
  isVisible = true;

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.checkScrollAnimations();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScrollAnimations();
  }

  private initializeAnimations() {
    // Add initial animations for elements that should be visible on load
    this.addInitialAnimations();
    
    // Check for scroll animations
    this.checkScrollAnimations();
    
    // Add click animations for interactive elements
    this.addClickAnimations();
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

  private addClickAnimations() {
    // Add click animations for buttons (excluding accordion buttons to prevent conflicts)
    const buttons = document.querySelectorAll('.custom-btn, .nav-link');
    buttons.forEach(button => {
      button.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        target.classList.add('shake');
        setTimeout(() => {
          target.classList.remove('shake');
        }, 500);
      });
    });

    // Special handling for accordion buttons - only add visual feedback, not shake animation
    const accordionButtons = document.querySelectorAll('.accordion-button');
    accordionButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        // Don't add shake animation to accordion buttons to prevent conflicts
        // Just add a subtle visual feedback
        const target = event.target as HTMLElement;
        target.style.backgroundColor = '#e9ecef';
        setTimeout(() => {
          target.style.backgroundColor = '';
        }, 200);
      });
    });

    // Add hover animations for cards
    const cards = document.querySelectorAll('.custom-block, .grid-box');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        // Don't add pulse to accordion items
        if (!card.closest('.accordion-item')) {
          card.classList.add('pulse');
        }
      });
      
      card.addEventListener('mouseleave', () => {
        card.classList.remove('pulse');
      });
    });

    // Add rotation animation for icons on hover
    const icons = document.querySelectorAll('.icon-holder i, .header__image__card span i');
    icons.forEach(icon => {
      icon.addEventListener('mouseenter', () => {
        icon.classList.add('rotate');
      });
      
      icon.addEventListener('mouseleave', () => {
        icon.classList.remove('rotate');
      });
    });
  }

  private initializeCustomAccordion() {
    // Custom accordion implementation to replace Bootstrap's
    const accordionButtons = document.querySelectorAll('.accordion-button');
    
    accordionButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const target = event.currentTarget as HTMLElement;
        const accordionItem = target.closest('.accordion-item');
        const collapseElement = accordionItem?.querySelector('.accordion-collapse');
        const accordionBody = accordionItem?.querySelector('.accordion-body');
        
        if (collapseElement && accordionBody) {
          // Toggle the collapsed state
          const isCollapsed = collapseElement.classList.contains('collapse');
          
          // Close all other accordion items first
          const allCollapseElements = document.querySelectorAll('.accordion-collapse');
          const allButtons = document.querySelectorAll('.accordion-button');
          
          allCollapseElements.forEach((el, index) => {
            if (el !== collapseElement) {
              el.classList.add('collapse');
              el.classList.remove('show');
              if (allButtons[index]) {
                allButtons[index].classList.add('collapsed');
                allButtons[index].setAttribute('aria-expanded', 'false');
              }
            }
          });
          
          // Toggle current item
          if (isCollapsed) {
            collapseElement.classList.remove('collapse');
            collapseElement.classList.add('show');
            target.classList.remove('collapsed');
            target.setAttribute('aria-expanded', 'true');
          } else {
            collapseElement.classList.add('collapse');
            collapseElement.classList.remove('show');
            target.classList.add('collapsed');
            target.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });
  }

  // Method to trigger animations programmatically
  triggerAnimation(elementClass: string, animationClass: string) {
    const elements = document.querySelectorAll(elementClass);
    elements.forEach(element => {
      element.classList.add(animationClass);
      setTimeout(() => {
        element.classList.remove(animationClass);
      }, 1000);
    });
  }

  // Method to add bounce animation to important elements
  addBounceToElement(elementSelector: string) {
    const element = document.querySelector(elementSelector);
    if (element) {
      element.classList.add('bounce');
      setTimeout(() => {
        element.classList.remove('bounce');
      }, 2000);
    }
  }

  // Method to add typing effect to text elements
  addTypingEffect(elementSelector: string) {
    const element = document.querySelector(elementSelector);
    if (element) {
      element.classList.add('typing');
    }
  }
}
