import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HolidayService } from '../../../core/services/holiday.service';
import { Holiday } from '../../../core/models/holiday.model';

interface DialogData {
  holiday?: Holiday;
  year: number;
}

@Component({
  selector: 'app-holiday-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatButtonModule,
    MatNativeDateModule,
    MatSnackBarModule,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? ('admin_holidays.edit' | translate) : ('admin_holidays.add' | translate) }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_holidays.name' | translate }}</mat-label>
          <input matInput formControlName="name">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_holidays.type' | translate }}</mat-label>
          <mat-select formControlName="type">
            <mat-option value="fixed">{{ 'admin_holidays.type_fixed' | translate }}</mat-option>
            <mat-option value="variable">{{ 'admin_holidays.type_variable' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_holidays.date' | translate }}</mat-label>
          <input matInput [matDatepicker]="datePicker" formControlName="date">
          <mat-datepicker-toggle matIconSuffix [for]="datePicker"></mat-datepicker-toggle>
          <mat-datepicker #datePicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_holidays.start_year' | translate }}</mat-label>
          <input matInput type="number" formControlName="start_year">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_holidays.end_year' | translate }}</mat-label>
          <input matInput type="number" formControlName="end_year">
          <mat-hint>{{ 'admin_holidays.end_year_hint' | translate }}</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || submitting">
        {{ 'common.save' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 280px;
      padding-top: 8px;
    }
  `],
})
export class HolidayDialogComponent {
  private holidayService = inject(HolidayService);
  private dialogRef = inject(MatDialogRef<HolidayDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private data: DialogData = inject(MAT_DIALOG_DATA);

  isEdit = !!this.data.holiday;
  submitting = false;

  form = new FormGroup({
    name: new FormControl<string>(this.data.holiday?.name || '', Validators.required),
    date: new FormControl<Date | null>(
      this.data.holiday ? new Date(this.data.holiday.date + 'T00:00:00') : null,
      Validators.required
    ),
    type: new FormControl<'fixed' | 'variable'>(this.data.holiday?.type || 'fixed', Validators.required),
    start_year: new FormControl<number>(
      this.data.holiday?.start_year || this.data.year,
      Validators.required
    ),
    end_year: new FormControl<number | null>(this.data.holiday?.end_year || null),
  });

  submit(): void {
    if (this.form.invalid) return;

    this.submitting = true;
    const formValue = this.form.value;
    const payload = {
      name: formValue.name!,
      date: this.formatDate(formValue.date!),
      type: formValue.type as 'fixed' | 'variable',
      start_year: formValue.start_year!,
      end_year: formValue.end_year || null,
    };

    const request = this.isEdit
      ? this.holidayService.updateHoliday(this.data.holiday!.id, payload)
      : this.holidayService.createHoliday(payload);

    request.subscribe({
      next: () => {
        const msgKey = this.isEdit ? 'admin_holidays.updated' : 'admin_holidays.created';
        this.snackBar.open(this.translate.instant(msgKey), this.translate.instant('common.ok'), { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.submitting = false;
      },
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
