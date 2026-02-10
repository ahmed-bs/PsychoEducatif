import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-howtoCategory',
  templateUrl: './howtoCategory.component.html',
  styleUrls: ['./howtoCategory.component.css'],
  standalone: true,
  imports: [CommonModule, TranslateModule]
})
export class HowtoCategoryComponent implements OnInit, OnDestroy {
  private langSubscription?: Subscription;
  showAddCategoryVideoInfo: boolean = false;
  showEditCategoryVideoInfo: boolean = false;
  showDeleteCategoryVideoInfo: boolean = false;

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
    this.translate.get('dashboard.howto_dialog.category.videos.add_category.video_info').subscribe((text: string) => {
      this.showAddCategoryVideoInfo = !!(text && text.trim().length > 0);
    });
    this.translate.get('dashboard.howto_dialog.category.videos.edit_category.video_info').subscribe((text: string) => {
      this.showEditCategoryVideoInfo = !!(text && text.trim().length > 0);
    });
    this.translate.get('dashboard.howto_dialog.category.videos.delete_category.video_info').subscribe((text: string) => {
      this.showDeleteCategoryVideoInfo = !!(text && text.trim().length > 0);
    });
  }

}
