import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar-home',
  templateUrl: './navbar-home.component.html',
  styleUrls: ['./navbar-home.component.css']
})
export class NavbarHomeComponent implements OnInit, OnDestroy {
  currentLang: string = 'fr';
  private languageSubscription!: Subscription;
  showLanguageMenu: boolean = false;

  constructor(
    private sharedService: SharedService,
    private translate: TranslateService
  ) {
    const savedLang = localStorage.getItem('lang') || 'fr';
    this.currentLang = savedLang;
    this.translate.use(this.currentLang);
  }
  
  ngOnInit(): void {
    const menuBtn = document.getElementById('menu-btn');
    const navLinks = document.getElementById('nav-links');
    const menuBtnIcon = menuBtn?.querySelector('i');

    menuBtn?.addEventListener('click', () => {
      navLinks?.classList.toggle('open');
      const isOpen = navLinks?.classList.contains('open');
      menuBtnIcon?.setAttribute('class', isOpen ? 'ri-close-line' : 'ri-menu-line');
    });

    // Close menu when clicking on a link (not on the entire navLinks container)
    navLinks?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      // Only close if clicking on a link (a tag) or its parent (li tag)
      if (target.tagName === 'A' || target.closest('a')) {
        navLinks?.classList.remove('open');
        menuBtnIcon?.setAttribute('class', 'ri-menu-line');
      }
    });

    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.currentLang = lang;
      this.translate.use(lang);
    });
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  // Language switcher method
  switchLanguage(language: string): void {
    this.sharedService.changeLanguage(language);
    this.showLanguageMenu = false; // Close menu after selection
  }

  // Toggle language menu
  toggleLanguageMenu(): void {
    this.showLanguageMenu = !this.showLanguageMenu;
  }

  // Close language menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.language-menu-container') && this.showLanguageMenu) {
      this.showLanguageMenu = false;
    }
  }

  // Close language menu with Escape key
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showLanguageMenu) {
      this.showLanguageMenu = false;
    }
  }
}
