import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  User,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UserResponse,
  Friend,
  CreateFriendRequest,
  UpdateFriendRequest,
  BirthdayReminder,
  ApiError,
} from './birthdays.interface';

@Injectable({
  providedIn: 'root',
})
export class BirthdayApiService {
  private readonly baseUrl = 'http://localhost:3000/api';
  private readonly tokenKey = 'birthday_app_token';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeAuth();
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/register`, userData)
      .pipe(
        tap(response => this.handleAuthSuccess(response, false)),
        catchError(this.handleError)
      );
  }

  login(credentials: LoginRequest, rememberMe: boolean = false): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(
        tap(response => this.handleAuthSuccess(response, rememberMe)),
        catchError(this.handleError)
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getCurrentUser(): Observable<UserResponse> {
    return this.http
      .get<UserResponse>(`${this.baseUrl}/auth/me`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap(response => this.currentUserSubject.next(response.user)),
        catchError(this.handleError)
      );
  }

  getFriends(): Observable<Friend[]> {
    return this.http
      .get<Friend[]>(`${this.baseUrl}/friends`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getFriend(id: string): Observable<Friend> {
    return this.http
      .get<Friend>(`${this.baseUrl}/friends/${id}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  createFriend(friendData: CreateFriendRequest): Observable<Friend> {
    return this.http
      .post<Friend>(`${this.baseUrl}/friends`, friendData, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  updateFriend(
    id: string,
    friendData: UpdateFriendRequest
  ): Observable<Friend> {
    return this.http
      .put<Friend>(`${this.baseUrl}/friends/${id}`, friendData, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  deleteFriend(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/friends/${id}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getBirthdays(): Observable<BirthdayReminder[]> {
    return this.http
      .get<BirthdayReminder[]>(`${this.baseUrl}/birthdays`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getNextBirthday(): Observable<BirthdayReminder> {
    return this.http
      .get<BirthdayReminder>(`${this.baseUrl}/birthdays/next`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getTodaysBirthdays(): Observable<BirthdayReminder[]> {
    return this.http
      .get<BirthdayReminder[]>(`${this.baseUrl}/birthdays/today`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  private initializeAuth(): void {
    const token = this.getToken();
    if (token) {
      this.isAuthenticatedSubject.next(true);
      this.getCurrentUser().subscribe({
        next: () => {},
        error: () => this.logout(),
      });
    }
  }

  private handleAuthSuccess(response: AuthResponse, rememberMe: boolean = false): void {
    if (rememberMe) {
      localStorage.setItem(this.tokenKey, response.token);
      sessionStorage.removeItem(this.tokenKey);
    } else {
      sessionStorage.setItem(this.tokenKey, response.token);
      localStorage.removeItem(this.tokenKey);
    }
    
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
  }

  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  private handleError = (error: any) => {
    console.error('API Error:', error);

    if (error.status === 401) {
      this.logout();
    }

    const apiError: ApiError = {
      error: error.error?.error || 'An unexpected error occurred',
      details: error.error?.details || [],
    };

    return throwError(() => apiError);
  };

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
}
