import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  sessionStorage.setItem('redirectUrl', state.url);

  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    sessionStorage.setItem('redirectUrl', state.url);
    return router.createUrlTree(['/login']);
  }

  const user = authService.user();
  const isAdmin = user?.email === 'admin@example.com'; // Mock admin check

  if (isAdmin) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
