import { Component, HostListener, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/core/services/shared.service';
@Component({
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent implements OnInit {


  ngOnInit() {
  }
  title = 'rendezvous';
  isSidebarClosed = false;
  private sidebarToggleSubscription!: Subscription;
  sideLinks!: NodeListOf<HTMLAnchorElement>;

  constructor(private sharedservice : SharedService) { 
    this.sidebarToggleSubscription = this.sharedservice.sidebarToggle$.subscribe(() => {
      this.isSidebarClosed = !this.isSidebarClosed;
    });
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.toggleSidebar(event.target.innerWidth);
  }

  private toggleSidebar(windowWidth: number) {
    this.isSidebarClosed = windowWidth < 768;
  }
}
