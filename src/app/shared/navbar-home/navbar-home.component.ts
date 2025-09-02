import { Component, OnInit, OnDestroy } from '@angular/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar-home',
  templateUrl: './navbar-home.component.html',
  styleUrls: ['./navbar-home.component.css']
})
export class NavbarHomeComponent implements OnInit, OnDestroy {
  currentLang: string = 'fr';
  private languageSubscription!: Subscription;

  constructor(
    private sharedService: SharedService,
    private translate: TranslateService
  ) {
    const savedLang = localStorage.getItem('lang') || 'fr';
    this.currentLang = savedLang;
    this.translate.use(this.currentLang);
  }
  
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

    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.currentLang = lang;
      this.translate.use(lang);
    });
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  // Language switcher method
  switchLanguage(language: string): void {
    this.sharedService.changeLanguage(language);
  }
}
