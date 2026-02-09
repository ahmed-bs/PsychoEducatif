import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-howtoCompetance',
  templateUrl: './howtoCompetance.component.html',
  styleUrls: ['./howtoCompetance.component.css'],
  standalone: true,
  imports: [CommonModule, TranslateModule]
})
export class HowtoCompetanceComponent implements OnInit, OnDestroy {
  private langSubscription?: Subscription;
  showVideoInfo: boolean = false;

  constructor(
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
    // Initialize translation
    const savedLang = localStorage.getItem('lang') || localStorage.getItem('selectedLanguage') || 'fr';
    this.translate.setDefaultLang('fr');
    this.translate.use(savedLang);
    
    // Check if video_info has content
    this.translate.get('dashboard.howto_dialog.competance.video_info').subscribe((text: string) => {
      this.showVideoInfo = !!(text && text.trim().length > 0);
    });
    
    // Subscribe to language changes
    this.langSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
      this.translate.get('dashboard.howto_dialog.competance.video_info').subscribe((text: string) => {
        this.showVideoInfo = !!(text && text.trim().length > 0);
      });
    });
  }

  ngOnInit() {
    // Ensure translations are loaded
    const savedLang = localStorage.getItem('lang') || localStorage.getItem('selectedLanguage') || 'fr';
    this.translate.use(savedLang);
    this.translate.get('dashboard.howto_dialog.competance.video_info').subscribe((text: string) => {
      this.showVideoInfo = !!(text && text.trim().length > 0);
    });
  }

  ngOnDestroy() {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

}
