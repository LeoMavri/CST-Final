import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { AuthService } from '../../services/auth.service';

export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const hasMinLength = value.length >= 6;
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    const isValid =
      hasMinLength &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSpecialChar;

    if (isValid) {
      return null;
    }

    return {
      passwordComplexity: {
        hasMinLength,
        hasUppercase,
        hasLowercase,
        hasNumber,
        hasSpecialChar,
      },
    };
  };
}

export function confirmPasswordValidator(
  passwordControlName: string
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const formGroup = control.parent;
    if (!formGroup) {
      return null;
    }

    const passwordControl = formGroup.get(passwordControlName);
    if (!passwordControl) {
      return null;
    }

    if (control.value !== passwordControl.value) {
      return { confirmPassword: true };
    }

    return null;
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzAlertModule,
    NzSpinModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly passwordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);
  readonly submitAttempted = signal(false);

  readonly isLoading = this.authService.isLoading;
  readonly error = this.authService.error;

  readonly registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, passwordValidator()]],
    confirmPassword: [
      '',
      [Validators.required, confirmPasswordValidator('password')],
    ],
  });

  constructor() {
    this.authService.clearError();

    this.registerForm.get('password')?.valueChanges.subscribe(() => {
      const confirmPasswordControl = this.registerForm.get('confirmPassword');
      if (confirmPasswordControl?.value) {
        confirmPasswordControl.updateValueAndValidity();
      }
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update(visible => !visible);
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update(visible => !visible);
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);

    if (!control || !control.errors || !this.submitAttempted()) {
      return '';
    }

    const errors = control.errors;

    if (errors['required']) {
      return `${this.getFieldDisplayName(controlName)} is required`;
    }

    if (errors['email']) {
      return 'Please enter a valid email address';
    }

    if (errors['minlength']) {
      const minLength = errors['minlength'].requiredLength;
      return `${this.getFieldDisplayName(controlName)} must be at least ${minLength} characters`;
    }

    if (errors['passwordComplexity']) {
      const complexity = errors['passwordComplexity'];
      const missing = [];

      if (!complexity.hasMinLength) missing.push('6 characters');
      if (!complexity.hasUppercase) missing.push('uppercase letter');
      if (!complexity.hasLowercase) missing.push('lowercase letter');
      if (!complexity.hasNumber) missing.push('number');
      if (!complexity.hasSpecialChar) missing.push('special character');

      return `Password must contain: ${missing.join(', ')}`;
    }

    if (errors['confirmPassword']) {
      return 'Passwords do not match';
    }

    return 'Invalid input';
  }

  hasError(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || this.submitAttempted())
    );
  }

  onSubmit(): void {
    this.submitAttempted.set(true);

    if (this.registerForm.valid) {
      const formValue = this.registerForm.value;

      this.authService
        .register({
          email: formValue.email,
          password: formValue.password,
          first_name: formValue.firstName,
          last_name: formValue.lastName,
        })
        .subscribe({
          next: () => {
            this.router.navigate(['/dashboard']);
          },
          error: error => {
            console.error('Registration error:', error);
          },
        });
    } else {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private getFieldDisplayName(controlName: string): string {
    const displayNames: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
    };

    return displayNames[controlName] || controlName;
  }
}
