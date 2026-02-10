import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-howtoCalendar',
  templateUrl: './howtoCalendar.component.html',
  styleUrls: ['./howtoCalendar.component.css'],
  standalone: true,
  imports: [CommonModule, TranslateModule]
})
export class HowtoCalendarComponent implements OnInit, OnDestroy {
  private langSubscription?: Subscription;
  showCalendarVideoInfo: boolean = false;
  showModifyGoalVideoInfo: boolean = false;
  showDeleteGoalVideoInfo: boolean = false;
  showAnswerQuizVideoInfo: boolean = false;

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
    this.translate.get('dashboard.howto_dialog.calendar.videos.calendar_view.video_info').subscribe((text: string) => {
      this.showCalendarVideoInfo = !!(text && text.trim().length > 0);
    });
    this.translate.get('dashboard.howto_dialog.calendar.videos.modify_goal.video_info').subscribe((text: string) => {
      this.showModifyGoalVideoInfo = !!(text && text.trim().length > 0);
    });
    this.translate.get('dashboard.howto_dialog.calendar.videos.delete_goal.video_info').subscribe((text: string) => {
      this.showDeleteGoalVideoInfo = !!(text && text.trim().length > 0);
    });
    this.translate.get('dashboard.howto_dialog.calendar.videos.answer_quiz.video_info').subscribe((text: string) => {
      this.showAnswerQuizVideoInfo = !!(text && text.trim().length > 0);
    });
  }

}
