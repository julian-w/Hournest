import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatExpansionModule,
    TranslateModule,
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon class="logo-icon">hive</mat-icon>
            {{ 'login.title' | translate }}
          </mat-card-title>
          <mat-card-subtitle>{{ 'login.subtitle' | translate }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>{{ 'login.description' | translate }}</p>

          <button mat-raised-button color="primary" class="sso-button" (click)="auth.login()">
            <mat-icon>login</mat-icon>
            {{ 'login.sso_button' | translate }}
          </button>

          <mat-divider class="divider"></mat-divider>

          <mat-expansion-panel class="admin-panel" [expanded]="false">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>admin_panel_settings</mat-icon>
                {{ 'login.admin_login' | translate }}
              </mat-panel-title>
            </mat-expansion-panel-header>

            <form (ngSubmit)="submitCredentials()" class="admin-form">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'login.username' | translate }}</mat-label>
                <input matInput [(ngModel)]="username" name="username" required>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>{{ 'login.password' | translate }}</mat-label>
                <input matInput type="password" [(ngModel)]="password" name="password" required>
              </mat-form-field>

              @if (error()) {
                <p class="error">{{ error() }}</p>
              }

              <button mat-raised-button color="accent" type="submit" [disabled]="submitting()">
                {{ 'login.login_button' | translate }}
              </button>
            </form>
          </mat-expansion-panel>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #fff8e1 0%, #ffe0b2 100%);
    }
    .login-card {
      max-width: 440px;
      width: 90%;
      padding: 24px;
    }
    .logo-icon {
      font-size: 32px;
      height: 32px;
      width: 32px;
      vertical-align: middle;
      margin-right: 8px;
      color: #ff8f00;
    }
    mat-card-title {
      display: flex;
      align-items: center;
      font-size: 24px !important;
    }
    mat-card-content p {
      margin-top: 16px;
      color: rgba(0, 0, 0, 0.6);
    }
    .sso-button {
      width: 100%;
      margin-top: 16px;
      padding: 8px;
    }
    .divider {
      margin: 24px 0;
    }
    .admin-panel {
      box-shadow: none !important;
    }
    .admin-panel mat-panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .admin-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 8px;
    }
    .error {
      color: #c62828;
      font-size: 13px;
      margin: 0;
    }
  `],
})
export class LoginComponent {
  auth = inject(AuthService);

  username = '';
  password = '';
  submitting = signal(false);
  error = signal('');

  async submitCredentials(): Promise<void> {
    if (!this.username || !this.password) return;

    this.submitting.set(true);
    this.error.set('');

    const success = await this.auth.loginWithCredentials(this.username, this.password);
    if (!success) {
      this.error.set('login.error_invalid');
      this.submitting.set(false);
    }
  }
}
