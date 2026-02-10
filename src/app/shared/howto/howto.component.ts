import { Component, OnInit, Output, EventEmitter, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HowtoStaticComponent } from './howtoStatic/howtoStatic.component';
import { HowtoCompetanceComponent } from './howtoCompetance/howtoCompetance.component';
import { HowtoNotesComponent } from './howtoNotes/howtoNotes.component';
import { HowtoObjectifsComponent } from './howtoObjectifs/howtoObjectifs.component';
import { HowtoStrategieComponent } from './howtoStrategie/howtoStrategie.component';
import { HowtochangeProfComponent } from './howtochangeProf/howtochangeProf.component';
import { HowtoUploadfileComponent } from './howtoUploadfile/howtoUploadfile.component';
import { HowtoSummaryComponent } from './howtoSummary/howtoSummary.component';
import { HowtoCalendarComponent } from './howtoCalendar/howtoCalendar.component';
import { HowtoExplorerComponent } from './howtoExplorer/howtoExplorer.component';
import { HowtoCategoryComponent } from './howtoCategory/howtoCategory.component';
import { HowtoDomaineComponent } from './HowtoDomaine/HowtoDomaine.component';
import { HowtoItemComponent } from './howtoItem/howtoItem.component';
import { SharedService } from 'src/app/core/services/shared.service';

@Component({
  selector: 'app-howto',
  templateUrl: './howto.component.html',
  styleUrls: ['./howto.component.css'],
  standalone: true,
  imports: [CommonModule, TranslateModule, HowtoStaticComponent, HowtoCompetanceComponent, HowtoNotesComponent, HowtoObjectifsComponent, HowtoStrategieComponent, HowtochangeProfComponent, HowtoUploadfileComponent, HowtoSummaryComponent, HowtoCalendarComponent, HowtoExplorerComponent, HowtoCategoryComponent, HowtoDomaineComponent, HowtoItemComponent]
})
export class HowtoComponent implements OnInit {
  @Output() navigateToTab = new EventEmitter<string>();
  @Input() onClose?: () => void;
  
  showStatisticsGuide: boolean = false;
  showCompetanceGuide: boolean = false;
  showNotesGuide: boolean = false;
  showObjectifsGuide: boolean = false;
  showStrategieGuide: boolean = false;
  showChangeProfGuide: boolean = false;
  showUploadFileGuide: boolean = false;
  showSummaryGuide: boolean = false;
  showCalendarGuide: boolean = false;
  showExplorerGuide: boolean = false;
  showCategoryGuide: boolean = false;
  showDomaineGuide: boolean = false;
  showItemGuide: boolean = false;

  constructor(
    private translate: TranslateService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize translation
    const savedLang = localStorage.getItem('lang') || localStorage.getItem('selectedLanguage') || 'fr';
    this.translate.setDefaultLang('fr');
    this.translate.use(savedLang);
    
    // Subscribe to language changes
    this.sharedService.languageChange$.subscribe(lang => {
      this.translate.use(lang);
      // Force change detection when language changes
      this.cdr.markForCheck();
    });
  }

  ngOnInit() {
    // Ensure translations are loaded
    const savedLang = localStorage.getItem('lang') || localStorage.getItem('selectedLanguage') || 'fr';
    this.translate.use(savedLang);
  }

  handleTabClick(tabId: string): void {
    if (tabId === 'stats') {
      // Show statistics guide
      this.showStatisticsGuide = true;
    } else if (tabId === 'competance') {
      // Show competance guide
      this.showCompetanceGuide = true;
    } else if (tabId === 'notes') {
      // Show notes guide
      this.showNotesGuide = true;
    } else if (tabId === 'goals') {
      // Show objectifs guide
      this.showObjectifsGuide = true;
    } else if (tabId === 'strategies') {
      // Show strategie guide
      this.showStrategieGuide = true;
    } else if (tabId === 'change_profile') {
      // Show change profile guide
      this.showChangeProfGuide = true;
    } else if (tabId === 'upload_file') {
      // Show upload file guide
      this.showUploadFileGuide = true;
    } else if (tabId === 'summary') {
      // Show summary guide
      this.showSummaryGuide = true;
    } else if (tabId === 'calendar') {
      // Show calendar guide
      this.showCalendarGuide = true;
    } else if (tabId === 'explorer') {
      // Show explorer guide
      this.showExplorerGuide = true;
    } else if (tabId === 'category') {
      // Show category guide
      this.showCategoryGuide = true;
    } else if (tabId === 'domaine') {
      // Show domaine guide
      this.showDomaineGuide = true;
    } else if (tabId === 'item') {
      // Show item guide
      this.showItemGuide = true;
    } else {
      // Navigate to other tabs
      this.navigateToTab.emit(tabId);
      if (this.onClose) {
        this.onClose();
      }
    }
  }

  goBack(): void {
    this.showStatisticsGuide = false;
    this.showCompetanceGuide = false;
    this.showNotesGuide = false;
    this.showObjectifsGuide = false;
    this.showStrategieGuide = false;
    this.showChangeProfGuide = false;
    this.showUploadFileGuide = false;
    this.showSummaryGuide = false;
    this.showCalendarGuide = false;
    this.showExplorerGuide = false;
    this.showCategoryGuide = false;
    this.showDomaineGuide = false;
    this.showItemGuide = false;
  }

}
