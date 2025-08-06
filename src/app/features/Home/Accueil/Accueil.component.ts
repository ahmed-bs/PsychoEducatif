import { Component, OnInit ,HostListener } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-Accueil',
  templateUrl: './Accueil.component.html',
  styleUrls: ['./Accueil.component.css']
})
export class AccueilComponent implements OnInit {

  constructor(private translate: TranslateService) { }

  ngOnInit() {
    // Initialize translation
    this.translate.setDefaultLang('ar');
    this.translate.use('ar');
  }

  // Variable to track the visibility of sections
  isVisible = true;

 
}
