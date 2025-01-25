import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  hidePassword = true;
  hideConfirmPassword = true;
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';

  constructor() {}

  ngOnInit() {}

  validatePasswords(): boolean {
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return false;
    }
    this.errorMessage = '';
    return true;
  }

  onSubmit(form: any): void {
    if (this.validatePasswords() && form.valid) {
      console.log('Formulaire soumis avec succès :', form.value);
    } else {
      console.error('Erreur dans le formulaire.');
    }
  }
}
