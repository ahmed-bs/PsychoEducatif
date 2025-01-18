import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  hidePassword = true;
  hideConfirmPassword = true;
  password = '';
  confirmPassword = '';
  errorMessage = '';

  constructor() { }

  ngOnInit() {}

  validatePasswords(): boolean {
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return false;
    }
    this.errorMessage = '';
    return true;
  }

  onSubmit() {
    if (this.validatePasswords()) {
      // Effectuer les actions nécessaires lors de la soumission (exemple : envoyer au backend)
      console.log('Formulaire soumis avec succès.');
    }
  }
}
