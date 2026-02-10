import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-howtoPersonalisePei',
  templateUrl: './howtoPersonalisePei.component.html',
  styleUrls: ['./howtoPersonalisePei.component.css'],
  standalone: true,
  imports: [CommonModule, TranslateModule]
})
export class HowtoPersonalisePeiComponent implements OnInit, OnDestroy {
  private langSubscription?: Subscription;
  showPersonalisePeiVideoInfo: boolean = false;

  constructor(
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
    // Initialize translation
    const savedLang = localStorage.getItem('lang') || localStorage.getItem('selectedLanguage') || 'fr';
    this.translate.setDefaultLang('fr');
    this.translate.use(savedLang);
    
    // Check if video_info has content
    this.checkVideoInfo();
    
    // Subscribe to language changes
    this.langSubscription = this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
      this.checkVideoInfo();
    });
  }

  ngOnInit() {
    // Ensure translations are loaded
    const savedLang = localStorage.getItem('lang') || localStorage.getItem('selectedLanguage') || 'fr';
    this.translate.use(savedLang);
    this.checkVideoInfo();
  }

  ngOnDestroy() {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  private checkVideoInfo(): void {
    this.translate.get('dashboard.howto_dialog.personalise_pei.videos.personalise_pei.video_info').subscribe((text: string) => {
      this.showPersonalisePeiVideoInfo = !!(text && text.trim().length > 0);
    });
  }

}
