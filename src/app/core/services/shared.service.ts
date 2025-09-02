import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  // For Desktop Sidebar Collapse (triggered by the main layout / desktop menu icon)
  private sidebarToggleSubject = new Subject<void>();
  sidebarToggle$ = this.sidebarToggleSubject.asObservable();

  // For Mobile Off-Canvas Menu Visibility (triggered by mobile hamburger icon)
  private mobileMenuToggleSubject = new Subject<void>();
  mobileMenuToggle$ = this.mobileMenuToggleSubject.asObservable();

  // For Mobile Sidebar Menu (client layout specific)
  private mobileSidebarToggleSubject = new Subject<void>();
  mobileSidebarToggle$ = this.mobileSidebarToggleSubject.asObservable();

  // For Language Changes
  private languageChangeSubject = new BehaviorSubject<string>('fr');
  languageChange$ = this.languageChangeSubject.asObservable();

  // Track current screen size
  private currentScreenSize: 'desktop' | 'mobile' = 'desktop';
  private lastScreenSize: 'desktop' | 'mobile' = 'desktop';

  constructor() {
    this.updateScreenSize();
    // Initialize with saved language
    const savedLang = localStorage.getItem('lang') || 'fr';
    this.languageChangeSubject.next(savedLang);
  }

  private updateScreenSize() {
    this.lastScreenSize = this.currentScreenSize;
    this.currentScreenSize = window.innerWidth >= 1024 ? 'desktop' : 'mobile';
    
    // If screen size changed, reset everything like a page refresh
    if (this.lastScreenSize !== this.currentScreenSize) {
      this.resetToDefaultState();
    }
  }

  private resetToDefaultState() {
    // Reset all service states to default (like page refresh)
    // Force a small delay to ensure all components update
    setTimeout(() => {
      // Additional reset if needed
    }, 100);
  }

  // Method to toggle the desktop sidebar (collapse/expand)
  toggleSidebar(): void {
    this.updateScreenSize();
    if (this.currentScreenSize === 'desktop') {
      this.sidebarToggleSubject.next();
    }
  }

  // Method to toggle the mobile off-canvas menu (show/hide)
  toggleMobileMenu(): void {
    this.updateScreenSize();
    if (this.currentScreenSize === 'mobile') {
      this.mobileMenuToggleSubject.next();
    }
  }

  // Method to toggle the mobile sidebar menu (client layout)
  toggleMobileSidebar(): void {
    this.updateScreenSize();
    if (this.currentScreenSize === 'mobile') {
      this.mobileSidebarToggleSubject.next();
    }
  }

  // Method to change language globally
  changeLanguage(language: string): void {
    localStorage.setItem('lang', language);
    this.languageChangeSubject.next(language);
  }

  // Get current language
  getCurrentLanguage(): string {
    return this.languageChangeSubject.value;
  }

  // Get current screen size
  getCurrentScreenSize(): 'desktop' | 'mobile' {
    this.updateScreenSize();
    return this.currentScreenSize;
  }
}