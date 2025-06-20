import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then(c => c.LoginComponent),
    canActivate: [guestGuard],
    title: 'Sign In - Music Playlist Manager',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register.component').then(
        c => c.RegisterComponent
      ),
    canActivate: [guestGuard],
    title: 'Create Account - Music Playlist Manager',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
    canActivate: [authGuard],
    title: 'Dashboard - Music Playlist Manager',
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
