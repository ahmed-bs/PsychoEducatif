import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/core/services/authService.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar-dashboard',
  templateUrl: './navbar-dashboard.component.html',
  styleUrls: ['./navbar-dashboard.component.css']
})
export class NavbarDashboardComponent implements OnInit, OnDestroy {

  private currentScreenSize: 'desktop' | 'mobile' = 'desktop';
  private lastScreenSize: 'desktop' | 'mobile' = 'desktop';
  currentLang: string = 'fr';
  currentUser: any = null;
  private languageSubscription: Subscription;
  showLanguageMenu: boolean = false;

  constructor(
    private sharedService: SharedService,
    private translate: TranslateService,
    private authService: AuthService
  ) {
    const savedLang = localStorage.getItem('lang') || 'fr';
    this.currentLang = savedLang;
    this.translate.use(this.currentLang);
    
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.currentLang = lang;
      this.translate.use(lang);
    });
  }

  ngOnInit() {
    this.updateScreenSize();
    this.getCurrentUser();
  }

  getCurrentUser() {
    this.currentUser = this.authService.currentUserValue;
    // If no user data, try to get from localStorage as fallback
    if (!this.currentUser) {
      const userFromStorage = localStorage.getItem('user');
      if (userFromStorage) {
        try {
          this.currentUser = JSON.parse(userFromStorage);
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.updateScreenSize();
  }

  private updateScreenSize() {
    this.lastScreenSize = this.currentScreenSize;
    this.currentScreenSize = this.isDesktop() ? 'desktop' : 'mobile';
    
    // If screen size changed, reset everything like a page refresh
    if (this.lastScreenSize !== this.currentScreenSize) {
      this.resetToDefaultState();
    }
  }

  private resetToDefaultState() {
    // Reset any navbar states to default (like page refresh)
    // Force a small delay to ensure DOM updates
    setTimeout(() => {
      // Additional reset if needed
    }, 100);
  }

  // Check if we're on desktop
  isDesktop(): boolean {
    return window.innerWidth >= 1024;
  }

  // Language switcher method
  switchLanguage(language: string) {
    this.sharedService.changeLanguage(language);
    this.showLanguageMenu = false; // Close menu after selection
  }

  // Toggle language menu
  toggleLanguageMenu() {
    this.showLanguageMenu = !this.showLanguageMenu;
  }

  // Close language menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.language-menu-container')) {
      this.showLanguageMenu = false;
    }
  }

  toggleSidebarState(): void {
    const currentUrl = window.location.pathname;
    const isClientLayout = currentUrl.includes('Dashboard-client');

    if (this.currentScreenSize === 'desktop') {
      // Desktop: Toggle desktop sidebar
      this.sharedService.toggleSidebar();
    } else if (isClientLayout) {
      // Mobile/Tablet + Client Layout: Toggle mobile sidebar
      this.sharedService.toggleMobileSidebar();
    } else {
      // Mobile/Tablet + Admin Layout: Toggle mobile off-canvas menu
      this.sharedService.toggleMobileMenu();
    }
  }
}