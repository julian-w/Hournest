import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private oauthEnabled = signal(true);

  isOAuthEnabled = this.oauthEnabled.asReadonly();

  constructor(private http: HttpClient) {}

  loadConfig(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<{ data: { oauth_enabled: boolean } }>('/api/auth/config').subscribe({
        next: (response) => {
          this.oauthEnabled.set(response.data.oauth_enabled);
          resolve();
        },
        error: () => {
          this.oauthEnabled.set(true);
          resolve();
        },
      });
    });
  }
}
