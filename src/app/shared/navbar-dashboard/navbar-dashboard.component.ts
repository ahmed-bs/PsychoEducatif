import { Component, OnInit } from '@angular/core';
import { SharedService } from 'src/app/core/services/shared.service';

@Component({
  selector: 'app-navbar-dashboard',
  templateUrl: './navbar-dashboard.component.html',
  styleUrls: ['./navbar-dashboard.component.css']
})
export class NavbarDashboardComponent implements OnInit {

  constructor(private sharedService: SharedService) { }

  ngOnInit() { }

  // This single method will handle toggling based on screen size
  toggleSidebarState(): void {
    // Check if the current screen width is below the 'md' breakpoint (768px)
    if (window.innerWidth < 768) {
      // If on a small screen, toggle the mobile off-canvas menu
      this.sharedService.toggleMobileMenu();
    } else {
      // If on a medium or large screen, toggle the desktop sidebar collapse
      this.sharedService.toggleSidebar();
    }
  }
}