import { Component, OnInit ,HostListener } from '@angular/core';

@Component({
  selector: 'app-Accueil',
  templateUrl: './Accueil.component.html',
  styleUrls: ['./Accueil.component.css']
})
export class AccueilComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  // Variable to track the visibility of sections
  isVisible = true;

 
}
