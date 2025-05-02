import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/authService.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SigninComponent implements OnInit {
  hide = true;
  isLoading = false;
  showErrors = false;
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit() {}

  login() {
    this.showErrors = true;
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isLoading = false;
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Connexion réussie ! Vous serez redirigé.',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/pick_profileComponent']);
        });
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.error?.message || 'Erreur connexion';
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
          confirmButtonColor: '#f44336'
        });
        console.error('Login error:', error);
      }
    });
  }

  togglePasswordVisibility() {
    this.hide = !this.hide;
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}