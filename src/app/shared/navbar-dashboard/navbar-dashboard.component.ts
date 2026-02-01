import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/core/services/shared.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/core/services/authService.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar-dashboard',
  templateUrl: './navbar-dashboard.component.html',
  styleUrls: ['./navbar-dashboard.component.css']
})
export class NavbarDashboardComponent implements OnInit, OnDestroy {
  currentLang: string = 'fr';
  currentUser: any = null;
  private languageSubscription!: Subscription;
  showLanguageMenu: boolean = false;
  showEvaluationMenu: boolean = false;
  showUserMenu: boolean = false;

  constructor(
    private sharedService: SharedService,
    private translate: TranslateService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
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
    this.getCurrentUser();
    
    // Setup mobile menu toggle
    const menuBtn = document.getElementById('menu-btn');
    const navLinks = document.getElementById('nav-links');
    const menuBtnIcon = menuBtn?.querySelector('i');

    menuBtn?.addEventListener('click', () => {
      navLinks?.classList.toggle('open');
      const isOpen = navLinks?.classList.contains('open');
      menuBtnIcon?.setAttribute('class', isOpen ? 'ri-close-line' : 'ri-menu-line');
    });

    // Close menu when clicking on a link or button
    navLinks?.addEventListener('click', (e) => {
      const target = e?.target as HTMLElement;
      if (target && (target.tagName === 'A' || target.closest('a') || target.tagName === 'BUTTON' || target.closest('button'))) {
        // Don't close if clicking on dropdown toggle buttons
        if (!target.closest('.nav__dropdown > a') && !target.closest('.lang-icon-btn')) {
          navLinks?.classList.remove('open');
          menuBtnIcon?.setAttribute('class', 'ri-menu-line');
        }
      }
    });
  }

  // Helper method to close mobile menu
  private closeMobileMenu() {
    const navLinks = document.getElementById('nav-links');
    const menuBtn = document.getElementById('menu-btn');
    const menuBtnIcon = menuBtn?.querySelector('i');
    navLinks?.classList.remove('open');
    menuBtnIcon?.setAttribute('class', 'ri-menu-line');
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

  getUserDisplayName(): string {
    if (!this.currentUser) {
      return 'User';
    }
    
    // Prefer username over email
    let name = this.currentUser.username || '';
    
    // If username looks like an email or contains underscore with numbers, format it
    if (name.includes('@')) {
      // It's an email, try to get a better display name
      name = this.currentUser.first_name || this.currentUser.last_name || name.split('@')[0];
    } else if (name.includes('_') && /_\d+/.test(name)) {
      // Extract the part before the underscore and capitalize it
      name = name.split('_')[0];
      name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    } else if (name) {
      // Capitalize first letter of each word
      name = name.split(' ').map((word: string) => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
    
    return name || 'User';
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  // Get child ID for routing
  getChildId(): string {
    return localStorage.getItem('selectedChildId') || '1';
  }

  // Language switcher method
  switchLanguage(language: string) {
    this.sharedService.changeLanguage(language);
    this.showLanguageMenu = false;
    // Close mobile menu if open
    this.closeMobileMenu();
  }

  // Toggle language menu
  toggleLanguageMenu() {
    this.showLanguageMenu = !this.showLanguageMenu;
    this.showEvaluationMenu = false;
    this.showUserMenu = false;
  }

  // Toggle evaluation dropdown
  toggleEvaluationMenu() {
    this.showEvaluationMenu = !this.showEvaluationMenu;
    this.showUserMenu = false;
    this.showLanguageMenu = false;
  }

  closeEvaluationMenu() {
    this.showEvaluationMenu = false;
    // Close mobile menu if on mobile after navigation
    setTimeout(() => {
      if (window.innerWidth <= 767) {
        this.closeMobileMenu();
      }
    }, 100);
  }

  // Check if evaluation route is active
  isEvaluationActive(): boolean {
    const currentUrl = this.router.url;
    return currentUrl.includes('/evaluations_configurations') || currentUrl.includes('/explore');
  }

  // Toggle user menu
  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    this.showEvaluationMenu = false;
    this.showLanguageMenu = false;
  }

  // Change Profile - Navigate to profile selection page
  changeProfile() {
    this.showUserMenu = false;
    this.closeMobileMenu();
    this.router.navigate(['/pick_profileComponent']);
  }

  // Logout
  logout() {
    this.showUserMenu = false;
    this.closeMobileMenu();
    this.authService.logout();
  }

  // Download Documentation PDF
  downloadDocumentation() {
    // PDF should be in assets folder: assets/Documentation-de-lApplication-PsychoEducatif.pdf
    const pdfPath = 'assets/Documentation-de-lApplication-PsychoEducatif.pdf';
    
    this.http.get(pdfPath, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        this.triggerDownload(blob, 'Documentation-de-lApplication-PsychoEducatif.pdf');
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        alert(this.translate.instant('navbar.errors.pdf_not_found') || 'PDF file not found. Please ensure the file is in the assets folder.');
      }
    });
    
    // Close mobile menu if open
    this.closeMobileMenu();
  }

  private triggerDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Close menus when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const navLinks = document.getElementById('nav-links');
    const menuBtn = document.getElementById('menu-btn');
    
    // Close mobile menu if clicking outside nav and menu button
    if (window.innerWidth <= 767 && navLinks?.classList.contains('open')) {
      if (!target.closest('nav') && !target.closest('#menu-btn')) {
        this.closeMobileMenu();
      }
    }
    
    if (!target.closest('.language-menu-container') && this.showLanguageMenu) {
      this.showLanguageMenu = false;
    }
    if (!target.closest('.nav__dropdown') && this.showEvaluationMenu) {
      this.showEvaluationMenu = false;
    }
    if (!target.closest('.nav__user-menu') && this.showUserMenu) {
      this.showUserMenu = false;
    }
    if (!target.closest('.nav__right-section') && !target.closest('.nav__right-section-mobile') && (this.showLanguageMenu || this.showUserMenu)) {
      this.showLanguageMenu = false;
      this.showUserMenu = false;
    }
  }

  // Close menus with Escape key
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    this.showLanguageMenu = false;
    this.showEvaluationMenu = false;
    this.showUserMenu = false;
    this.closeMobileMenu();
  }

  // Handle window resize to close mobile menu if switching to desktop
  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event) {
    if (window.innerWidth > 767) {
      this.closeMobileMenu();
    }
  }
}