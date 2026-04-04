import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

interface TimeBookingTemplateDialogData {
  titleKey: string;
  confirmKey: string;
  initialName?: string;
}

@Component({
  selector: 'app-time-booking-template-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.titleKey | translate }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'time_tracking.template_name' | translate }}</mat-label>
        <input matInput [(ngModel)]="name" maxlength="255">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="!name.trim()">
        {{ data.confirmKey | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      min-width: 280px;
      padding-top: 8px;
    }
  `],
})
export class TimeBookingTemplateDialogComponent {
  private dialogRef = inject(MatDialogRef<TimeBookingTemplateDialogComponent, string>);
  data = inject<TimeBookingTemplateDialogData>(MAT_DIALOG_DATA);

  name = this.data.initialName ?? '';

  submit(): void {
    const trimmed = this.name.trim();
    if (!trimmed) {
      return;
    }

    this.dialogRef.close(trimmed);
  }
}
