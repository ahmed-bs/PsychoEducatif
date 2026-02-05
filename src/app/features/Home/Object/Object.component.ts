import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-object',
  templateUrl: './Object.component.html',
  styleUrls: ['./Object.component.css']
})
export class ObjectComponent implements OnInit, OnDestroy {
  private languageSubscription!: Subscription;
  flippedCards: Set<number> = new Set();
  private touchHandled: boolean = false;

  constructor(
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
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  toggleCard(index: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.flippedCards.has(index)) {
      this.flippedCards.delete(index);
    } else {
      this.flippedCards.add(index);
    }
  }

  isCardFlipped(index: number): boolean {
    return this.flippedCards.has(index);
  }

  onCardClick(index: number, event: MouseEvent): void {
    // Prevent double-toggling on touch devices
    if (this.touchHandled) {
      this.touchHandled = false;
      return;
    }
    this.toggleCard(index, event);
  }

  onCardTouch(index: number, event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.touchHandled = true;
    this.toggleCard(index, event);
    // Reset flag after a short delay to allow click event to be ignored
    setTimeout(() => {
      this.touchHandled = false;
    }, 300);
  }
}
