import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../../core/services/admin.service';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'admin_users.create_user' | translate }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_users.name' | translate }}</mat-label>
          <input matInput formControlName="display_name">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_users.email' | translate }}</mat-label>
          <input matInput formControlName="email" type="email">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_users.role' | translate }}</mat-label>
          <mat-select formControlName="role">
            <mat-option value="employee">{{ 'admin_users.role_employee' | translate }}</mat-option>
            <mat-option value="admin">{{ 'admin_users.role_admin' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_users.vacation_days' | translate }}</mat-label>
          <input matInput formControlName="vacation_days_per_year" type="number">
        </mat-form-field>
        <div class="password-row">
          <mat-form-field appearance="outline" class="password-field">
            <mat-label>{{ 'admin_users.default_password' | translate }}</mat-label>
            <input matInput formControlName="password" type="text">
            @if (isOAuth) {
              <mat-hint>{{ 'admin_users.password_hint_oauth' | translate }}</mat-hint>
            } @else {
              <mat-hint>{{ 'admin_users.password_hint' | translate }}</mat-hint>
            }
          </mat-form-field>
          <button mat-icon-button type="button" (click)="generatePassword()"
                  [matTooltip]="'admin_users.generate_password' | translate"
                  class="generate-btn">
            <mat-icon>casino</mat-icon>
          </button>
        </div>
      </form>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || submitting()">
        {{ 'common.save' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 350px;
    }
    .password-row {
      display: flex;
      align-items: flex-start;
      gap: 4px;
    }
    .password-field {
      flex: 1;
    }
    .generate-btn {
      margin-top: 8px;
    }
    .error {
      color: #c62828;
      font-size: 13px;
      margin: 4px 0 0;
    }
  `],
})
export class CreateUserDialogComponent {
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<CreateUserDialogComponent>);
  private translate = inject(TranslateService);
  private configService = inject(ConfigService);

  isOAuth = this.configService.isOAuthEnabled();

  form = new FormGroup({
    display_name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    role: new FormControl('employee', [Validators.required]),
    vacation_days_per_year: new FormControl(30, [Validators.required, Validators.min(0), Validators.max(365)]),
    password: new FormControl('', this.isOAuth
      ? [Validators.minLength(8)]
      : [Validators.required, Validators.minLength(8)]),
  });

  submitting = signal(false);
  error = signal('');

  generatePassword(): void {
    const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.form.patchValue({ password });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    this.error.set('');

    const data: Record<string, unknown> = {
      display_name: this.form.value.display_name,
      email: this.form.value.email,
      role: this.form.value.role,
      vacation_days_per_year: this.form.value.vacation_days_per_year,
    };

    if (this.form.value.password) {
      data['password'] = this.form.value.password;
    }

    this.adminService.createUser(data as { display_name: string; email: string; role: string; password?: string; vacation_days_per_year?: number }).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.error.set(err.error?.message || this.translate.instant('login.error_generic'));
        this.submitting.set(false);
      },
    });
  }
}
