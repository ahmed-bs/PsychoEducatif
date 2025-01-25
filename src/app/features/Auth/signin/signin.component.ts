import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css'],
  encapsulation: ViewEncapsulation.None 
})
export class SigninComponent implements OnInit {
  hide = true; // Contrôle de la visibilité du mot de passe
  rememberMe = false; // Valeur du checkbox "Se souvenir de moi"

  constructor() {}

  ngOnInit() {}

  togglePasswordVisibility() {
    this.hide = !this.hide;
  }

}
