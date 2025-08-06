import { Component, OnInit, HostListener } from '@angular/core';
import { SharedService } from 'src/app/core/services/shared.service';

@Component({
  selector: 'app-navbar-dashboard',
  templateUrl: './navbar-dashboard.component.html',
  styleUrls: ['./navbar-dashboard.component.css']
})
export class NavbarDashboardComponent implements OnInit {

  private currentScreenSize: 'desktop' | 'mobile' = 'desktop';
  private lastScreenSize: 'desktop' | 'mobile' = 'desktop';
  currentLanguage: 'fr' | 'ar' = 'fr';

  constructor(private sharedService: SharedService) { }

  ngOnInit() {
    this.updateScreenSize();
    // Load saved language preference
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'ar')) {
      this.currentLanguage = savedLanguage;
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
  switchLanguage(lang: 'fr' | 'ar'): void {
    this.currentLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    
    // Emit language change event (you can subscribe to this in your app component)
    // this.sharedService.languageChanged.emit(lang);
    
    // Reload page to apply language changes
    window.location.reload();
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