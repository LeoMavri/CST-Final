import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import type {
  User,
  UnknownResource,
  ListResponse,
  SingleResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  AuthError,
  ListParams,
  ApiError,
  ApiResponse,
} from './reqres.types';

@Injectable({
  providedIn: 'root',
})
export class ReqresService {
  private readonly baseUrl = 'https://reqres.in/api';

  constructor(private http: HttpClient) {}

  /**
   * GET /users - Fetches a user list
   */
  getUsers(params: ListParams = {}): Observable<ListResponse<User>> {
    const httpParams = this.buildParams(params);
    const headers = this.getDefaultHeaders();
    return this.http
      .get<ListResponse<User>>(`${this.baseUrl}/users`, {
        params: httpParams,
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * GET /users/{id} - Fetches a user
   */
  getUser(id: number): Observable<SingleResponse<User>> {
    const headers = this.getDefaultHeaders();
    return this.http
      .get<SingleResponse<User>>(`${this.baseUrl}/users/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * POST /users - Creates a user
   */
  createUser(userData: CreateUserRequest): Observable<CreateUserResponse> {
    const headers = this.getDefaultHeaders();
    return this.http
      .post<CreateUserResponse>(`${this.baseUrl}/users`, userData, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * PUT /users/{id} - Updates a user
   */
  updateUser(
    id: number,
    userData: UpdateUserRequest
  ): Observable<UpdateUserResponse> {
    const headers = this.getDefaultHeaders();
    return this.http
      .put<UpdateUserResponse>(`${this.baseUrl}/users/${id}`, userData, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * PATCH /users/{id} - Updates a user
   */
  patchUser(
    id: number,
    userData: Partial<UpdateUserRequest>
  ): Observable<UpdateUserResponse> {
    const headers = this.getDefaultHeaders();
    return this.http
      .patch<UpdateUserResponse>(`${this.baseUrl}/users/${id}`, userData, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * DELETE /users/{id} - Deletes a user
   */
  deleteUser(id: number): Observable<void> {
    const headers = this.getDefaultHeaders();
    return this.http
      .delete<void>(`${this.baseUrl}/users/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * GET /{resource} - Fetches a resource list
   */
  getResourceList<T = UnknownResource>(
    resource: string,
    params: ListParams = {}
  ): Observable<ListResponse<T>> {
    const httpParams = this.buildParams(params);
    const headers = this.getDefaultHeaders();
    return this.http
      .get<ListResponse<T>>(`${this.baseUrl}/${resource}`, {
        params: httpParams,
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * GET /{resource}/{id} - Fetches an unknown resource
   */
  getResource<T = UnknownResource>(
    resource: string,
    id: number
  ): Observable<SingleResponse<T>> {
    const headers = this.getDefaultHeaders();
    return this.http
      .get<SingleResponse<T>>(`${this.baseUrl}/${resource}/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * PUT /{resource}/{id} - Updates an unknown resource
   */
  updateResource<T = any>(
    resource: string,
    id: number,
    data: any
  ): Observable<T> {
    const headers = this.getDefaultHeaders();
    return this.http
      .put<T>(`${this.baseUrl}/${resource}/${id}`, data, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * PATCH /{resource}/{id} - Updates an unknown resource
   */
  patchResource<T = any>(
    resource: string,
    id: number,
    data: any
  ): Observable<T> {
    const headers = this.getDefaultHeaders();
    return this.http
      .patch<T>(`${this.baseUrl}/${resource}/${id}`, data, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * DELETE /{resource}/{id} - Deletes an unknown resource
   */
  deleteResource(resource: string, id: number): Observable<void> {
    const headers = this.getDefaultHeaders();
    return this.http
      .delete<void>(`${this.baseUrl}/${resource}/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * POST /login - Creates a session
   */
  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    const headers = this.getDefaultHeaders();
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, credentials, { headers })
      .pipe(
        map(response => ({ success: true, data: response })),
        catchError((error: HttpErrorResponse) => {
          const authError = error.error as AuthError;
          return throwError(() => ({
            success: false,
            error: {
              message: authError.error || 'Login failed',
              status: error.status,
              error: authError,
            },
          }));
        })
      );
  }

  /**
   * POST /register - Creates a user
   */
  register(
    userData: RegisterRequest
  ): Observable<ApiResponse<RegisterResponse>> {
    const headers = this.getDefaultHeaders();
    return this.http
      .post<RegisterResponse>(`${this.baseUrl}/register`, userData, { headers })
      .pipe(
        map(response => ({ success: true, data: response })),
        catchError((error: HttpErrorResponse) => {
          const authError = error.error as AuthError;
          return throwError(() => ({
            success: false,
            error: {
              message: authError.error || 'Registration failed',
              status: error.status,
              error: authError,
            },
          }));
        })
      );
  }

  /**
   * POST /logout - Ends a session
   */
  logout(): Observable<void> {
    const headers = this.getDefaultHeaders();
    return this.http
      .post<void>(`${this.baseUrl}/logout`, {}, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get "unknown" resources (default resource type)
   */
  getUnknownResources(
    params: ListParams = {}
  ): Observable<ListResponse<UnknownResource>> {
    return this.getResourceList<UnknownResource>('unknown', params);
  }

  /**
   * Get single "unknown" resource
   */
  getUnknownResource(id: number): Observable<SingleResponse<UnknownResource>> {
    return this.getResource<UnknownResource>('unknown', id);
  }

  /**
   * Get users with delay for testing loading states
   */
  getUsersWithDelay(delay: number = 3): Observable<ListResponse<User>> {
    return this.getUsers({ delay });
  }

  /**
   * Check if user exists
   */
  userExists(id: number): Observable<boolean> {
    return this.getUser(id).pipe(
      map(() => true),
      catchError(error => {
        if (error.status === 404) {
          return [false];
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all users across all pages
   */
  getAllUsers(): Observable<User[]> {
    return new Observable(observer => {
      this.getUsers({ page: 1 }).subscribe({
        next: firstResponse => {
          const allUsers: User[] = [...firstResponse.data];
          const totalPages = firstResponse.total_pages;

          if (totalPages === 1) {
            observer.next(allUsers);
            observer.complete();
            return;
          }

          let completedRequests = 1;

          for (let page = 2; page <= totalPages; page++) {
            this.getUsers({ page }).subscribe({
              next: response => {
                allUsers.push(...response.data);
                completedRequests++;

                if (completedRequests === totalPages) {
                  observer.next(allUsers);
                  observer.complete();
                }
              },
              error: error => observer.error(error),
            });
          }
        },
        error: error => observer.error(error),
      });
    });
  }

  private buildParams(params: ListParams): HttpParams {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.per_page !== undefined) {
      httpParams = httpParams.set('per_page', params.per_page.toString());
    }
    if (params.delay !== undefined) {
      httpParams = httpParams.set('delay', params.delay.toString());
    }

    return httpParams;
  }

  private getDefaultHeaders(): HttpHeaders {
    return new HttpHeaders({
      'x-api-key': 'reqres-free-v1',
    });
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    const apiError: ApiError = {
      message:
        error.error?.error || error.message || 'An unknown error occurred',
      status: error.status || 0,
      error: error.error,
    };

    console.error('ReqresService API Error:', apiError);
    return throwError(() => apiError);
  };
}
