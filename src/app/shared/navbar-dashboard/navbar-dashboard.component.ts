import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-navbar-dashboard',
  templateUrl: './navbar-dashboard.component.html',
  styleUrls: ['./navbar-dashboard.component.css']
})
export class NavbarDashboardComponent implements OnInit {

  // Références pour le menu et l'overlay
  navbar: HTMLElement | null = null;
  overlay: HTMLElement | null = null;
  header: HTMLElement | null = null;

  constructor() { }

  ngOnInit(): void {
    // Initialisation des éléments après le chargement du composant
    this.navbar = document.querySelector('[data-navbar]') as HTMLElement;
    this.overlay = document.querySelector('[data-overlay]') as HTMLElement;
    this.header = document.querySelector('[data-header]') as HTMLElement;
  }

  // Bascule la visibilité de la navbar et de l'overlay
  toggleNavbar(): void {
    if (this.navbar && this.overlay) {
      this.navbar.classList.toggle('active');
      this.overlay.classList.toggle('active');
      document.body.classList.toggle('nav-active');
    }
  }

  // Écouter l'événement de clic sur les éléments qui déclenchent le basculement du menu
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Vérifier si le clic est sur un élément de type "nav-toggler" et si la navbar est visible
    if (this.navbar && this.overlay) {
      if ((event.target as HTMLElement).matches('[data-nav-toggler]')) {
        this.toggleNavbar();
      }
    }
  }

  // Écouteur pour le scroll de la fenêtre
  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    if (this.header) {
      if (window.scrollY > 100) {
        this.header.classList.add('active');
      } else {
        this.header.classList.remove('active');
      }
    }
  }
}
