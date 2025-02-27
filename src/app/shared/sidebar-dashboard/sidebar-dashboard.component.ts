import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-sidebar-dashboard',
  templateUrl: './sidebar-dashboard.component.html',
  styleUrls: ['./sidebar-dashboard.component.css']
})
export class SidebarDashboardComponent implements OnInit {

  sideLinks!: NodeListOf<HTMLAnchorElement>;

  constructor(private elementRef: ElementRef, private renderer: Renderer2, private router: Router) {}

  ngOnInit() {}

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
