import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-object',
  templateUrl: './Object.component.html',
  styleUrls: ['./Object.component.css']
})
export class ObjectComponent implements OnInit, OnDestroy {
  private languageSubscription!: Subscription;

  constructor(
    private translate: TranslateService,
    private sharedService: SharedService
  ) {}

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
