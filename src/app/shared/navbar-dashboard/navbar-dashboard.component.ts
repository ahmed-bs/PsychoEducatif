import { Component, OnInit, HostListener } from '@angular/core';
import { SharedService } from 'src/app/core/services/shared.service';

@Component({
  selector: 'app-navbar-dashboard',
  templateUrl: './navbar-dashboard.component.html',
  styleUrls: ['./navbar-dashboard.component.css']
})
export class NavbarDashboardComponent implements OnInit {

  isSidebarClosed = true;
  constructor(private sharedService: SharedService) { }

  toggleSidebar(): void {
    this.sharedService.toggleSidebar();
  }

  ngOnInit() {
  }

}
