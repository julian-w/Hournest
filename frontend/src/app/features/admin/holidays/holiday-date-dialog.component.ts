import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HolidayService } from '../../../core/services/holiday.service';

interface DialogData {
  holidayId: number;
  name: string;
  year: number;
  currentDate: string | null;
}

@Component({
  selector: 'app-holiday-date-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatNativeDateModule,
    MatSnackBarModule,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.name }} — {{ data.year }}</h2>
    <mat-dialog-content>
      <p class="hint">{{ 'admin_holidays.status_pending' | translate }}</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'admin_holidays.date' | translate }}</mat-label>
        <input matInput [matDatepicker]="datePicker" [formControl]="dateControl">
        <mat-datepicker-toggle matIconSuffix [for]="datePicker"></mat-datepicker-toggle>
        <mat-datepicker #datePicker></mat-datepicker>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="dateControl.invalid || submitting">
        {{ 'common.save' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .hint { color: rgba(0,0,0,0.54); font-size: 13px; margin-bottom: 16px; }
  `],
})
export class HolidayDateDialogComponent {
  private holidayService = inject(HolidayService);
  private dialogRef = inject(MatDialogRef<HolidayDateDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  data: DialogData = inject(MAT_DIALOG_DATA);

  dateControl = new FormControl<Date | null>(
    this.data.currentDate ? new Date(this.data.currentDate + 'T00:00:00') : null,
    Validators.required
  );
  submitting = false;

  submit(): void {
    if (this.dateControl.invalid) return;
    this.submitting = true;

    const date = this.dateControl.value!;
    const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    this.holidayService.updateHolidayDate(this.data.holidayId, this.data.year, formatted).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('admin_holidays.updated'),
          this.translate.instant('common.ok'),
          { duration: 3000 }
        );
        this.dialogRef.close(true);
      },
      error: () => {
        this.submitting = false;
      },
    });
  }
}
