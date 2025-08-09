import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from './core/services/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],

})
export class AppComponent implements OnInit, OnDestroy {
  title = 'PsychoEducatif';
  private languageSubscription: Subscription;

  constructor(
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
    // Set default language
    this.translate.setDefaultLang('ar');
    
    // Get saved language from localStorage or default to 'ar'
    const savedLang = localStorage.getItem('lang') || 'ar';
    this.translate.use(savedLang);
    
    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
    });
  }

  ngOnInit() {
    // Initialize translation with saved language
    const savedLang = localStorage.getItem('lang') || 'ar';
    this.translate.use(savedLang);
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }
}
