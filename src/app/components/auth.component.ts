import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { BirthdayApiService } from '../services/birthdays.service';
import {
  passwordStrengthValidator,
  passwordMatchValidator,
} from '../validators/custom-validators';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCheckboxModule,
    NzCardModule,
    NzTabsModule,
    NzAlertModule,
    NzIconModule,
    NzGridModule,
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(BirthdayApiService);
  private router = inject(Router);

  // Signals
  loading = signal(false);
  error = signal<string | null>(null);
  passwordVisible = signal(false);

  loginForm!: FormGroup;
  registerForm!: FormGroup;

  ngOnInit() {
    this.initializeForms();

    // Check if user is already authenticated
    this.apiService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  private initializeForms() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false],
    });

    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        password: ['', [Validators.required, passwordStrengthValidator]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator }
    );
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.loading.set(true);
      this.error.set(null);

      const { email, password, rememberMe } = this.loginForm.value;

      this.apiService.login({ email, password }).subscribe({
        next: response => {
          console.log('Login successful:', response);
          this.loading.set(false);

          // Handle remember me functionality
          if (rememberMe) {
            localStorage.setItem('rememberUser', 'true');
          }

          this.router.navigate(['/dashboard']);
        },
        error: error => {
          console.error('Login error:', error);
          this.error.set(error.error || 'Login failed. Please try again.');
          this.loading.set(false);
        },
      });
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.loading.set(true);
      this.error.set(null);

      const { email, password, firstName, lastName } = this.registerForm.value;
      const name = `${firstName} ${lastName}`;

      this.apiService.register({ email, password, name }).subscribe({
        next: response => {
          console.log('Registration successful:', response);
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: error => {
          console.error('Registration error:', error);
          this.error.set(
            error.error || 'Registration failed. Please try again.'
          );
          this.loading.set(false);
        },
      });
    }
  }

  clearError() {
    this.error.set(null);
  }

  togglePasswordVisibility() {
    this.passwordVisible.set(!this.passwordVisible());
  }
}
