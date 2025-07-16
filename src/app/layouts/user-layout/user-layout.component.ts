import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/core/services/shared.service';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.css']
})
export class UserLayoutComponent implements OnInit, OnDestroy {

  isSidebarClosed = false; // Controls the desktop sidebar collapse
  showMobileMenu = false; // Controls the mobile off-canvas menu visibility

  private sidebarToggleSubscription!: Subscription;
  private mobileMenuToggleSubscription!: Subscription; // New subscription for mobile menu

  constructor(private sharedService: SharedService) { }

  ngOnInit() {
    // Subscribe to desktop sidebar toggle events
    this.sidebarToggleSubscription = this.sharedService.sidebarToggle$.subscribe(() => {
      this.isSidebarClosed = !this.isSidebarClosed;
    });

    // Subscribe to mobile menu toggle events
    this.mobileMenuToggleSubscription = this.sharedService.mobileMenuToggle$.subscribe(() => {
      this.showMobileMenu = !this.showMobileMenu;
    });

    // Initial check for sidebar state based on window width
    this.toggleSidebarOnLoad(window.innerWidth);
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.sidebarToggleSubscription) {
      this.sidebarToggleSubscription.unsubscribe();
    }
    if (this.mobileMenuToggleSubscription) {
      this.mobileMenuToggleSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.toggleSidebarOnLoad(event.target.innerWidth);
  }

  private toggleSidebarOnLoad(windowWidth: number) {
    // For desktop (md breakpoint and up), control isSidebarClosed
    if (windowWidth >= 768) {
      // If desktop, ensure mobile menu is closed
      this.showMobileMenu = false;
      // Keep isSidebarClosed as it was or set initial state for desktop
      // This allows the desktop sidebar to remember its collapsed state
      // or to be initially open/closed based on your preference.
      // For now, let's keep it consistent with your original media query:
      // If you want it always open on large screens unless manually toggled,
      // you might remove this line or adjust the logic.
      // this.isSidebarClosed = false; // Example: always open on desktop by default
    } else {
      // For mobile (below md breakpoint), ensure desktop sidebar is logically "closed"
      // This is crucial because the desktop sidebar is hidden by `hidden md:block`
      this.isSidebarClosed = true;
    }
  }

  closeMobileMenu() {
    this.showMobileMenu = false;
  }
}