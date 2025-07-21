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

  ngOnInit() {
    // Check if a remembered email exists
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.loginForm.patchValue({
        email: rememberedEmail,
        rememberMe: true
      });
    }
  }

  login() {
    this.showErrors = true;
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password, rememberMe } = this.loginForm.value;

    // Handle Remember Me
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

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
        let errorMessage = 'Erreur connexion';
        if (error.error) {
          if (typeof error.error === 'object' && !Array.isArray(error.error)) {
            errorMessage = Object.entries(error.error)
              .map(([field, messages]) => {
                if (Array.isArray(messages)) {
                  return messages.map(msg => `${field}: ${msg}`).join('\n');
                }
                return `${field}: ${messages}`;
              })
              .join('\n');
          } else if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          }
        }
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