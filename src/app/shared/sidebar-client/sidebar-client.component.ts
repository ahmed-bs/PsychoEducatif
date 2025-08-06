import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/core/services/shared.service';

@Component({
  selector: 'app-sidebar-client',
  templateUrl: './sidebar-client.component.html',
  styleUrls: ['./sidebar-client.component.css']
})
export class SidebarClientComponent implements OnInit, OnDestroy {
  
  isSidebarClosed = false;
  showMobileSidebar = false;
  private currentScreenSize: 'desktop' | 'mobile' = 'desktop';
  private lastScreenSize: 'desktop' | 'mobile' = 'desktop';

  constructor(
    private router: Router,
    private sharedService: SharedService
  ) {
    this.updateScreenSize();
  }

  ngOnInit() {
    // Subscribe to sidebar toggle events
    this.sharedService.sidebarToggle$.subscribe(() => {
      if (this.currentScreenSize === 'desktop') {
        this.toggleSidebar();
      }
    });

    // Subscribe to mobile sidebar toggle events
    this.sharedService.mobileSidebarToggle$.subscribe(() => {
      if (this.currentScreenSize === 'mobile') {
        this.toggleMobileMenu();
      }
    });

    // Initialize screen size
    this.updateScreenSize();
  }

  ngOnDestroy() {
    // Cleanup subscriptions if needed
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
    // Reset all states to default (like page refresh)
    this.isSidebarClosed = false;
    this.showMobileSidebar = false;
    
    // Force a small delay to ensure DOM updates
    setTimeout(() => {
      // Additional reset if needed
      this.isSidebarClosed = false;
      this.showMobileSidebar = false;
    }, 100);
  }

  // Toggle desktop sidebar
  toggleSidebar() {
    if (this.currentScreenSize === 'desktop') {
      this.isSidebarClosed = !this.isSidebarClosed;
    }
  }

  // Toggle mobile menu
  toggleMobileMenu() {
    if (this.currentScreenSize === 'mobile') {
      this.showMobileSidebar = !this.showMobileSidebar;
    }
  }

  // Check if we're on desktop
  isDesktop(): boolean {
    return window.innerWidth >= 1024;
  }

  // Get child ID for routing
  getChildId() {
    return localStorage.getItem('selectedChildId') || 'default';
  }
}