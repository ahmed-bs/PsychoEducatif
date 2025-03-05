import { Component, ElementRef, HostListener, OnInit, Renderer2 } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { SharedService } from 'src/app/core/services/shared.service';

@Component({
  selector: 'app-sidebar-dashboard',
  templateUrl: './sidebar-dashboard.component.html',
  styleUrls: ['./sidebar-dashboard.component.css']
})
export class SidebarDashboardComponent implements OnInit {

  sideLinks!: NodeListOf<HTMLAnchorElement>;

  private sidebarToggleSubscription!: Subscription;
  constructor(private elementRef: ElementRef, private renderer: Renderer2, private router: Router,private sharedservice : SharedService
) {
  this.sidebarToggleSubscription = this.sharedservice.sidebarToggle$.subscribe(() => {
    this.isSidebarClosed = !this.isSidebarClosed;
  });}

  ngOnInit() {}
  isSidebarClosed = false;


  
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.toggleSidebar(event.target.innerWidth);
  }

  private toggleSidebar(windowWidth: number) {
    this.isSidebarClosed = windowWidth < 768;
  }
  ngAfterViewInit(): void {
    this.sideLinks = this.elementRef.nativeElement.querySelectorAll('.sidebar .side-menu li a:not(.logout)');
    this.sideLinks.forEach(item => {
      const li = item.parentElement;
      item.addEventListener('click', () => {
        this.sideLinks.forEach(i => {
          this.renderer.removeClass(i.parentElement, 'active');
        });
        this.renderer.addClass(li, 'active');
      });
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveLink();
    });

    this.updateActiveLink();
  }

  private updateActiveLink(): void {
    this.sideLinks.forEach(item => {
      const li = item.parentElement;
      const href = item.getAttribute('routerLink');
      if (this.router.url === href) {
        this.renderer.addClass(li, 'active');
      } else {
        this.renderer.removeClass(li, 'active');
      }
    });
  }





}
