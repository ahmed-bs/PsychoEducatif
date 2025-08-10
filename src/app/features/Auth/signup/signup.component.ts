import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/authService.service';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';

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
  showErrors: boolean = false;
  userTypes = [
    { value: 'professional', label: 'signup_form.user_types.professional' },
    { value: 'parent', label: 'signup_form.user_types.parent' },
    { value: 'other', label: 'signup_form.user_types.other' },
  ];

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private authService: AuthService,
    private translate: TranslateService
  ) {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
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

    // Initialize translation languages
    this.translate.addLangs(['fr', 'ar']);
    this.translate.setDefaultLang('ar');
    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang?.match(/fr|ar/) ? browserLang : 'ar');

    // Translate user type labels
    this.userTypes = this.userTypes.map(type => ({
      value: type.value,
      label: this.translate.instant(type.label)
    }));
  }

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
  get email() { return this.signupForm.get('email'); }
  get password() { return this.signupForm.get('password'); }
  get confirm_password() { return this.signupForm.get('confirm_password'); }
  get accepte_conditions() { return this.signupForm.get('accepte_conditions'); }
  get bio() { return this.signupForm.get('bio'); }

  onSubmit() {
    this.showErrors = true;
    // Frontend validation error handling
    if (!this.signupForm.valid) {
      let errorKey = 'signup_form.error_message.validation_error';
      if (this.signupForm.errors?.['passwordMismatch']) {
        errorKey = 'signup_form.error_message.password_mismatch';
      } else if (this.password?.errors?.['minlength']) {
        errorKey = 'signup_form.error_message.password_too_short';
      } else if (this.password?.errors?.['passwordStrength']) {
        errorKey = 'signup_form.error_message.password_strength';
      } else if (this.email?.errors?.['email']) {
        errorKey = 'signup_form.error_message.email_invalid';
      } else if (this.username?.errors?.['minlength']) {
        errorKey = 'signup_form.error_message.username_too_short';
      } else if (this.accepte_conditions?.invalid) {
        errorKey = 'signup_form.error_message.terms_required';
      }

      this.translate.get(['signup_form.error_message.title', errorKey]).subscribe(translations => {
        Swal.fire({
          icon: 'error',
          title: translations['signup_form.error_message.title'],
          text: translations[errorKey],
          confirmButtonColor: '#f44336'
        });
      });
      return;
    }
    this.isLoading = true;
  
    const formData = {
      username: this.signupForm.value.username,
      email: this.signupForm.value.email,
      password: this.signupForm.value.password,
      confirm_password: this.signupForm.value.confirm_password,
      user_type: 'parent', // Default value since field is removed from UI
      accepte_conditions: this.signupForm.value.accepte_conditions,
      bio: this.signupForm.value.bio || null
    };
  
    this.authService.register(formData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.isLoading = false;
        this.translate.get(['signup_form.success_message.title', 'signup_form.success_message.text']).subscribe(translations => {
          Swal.fire({
            icon: 'success',
            title: translations['signup_form.success_message.title'],
            text: translations['signup_form.success_message.text'],
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.router.navigate(['/auth/signin']);
          });
        });
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.isLoading = false;

        let errorMessage = this.translate.instant('signup_form.error_message.default_text');
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

        this.translate.get('signup_form.error_message.title').subscribe(title => {
          Swal.fire({
            icon: 'error',
            title: title,
            text: errorMessage,
            confirmButtonColor: '#f44336'
          });
        });
      }
    });
  }
}