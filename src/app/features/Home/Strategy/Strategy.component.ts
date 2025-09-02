import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-Strategy',
  templateUrl: './Strategy.component.html',
  styleUrls: ['./Strategy.component.css']
})
export class StrategyComponent implements OnInit, OnDestroy {
  private languageSubscription!: Subscription;

  constructor(
    private translate: TranslateService,
    private sharedService: SharedService
  ) { }

  ngOnInit() {
    // Initialize translation with current language from shared service
    this.translate.setDefaultLang('fr');
    const currentLang = this.sharedService.getCurrentLanguage();
    this.translate.use(currentLang);

    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
    });
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

}
