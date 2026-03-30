import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'password.change_title' | translate }}</h2>
    <mat-dialog-content>
      @if (data.forced) {
        <p class="hint">{{ 'password.must_change' | translate }}</p>
      }
      <form [formGroup]="form" class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'password.current' | translate }}</mat-label>
          <input matInput type="password" formControlName="current_password">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'password.new' | translate }}</mat-label>
          <input matInput type="password" formControlName="new_password">
          @if (form.get('new_password')?.hasError('minlength')) {
            <mat-error>{{ 'password.min_length' | translate }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'password.confirm' | translate }}</mat-label>
          <input matInput type="password" formControlName="new_password_confirmation">
          @if (passwordMismatch()) {
            <mat-error>{{ 'password.mismatch' | translate }}</mat-error>
          }
        </mat-form-field>
      </form>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (!data.forced) {
        <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      }
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || submitting() || passwordMismatch()">
        {{ 'password.change_button' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 300px;
    }
    .hint {
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 16px;
    }
    .error {
      color: #c62828;
      font-size: 13px;
      margin: 4px 0 0;
    }
  `],
})
export class ChangePasswordDialogComponent {
  private auth = inject(AuthService);
  private dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);
  private translate = inject(TranslateService);
  data: { forced: boolean } = inject(MAT_DIALOG_DATA);

  form = new FormGroup({
    current_password: new FormControl('', [Validators.required]),
    new_password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    new_password_confirmation: new FormControl('', [Validators.required]),
  });

  submitting = signal(false);
  error = signal('');

  passwordMismatch(): boolean {
    const pw = this.form.get('new_password')?.value;
    const confirm = this.form.get('new_password_confirmation')?.value;
    return !!confirm && pw !== confirm;
  }

  submit(): void {
    if (this.form.invalid || this.passwordMismatch()) return;

    this.submitting.set(true);
    this.error.set('');

    const { current_password, new_password, new_password_confirmation } = this.form.value;
    this.auth.changePassword(current_password!, new_password!, new_password_confirmation!).subscribe({
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
