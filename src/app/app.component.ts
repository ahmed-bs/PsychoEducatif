import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],

})
export class AppComponent implements OnInit {
  title = 'PsychoEducatif';

  constructor(private translate: TranslateService) {
    // Set default language
    this.translate.setDefaultLang('ar');
    this.translate.use('ar');
  }

  ngOnInit() {
    // Initialize translation
    this.translate.setDefaultLang('ar');
    this.translate.use('ar');
  }
}
