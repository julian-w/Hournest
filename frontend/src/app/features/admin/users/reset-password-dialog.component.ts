import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-reset-password-dialog',
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
    <h2 mat-dialog-title>{{ 'admin_users.reset_password' | translate }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_users.default_password' | translate }}</mat-label>
          <input matInput formControlName="password" type="password">
          <mat-hint>{{ 'admin_users.password_hint' | translate }}</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid">
        {{ 'admin_users.reset_password' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-fields {
      display: flex;
      flex-direction: column;
      min-width: 300px;
    }
  `],
})
export class ResetPasswordDialogComponent {
  private dialogRef = inject(MatDialogRef<ResetPasswordDialogComponent>);

  form = new FormGroup({
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value.password);
  }
}
