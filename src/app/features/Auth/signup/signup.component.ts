import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/authService.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading: boolean = false;
  errorMessage: string = '';
  userTypes = [
    { value: 'professional', label: 'Professional' },
    { value: 'parent', label: 'Parent' },
    { value: 'other', label: 'Other' },
  ];

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      user_type: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordValidator
      ]],
      confirm_password: ['', Validators.required],
      accepte_conditions: [false, Validators.requiredTrue],
      bio: ['']
    }, { validator: this.passwordMatchValidator });
  }

  // Custom password validator
  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    
    const passwordValid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
    
    return !passwordValid ? { passwordStrength: true } : null;
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm_password = group.get('confirm_password')?.value;
    
    return password === confirm_password ? null : { passwordMismatch: true };
  }

  ngOnInit() {}

  get username() { return this.signupForm.get('username'); }
  get user_type() { return this.signupForm.get('user_type'); }
  get email() { return this.signupForm.get('email'); }
  get password() { return this.signupForm.get('password'); }
  get confirm_password() { return this.signupForm.get('confirm_password'); }
  get accepte_conditions() { return this.signupForm.get('accepte_conditions'); }
  get bio() { return this.signupForm.get('bio'); }

  onSubmit() {
    if (this.signupForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
  
      // Transform form data to match Parent class structure
      const formData = {
        username: this.signupForm.value.username,
        email: this.signupForm.value.email,
        password: this.signupForm.value.password,
        confirm_password: this.signupForm.value.confirm_password,
        user_type: this.signupForm.value.user_type,
        accepte_conditions: this.signupForm.value.accepte_conditions,
        bio: this.signupForm.value.bio || null
      };
  
      this.authService.register(formData).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Registration error:', error);
          this.isLoading = false;
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.';
          }
        }
      });
    } else {
      this.signupForm.markAllAsTouched();
      this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire.';
    }
  }
}