import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface AuthConfigResponse {
  data: {
    oauth_enabled: boolean;
    demo?: {
      enabled: boolean;
      notice: string;
      reference_date: string;
      password_change_allowed: boolean;
      login?: {
        shared_password: string;
        users: Array<{
          email: string;
          display_name: string;
          role: string;
          login_hint: string;
        }>;
      } | null;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private oauthEnabled = signal(true);
  private demoEnabled = signal(false);
  private demoNotice = signal('');
  private demoReferenceDate = signal<string | null>(null);
  private demoPasswordChangeAllowed = signal(true);
  private demoSharedPassword = signal<string | null>(null);
  private demoLoginUsers = signal<Array<{
    email: string;
    display_name: string;
    role: string;
    login_hint: string;
  }>>([]);

  isOAuthEnabled = this.oauthEnabled.asReadonly();
  isDemoEnabled = this.demoEnabled.asReadonly();
  demoNoticeText = this.demoNotice.asReadonly();
  demoReferenceDateValue = this.demoReferenceDate.asReadonly();
  isPasswordChangeAllowed = this.demoPasswordChangeAllowed.asReadonly();
  demoSharedPasswordValue = this.demoSharedPassword.asReadonly();
  demoLoginUsersValue = this.demoLoginUsers.asReadonly();

  constructor(private http: HttpClient) {}

  loadConfig(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<AuthConfigResponse>('/api/auth/config').subscribe({
        next: (response) => {
          this.oauthEnabled.set(response.data.oauth_enabled);
          this.demoEnabled.set(response.data.demo?.enabled ?? false);
          this.demoNotice.set(response.data.demo?.notice ?? '');
          this.demoReferenceDate.set(response.data.demo?.reference_date ?? null);
          this.demoPasswordChangeAllowed.set(response.data.demo?.password_change_allowed ?? true);
          this.demoSharedPassword.set(response.data.demo?.login?.shared_password ?? null);
          this.demoLoginUsers.set(response.data.demo?.login?.users ?? []);
          resolve();
        },
        error: () => {
          this.oauthEnabled.set(true);
          this.demoEnabled.set(false);
          this.demoNotice.set('');
          this.demoReferenceDate.set(null);
          this.demoPasswordChangeAllowed.set(true);
          this.demoSharedPassword.set(null);
          this.demoLoginUsers.set([]);
          resolve();
        },
      });
    });
  }
}
