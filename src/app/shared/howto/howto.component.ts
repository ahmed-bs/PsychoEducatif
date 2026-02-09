import { Component, OnInit, Output, EventEmitter, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HowtoStaticComponent } from './howtoStatic/howtoStatic.component';
import { HowtoCompetanceComponent } from './howtoCompetance/howtoCompetance.component';
import { HowtoNotesComponent } from './howtoNotes/howtoNotes.component';
import { HowtoObjectifsComponent } from './howtoObjectifs/howtoObjectifs.component';
import { SharedService } from 'src/app/core/services/shared.service';

@Component({
  selector: 'app-howto',
  templateUrl: './howto.component.html',
  styleUrls: ['./howto.component.css'],
  standalone: true,
  imports: [CommonModule, TranslateModule, HowtoStaticComponent, HowtoCompetanceComponent, HowtoNotesComponent, HowtoObjectifsComponent]
})
export class HowtoComponent implements OnInit {
  @Output() navigateToTab = new EventEmitter<string>();
  @Input() onClose?: () => void;
  
  showStatisticsGuide: boolean = false;
  showCompetanceGuide: boolean = false;
  showNotesGuide: boolean = false;
  showObjectifsGuide: boolean = false;

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
  }

}
