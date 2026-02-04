import { Component, OnInit, OnDestroy, HostListener, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar-home',
  templateUrl: './navbar-home.component.html',
  styleUrls: ['./navbar-home.component.css']
})
export class NavbarHomeComponent implements OnInit, OnDestroy, AfterViewInit {
  currentLang: string = 'fr';
  private languageSubscription!: Subscription;
  showLanguageMenu: boolean = false;
  isMobileMenuOpen: boolean = false;

  @ViewChild('menuBtn', { static: false }) menuBtn!: ElementRef;
  @ViewChild('navLinks', { static: false }) navLinks!: ElementRef;

  constructor(
    private sharedService: SharedService,
    private translate: TranslateService
  ) {
    const savedLang = localStorage.getItem('lang') || 'fr';
    this.currentLang = savedLang;
    this.translate.use(this.currentLang);
  }
  
  ngOnInit(): void {
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.currentLang = lang;
      this.translate.use(lang);
    });
  }

  ngAfterViewInit(): void {
    // Setup click handler for nav links to close menu
    if (this.navLinks?.nativeElement) {
      this.navLinks.nativeElement.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // Only close if clicking on a link (a tag) or its parent (li tag)
        if (target.tagName === 'A' || target.closest('a')) {
          this.closeMobileMenu();
        }
      });
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.navLinks?.nativeElement) {
      if (this.isMobileMenuOpen) {
        this.navLinks.nativeElement.classList.add('open');
      } else {
        this.navLinks.nativeElement.classList.remove('open');
      }
    }
    this.updateMenuIcon();
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    if (this.navLinks?.nativeElement) {
      this.navLinks.nativeElement.classList.remove('open');
    }
    this.updateMenuIcon();
  }

  private updateMenuIcon(): void {
    if (this.menuBtn?.nativeElement) {
      const menuBtnIcon = this.menuBtn.nativeElement.querySelector('i');
      if (menuBtnIcon) {
        menuBtnIcon.setAttribute('class', this.isMobileMenuOpen ? 'ri-close-line' : 'ri-menu-line');
      }
    }
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
    // Close mobile menu if clicking outside nav
    if (this.isMobileMenuOpen && !target.closest('nav') && !target.closest('#menu-btn')) {
      this.closeMobileMenu();
    }
  }

  // Close language menu with Escape key
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (this.showLanguageMenu) {
      this.showLanguageMenu = false;
    }
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
}
