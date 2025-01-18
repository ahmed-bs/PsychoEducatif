import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
declare const ScrollReveal: any;
@Component({
  selector: 'app-dashboardClient',
  templateUrl: './dashboardClient.component.html',
  styleUrls: ['./dashboardClient.component.css']
})
export class DashboardClientComponent implements OnInit, AfterViewInit {
  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    // Ajoutez ici tout code d'initialisation nécessaire
  }

  ngAfterViewInit() {
    // Récupération des éléments DOM
    const menuBtn = this.elementRef.nativeElement.querySelector('#menu-btn');
    const navLinks = this.elementRef.nativeElement.querySelector('#nav-links');
    const menuBtnIcon = menuBtn.querySelector('i');

    // Gestion du clic sur le bouton menu
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const isOpen = navLinks.classList.contains('open');
      menuBtnIcon.setAttribute('class', isOpen ? 'ri-close-line' : 'ri-menu-line');
    });

    // Fermeture du menu lors d'un clic sur les liens
    navLinks.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuBtnIcon.setAttribute('class', 'ri-menu-line');
    });

    // Options pour ScrollReveal
    const scrollRevealOption = {
      distance: '50px',
      origin: 'bottom',
      duration: 1000,
    };

    // ScrollReveal Animations
    ScrollReveal().reveal('.header__image img', {
      ...scrollRevealOption,
      origin: 'right',
    });

    ScrollReveal().reveal('.header__content h1', {
      ...scrollRevealOption,
      delay: 500,
    });

    ScrollReveal().reveal('.header__content p', {
      ...scrollRevealOption,
      delay: 1000,
    });

    ScrollReveal().reveal('.header__content form', {
      ...scrollRevealOption,
      delay: 1500,
    });

    ScrollReveal().reveal('.header__content .bar', {
      ...scrollRevealOption,
      delay: 2000,
    });

    ScrollReveal().reveal('.header__image__card', {
      duration: 1000,
      interval: 500,
      delay: 2500,
    });
  }
}
