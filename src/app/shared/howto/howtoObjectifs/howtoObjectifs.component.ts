import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-howtoObjectifs',
  templateUrl: './howtoObjectifs.component.html',
  styleUrls: ['./howtoObjectifs.component.css'],
  standalone: true,
  imports: [CommonModule, TranslateModule]
})
export class HowtoObjectifsComponent implements OnInit, OnDestroy {
  private langSubscription?: Subscription;
  showAddVideoInfo: boolean = false;
  showEditVideoInfo: boolean = false;
  showDeleteVideoInfo: boolean = false;
  showPasserQuizVideoInfo: boolean = false;

  constructor(
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
    // Initialize translation
    const savedLang = localStorage.getItem('lang') || localStorage.getItem('selectedLanguage') || 'fr';
    this.translate.setDefaultLang('fr');
    this.translate.use(savedLang);
    
    // Check if video_info has content for each video
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
    this.translate.get('dashboard.howto_dialog.objectifs.videos.add.video_info').subscribe((text: string) => {
      this.showAddVideoInfo = !!(text && text.trim().length > 0);
    });
    this.translate.get('dashboard.howto_dialog.objectifs.videos.edit.video_info').subscribe((text: string) => {
      this.showEditVideoInfo = !!(text && text.trim().length > 0);
    });
    this.translate.get('dashboard.howto_dialog.objectifs.videos.delete.video_info').subscribe((text: string) => {
      this.showDeleteVideoInfo = !!(text && text.trim().length > 0);
    });
    this.translate.get('dashboard.howto_dialog.objectifs.videos.passer_quiz.video_info').subscribe((text: string) => {
      this.showPasserQuizVideoInfo = !!(text && text.trim().length > 0);
    });
  }

}
