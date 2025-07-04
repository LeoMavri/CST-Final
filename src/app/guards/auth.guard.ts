import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BirthdayApiService } from '../services/birthdays.service';

export const authGuard: CanActivateFn = (_route, _state) => {
  const apiService = inject(BirthdayApiService);
  const router = inject(Router);

  if (apiService.isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/auth']);
    return false;
  }
};

export const noAuthGuard: CanActivateFn = (_route, _state) => {
  const apiService = inject(BirthdayApiService);
  const router = inject(Router);

  if (!apiService.isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/dashboard']);
    return false;
  }
};
