import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private loaded = signal(false);

  user = this.currentUser.asReadonly();
  isLoggedIn = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'superadmin';
  });
  isLoaded = this.loaded.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

  loadUser(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<{ data: User }>('/api/user').subscribe({
        next: (response) => {
          this.currentUser.set(response.data);
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
      this.http.post<{ data: User }>('/api/auth/login', { username, password }).subscribe({
        next: (response) => {
          this.currentUser.set(response.data);
          this.loaded.set(true);
          this.router.navigate(['/dashboard']);
          resolve(true);
        },
        error: () => {
          resolve(false);
        },
      });
    });
  }

  logout(): void {
    this.http.post('/api/auth/logout', {}).subscribe({
      next: () => {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      },
    });
  }
}
