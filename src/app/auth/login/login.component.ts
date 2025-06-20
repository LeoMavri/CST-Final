import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCardModule,
    NzCheckboxModule,
    NzIconModule,
    NzAlertModule,
    NzSpinModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly passwordVisible = signal(false);
  readonly submitAttempted = signal(false);

  readonly isLoading = this.authService.isLoading;
  readonly error = this.authService.error;

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  constructor() {
    this.authService.clearError();
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update(visible => !visible);
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);

    if (!control || !control.errors || !this.submitAttempted()) {
      return '';
    }

    const errors = control.errors;

    if (errors['required']) {
      return `${this.capitalizeFirst(controlName)} is required`;
    }

    if (errors['email']) {
      return 'Please enter a valid email address';
    }

    if (errors['minlength']) {
      return `Password must be at least ${errors['minlength'].requiredLength} characters`;
    }

    return 'Invalid input';
  }

  hasError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || this.submitAttempted())
    );
  }

  onSubmit(): void {
    this.submitAttempted.set(true);

    if (this.loginForm.valid) {
      const formValue = this.loginForm.value;

      this.authService
        .login({
          email: formValue.email,
          password: formValue.password,
          rememberMe: formValue.rememberMe,
        })
        .subscribe({
          next: () => {
            const redirectUrl =
              sessionStorage.getItem('redirectUrl') || '/dashboard';
            sessionStorage.removeItem('redirectUrl');
            this.router.navigate([redirectUrl]);
          },
          error: error => {
            console.error('Login error:', error);
          },
        });
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
