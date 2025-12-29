import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';
import { ProfileItem } from 'src/app/core/models/ProfileItem';

@Component({
  selector: 'app-Strategy',
  templateUrl: './Strategy.component.html',
  styleUrls: ['./Strategy.component.css']
})
export class StrategyComponent implements OnInit, OnDestroy {
  private languageSubscription!: Subscription;
  currentLanguage: string = 'fr';

  constructor(
    private translate: TranslateService,
    private sharedService: SharedService
  ) { }

  ngOnInit() {
    // Initialize translation with current language from shared service
    this.translate.setDefaultLang('fr');
    const currentLang = this.sharedService.getCurrentLanguage();
    this.currentLanguage = currentLang;
    this.translate.use(currentLang);

    // Subscribe to language changes
    this.languageSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.currentLanguage = lang;
      this.translate.use(lang);
    });
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  /**
   * Returns the translation key with "_en" suffix if language is English
   * @param key The translation key
   * @returns The translation key with suffix if needed
   */
  getTranslationKey(key: string): string {
    if (this.currentLanguage === 'en') {
      return key + '_en';
    }
    return key;
  }

  /**
   * Helper method to get the appropriate field for ProfileItem based on language
   * @param item The ProfileItem object
   * @param fieldName The field name ('name' or 'description')
   * @returns The appropriate field value based on current language
   */
  getItemLanguageField(item: ProfileItem, fieldName: string): string {
    if (this.currentLanguage === 'ar') {
      // For Arabic language, use _ar fields
      if (fieldName === 'name') {
        return item.name_ar || item.name || '';
      } else if (fieldName === 'description') {
        return item.description_ar || item.description || '';
      }
    } else if (this.currentLanguage === 'en') {
      // For English language, use _en fields
      if (fieldName === 'name') {
        return item.name_en || item.name || '';
      } else if (fieldName === 'description') {
        return item.description_en || item.description || '';
      }
    } else {
      // For French language (default), use non-_ar/_en fields
      if (fieldName === 'name') {
        return item.name || '';
      } else if (fieldName === 'description') {
        return item.description || '';
      }
    }
    return '';
  }

}
