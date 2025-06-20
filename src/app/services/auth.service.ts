import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, tap } from 'rxjs';
import { ReqresService } from './reqres.service';
import { LoginRequest, RegisterRequest, User } from './reqres.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  rememberMe: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly reqresService = inject(ReqresService);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'auth-token';
  private readonly USER_KEY = 'auth-user';
  private readonly REMEMBER_ME_KEY = 'auth-remember-me';

  private readonly _authState = signal<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    rememberMe: false,
  });

  readonly user = computed(() => this._authState().user);
  readonly token = computed(() => this._authState().token);
  readonly isAuthenticated = computed(() => this._authState().isAuthenticated);
  readonly isLoading = computed(() => this._authState().isLoading);
  readonly error = computed(() => this._authState().error);
  readonly rememberMe = computed(() => this._authState().rememberMe);

  constructor() {
    this.initializeAuthState();

    effect(() => {
      const state = this._authState();
      if (state.token && state.user) {
        this.saveToStorage(state.token, state.user, state.rememberMe);
      }
    });
  }

  private initializeAuthState(): void {
    const token = this.getFromStorage(this.TOKEN_KEY);
    const userJson = this.getFromStorage(this.USER_KEY);
    const rememberMe = this.getFromStorage(this.REMEMBER_ME_KEY) === 'true';

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this.updateAuthState({
          user,
          token,
          isAuthenticated: true,
          rememberMe,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        this.clearStorage();
      }
    }
  }

  login(
    credentials: LoginRequest & { rememberMe?: boolean }
  ): Observable<User> {
    this.updateAuthState({ isLoading: true, error: null });

    return this.reqresService.login(credentials).pipe(
      tap(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Login failed');
        }

        const mockUser: User = {
          id: 1,
          email: credentials.email,
          first_name: 'Mavri',
          last_name: 'Leo',
          avatar: 'https://i.imgur.com/rIq6tUL.png',
        };

        this.updateAuthState({
          user: mockUser,
          token: response.data.token,
          isAuthenticated: true,
          rememberMe: credentials.rememberMe || false,
          isLoading: false,
          error: null,
        });
      }),

      map(response => this.user()!),

      catchError(error => {
        this.updateAuthState({
          isLoading: false,
          error: error.message || 'Login failed',
        });
        throw error;
      })
    );
  }

  /**
   * Register new user
   */
  register(
    userData: RegisterRequest & { first_name?: string; last_name?: string }
  ): Observable<User> {
    this.updateAuthState({ isLoading: true, error: null });

    return this.reqresService.register(userData).pipe(
      tap(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Registration failed');
        }

        // Mock user data since reqres.in doesn't return full user data on register
        const mockUser: User = {
          id: response.data.id,
          email: userData.email,
          first_name: userData.first_name || 'User',
          last_name: userData.last_name || '',
          avatar: 'https://reqres.in/img/faces/1-image.jpg',
        };

        this.updateAuthState({
          user: mockUser,
          token: response.data.token,
          isAuthenticated: true,
          rememberMe: false,
          isLoading: false,
          error: null,
        });
      }),
      map(response => this.user()!),
      catchError(error => {
        this.updateAuthState({
          isLoading: false,
          error: error.message || 'Registration failed',
        });
        throw error;
      })
    );
  }

  /**
   * Logout user and clear state
   */
  logout(): void {
    this.updateAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      rememberMe: false,
    });
    this.clearStorage();
    this.router.navigate(['/login']);
  }

  /**
   * Clear any error state
   */
  clearError(): void {
    this.updateAuthState({ error: null });
  }

  /**
   * Check if token is valid (simple check - in real app, verify with backend)
   */
  isTokenValid(): boolean {
    const token = this.token();
    return !!token && token.length > 0;
  }

  /**
   * Update auth state
   */
  private updateAuthState(partialState: Partial<AuthState>): void {
    this._authState.update(state => ({ ...state, ...partialState }));
  }

  /**
   * Save auth data to storage
   */
  private saveToStorage(token: string, user: User, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;

    // Clear other storage first
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem(this.TOKEN_KEY);
    otherStorage.removeItem(this.USER_KEY);
    otherStorage.removeItem(this.REMEMBER_ME_KEY);

    // Save to selected storage
    storage.setItem(this.TOKEN_KEY, token);
    storage.setItem(this.USER_KEY, JSON.stringify(user));
    storage.setItem(this.REMEMBER_ME_KEY, rememberMe.toString());
  }

  /**
   * Get data from storage (checks both localStorage and sessionStorage)
   */
  private getFromStorage(key: string): string | null {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  }

  /**
   * Clear all auth data from storage
   */
  private clearStorage(): void {
    [localStorage, sessionStorage].forEach(storage => {
      storage.removeItem(this.TOKEN_KEY);
      storage.removeItem(this.USER_KEY);
      storage.removeItem(this.REMEMBER_ME_KEY);
    });
  }
}
