import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

    constructor() { }
  
    ngOnInit(): void {
      const menuBtn = document.getElementById('menu-btn');
      const navLinks = document.getElementById('nav-links');
      const menuBtnIcon = menuBtn?.querySelector('i');
  
      menuBtn?.addEventListener('click', () => {
        navLinks?.classList.toggle('open');
        const isOpen = navLinks?.classList.contains('open');
        menuBtnIcon?.setAttribute('class', isOpen ? 'ri-close-line' : 'ri-menu-line');
      });
  
      navLinks?.addEventListener('click', () => {
        navLinks?.classList.remove('open');
        menuBtnIcon?.setAttribute('class', 'ri-menu-line');
      });
    }
}
