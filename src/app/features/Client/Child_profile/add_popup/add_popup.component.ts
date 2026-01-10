import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/authService.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-add_popup',
  templateUrl: './add_popup.component.html',
  styleUrls: ['./add_popup.component.css']
})
export class Add_popupComponent implements OnInit {
  hide = true;
  isLoading = false;
  showErrors = false;
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    public dialogRef: MatDialogRef<Add_popupComponent>
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
        localStorage.setItem('token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Connexion réussie ! Vous serez redirigé.',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.dialogRef.close();
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

  closeDialog() {
    this.dialogRef.close();
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}