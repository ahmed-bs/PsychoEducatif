import { Component, ElementRef, HostListener, OnInit, Renderer2, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { SharedService } from 'src/app/core/services/shared.service';

@Component({
  selector: 'app-sidebar-client',
  templateUrl: './sidebar-client.component.html',
  styleUrls: ['./sidebar-client.component.css']
})
export class SidebarClientComponent implements OnInit, OnDestroy {
  sideLinks!: NodeListOf<HTMLAnchorElement>;

  // This property and logic are primarily for the desktop sidebar's 'close' state
  isSidebarClosed = false;

  private sidebarToggleSubscription!: Subscription;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private sharedService: SharedService // Corrected service name
  ) {
    // This subscription keeps the sidebar-client component's internal isSidebarClosed
    // in sync with the state managed by user-layout via sharedService.
    this.sidebarToggleSubscription = this.sharedService.sidebarToggle$.subscribe(() => {
      this.isSidebarClosed = !this.isSidebarClosed;
    });
  }

  ngOnInit() {}

  ngAfterViewInit(): void {
    // Ensure these run after view initializes
    this.sideLinks = this.elementRef.nativeElement.querySelectorAll('.sidebar .side-menu li a:not(.logout)');
    this.sideLinks.forEach(item => {
      const li = item.parentElement;
      item.addEventListener('click', () => {
        this.sideLinks.forEach(i => {
          this.renderer.removeClass(i.parentElement, 'active');
        });
        this.renderer.addClass(li, 'active');
        // Close mobile menu when a link is clicked
        if (window.innerWidth < 768) { // Only close if on a mobile screen
            this.sharedService.toggleMobileMenu();
        }
      });
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveLink();
    });

    this.updateActiveLink();
  }

  ngOnDestroy(): void {
    if (this.sidebarToggleSubscription) {
      this.sidebarToggleSubscription.unsubscribe();
    }
  }


  private updateActiveLink(): void {
    this.sideLinks.forEach(item => {
      const li = item.parentElement;
      // Get the raw routerLink value without attempting to resolve it
      const rawRouterLink = item.getAttribute('routerLink');
      
      // Handle cases where routerLink might be dynamic (e.g., /profiles/:id)
      // For exact matches, use router.url directly. For dynamic, you might need
      // a more sophisticated regex match or parse the active route.
      // For now, assuming exact match or base path for simplicity.
      
      let isLinkActive = false;
      if (rawRouterLink) {
        // Handle the dynamic part of the route for '/Dashboard-client/client/:id'
        if (rawRouterLink.includes(':id') && this.router.url.startsWith(rawRouterLink.substring(0, rawRouterLink.indexOf(':id') - 1))) {
          isLinkActive = true;
        } else if (this.router.url === rawRouterLink) {
          isLinkActive = true;
        }
      }

      if (isLinkActive) {
        this.renderer.addClass(li, 'active');
      } else {
        this.renderer.removeClass(li, 'active');
      }
    });
  }

  getChildId() {
    return localStorage.getItem('selectedChildId') || 'default';
  }
}