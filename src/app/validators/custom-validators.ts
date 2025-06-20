import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordStrengthValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null;
  }

  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumeric = /[0-9]/.test(value);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
  const isValidLength = value.length >= 6;

  const passwordValid =
    hasUpperCase &&
    hasLowerCase &&
    hasNumeric &&
    hasSpecialChar &&
    isValidLength;

  if (!passwordValid) {
    return {
      passwordStrength: {
        hasUpperCase,
        hasLowerCase,
        hasNumeric,
        hasSpecialChar,
        isValidLength,
      },
    };
  }
  return null;
}

export function passwordMatchValidator(
  formGroup: AbstractControl
): ValidationErrors | null {
  const password = formGroup.get('password');
  const confirmPassword = formGroup.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  if (password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

export function phoneValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null;
  }

  const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
  const isValid = phonePattern.test(value.replace(/[\s\-\(\)]/g, ''));

  return isValid ? null : { invalidPhone: true };
}

export function birthdateValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null;
  }

  const selectedDate = new Date(value);
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 120);

  if (selectedDate > today) {
    return { futureDate: true };
  }

  if (selectedDate < minDate) {
    return { tooOld: true };
  }

  return null;
}
