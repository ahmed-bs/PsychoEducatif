import { Component, OnInit, HostListener } from '@angular/core';
import { SharedService } from 'src/app/core/services/shared.service';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.css']
})
export class UserLayoutComponent implements OnInit {
  isSidebarClosed = false;
  showMobileMenu = false;
  private currentScreenSize: 'desktop' | 'mobile' = 'desktop';
  private lastScreenSize: 'desktop' | 'mobile' = 'desktop';

  constructor(private sharedService: SharedService) {
    this.updateScreenSize();
  }

  ngOnInit() {
    // Subscribe to sidebar toggle events
    this.sharedService.sidebarToggle$.subscribe(() => {
      if (this.currentScreenSize === 'desktop') {
        this.isSidebarClosed = !this.isSidebarClosed;
      }
    });

    // Subscribe to mobile menu toggle events
    this.sharedService.mobileMenuToggle$.subscribe(() => {
      if (this.currentScreenSize === 'mobile') {
        this.showMobileMenu = !this.showMobileMenu;
      }
    });

    this.updateScreenSize();
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
    // Reset all layout states to default (like page refresh)
    this.isSidebarClosed = false;
    this.showMobileMenu = false;
    
    // Force a small delay to ensure DOM updates
    setTimeout(() => {
      // Additional reset if needed
      this.isSidebarClosed = false;
      this.showMobileMenu = false;
    }, 100);
  }

  // Check if we're on desktop
  isDesktop(): boolean {
    return window.innerWidth >= 1024;
  }

  closeMobileMenu() {
    this.showMobileMenu = false;
  }
}