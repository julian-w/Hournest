import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

interface LoginResponse {
  data: User;
  message: string;
  must_change_password?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private loaded = signal(false);
  private mustChangePassword = signal(false);

  user = this.currentUser.asReadonly();
  isLoggedIn = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'superadmin';
  });
  isLoaded = this.loaded.asReadonly();
  needsPasswordChange = this.mustChangePassword.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

  loadUser(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<{ data: User }>('/api/user').subscribe({
        next: (response) => {
          this.currentUser.set(response.data);
          this.mustChangePassword.set(response.data.must_change_password ?? false);
          this.loaded.set(true);
          resolve();
        },
        error: () => {
          this.currentUser.set(null);
          this.loaded.set(true);
          resolve();
        },
      });
    });
  }

  login(): void {
    window.location.href = '/api/auth/redirect';
  }

  loginWithCredentials(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.http.post<LoginResponse>('/api/auth/login', { username, password }).subscribe({
        next: (response) => {
          this.currentUser.set(response.data);
          this.loaded.set(true);
          if (response.must_change_password) {
            this.mustChangePassword.set(true);
          } else {
            this.router.navigate(['/dashboard']);
          }
          resolve(true);
        },
        error: () => {
          resolve(false);
        },
      });
    });
  }

  changePassword(currentPassword: string, newPassword: string, newPasswordConfirmation: string): Observable<{ data: User; message: string }> {
    return this.http.post<{ data: User; message: string }>('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    });
  }

  clearPasswordChangeRequired(): void {
    this.mustChangePassword.set(false);
  }

  logout(): void {
    this.http.post('/api/auth/logout', {}).subscribe({
      next: () => {
        this.currentUser.set(null);
        this.mustChangePassword.set(false);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.currentUser.set(null);
        this.mustChangePassword.set(false);
        this.router.navigate(['/login']);
      },
    });
  }
}
