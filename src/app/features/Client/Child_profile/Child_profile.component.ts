import { Component, OnInit, OnDestroy } from '@angular/core';
import { PickProfileComponent } from "../../../shared/pick_profile/pick_profile.component";
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from '../../../core/services/shared.service';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-Child_profile',
  templateUrl: './Child_profile.component.html',
  styleUrls: ['./Child_profile.component.css'],
  standalone: true,
  imports: [PickProfileComponent, TranslateModule, CommonModule],
})
export class Child_profileComponent implements OnInit, OnDestroy {
  private languageSubscription!: Subscription;

  constructor(
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
    // Initialize translation
    this.translate.addLangs(['fr', 'ar']);
    this.translate.setDefaultLang('fr');
    
    // Get current language from shared service
    const currentLang = this.sharedService.getCurrentLanguage();
    this.translate.use(currentLang);
  }

  ngOnInit() {
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