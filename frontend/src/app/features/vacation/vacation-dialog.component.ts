import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { VacationService } from '../../core/services/vacation.service';
import { HolidayService } from '../../core/services/holiday.service';
import { BlackoutService } from '../../core/services/blackout.service';

@Component({
  selector: 'app-vacation-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'vacation_dialog.title' | translate }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'vacation_dialog.start_date' | translate }}</mat-label>
          <input matInput [matDatepicker]="startPicker" formControlName="startDate" [min]="minDate"
                 (dateChange)="onDateChange()">
          <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'vacation_dialog.end_date' | translate }}</mat-label>
          <input matInput [matDatepicker]="endPicker" formControlName="endDate"
                 [min]="form.get('startDate')?.value || minDate"
                 (dateChange)="onDateChange()">
          <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'vacation_dialog.comment' | translate }}</mat-label>
          <textarea matInput formControlName="comment" rows="2"></textarea>
        </mat-form-field>
      </form>

      @if (holidayWarning()) {
        <p class="warning">{{ 'vacation_dialog.error_holidays_incomplete' | translate }}</p>
      }

      @if (blackoutWarning()) {
        <p class="warning blackout" [class.freeze]="blackoutType() === 'freeze'"
           [class.company-holiday]="blackoutType() === 'company_holiday'">
          @if (blackoutType() === 'freeze') {
            {{ 'vacation_dialog.error_blackout_freeze' | translate:{ reason: blackoutReason() } }}
          } @else {
            {{ 'vacation_dialog.error_blackout_company_holiday' | translate:{ reason: blackoutReason() } }}
          }
        </p>
      }

      @if (error) {
        <p class="error">{{ error }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'vacation_dialog.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="submit()"
              [disabled]="form.invalid || submitting || holidayWarning() || (blackoutWarning() && blackoutType() === 'freeze')">
        {{ 'vacation_dialog.submit' | translate }}
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
    .error {
      color: #c62828;
      font-size: 13px;
    }
    .warning {
      color: #e65100;
      font-size: 13px;
      background: #fff3e0;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .warning.blackout.freeze {
      background: #ffebee;
      color: #c62828;
    }
    .warning.blackout.company-holiday {
      background: #fff3e0;
      color: #e65100;
    }
  `],
})
export class VacationDialogComponent implements OnInit {
  private vacationService = inject(VacationService);
  private holidayService = inject(HolidayService);
  private blackoutService = inject(BlackoutService);
  private dialogRef = inject(MatDialogRef<VacationDialogComponent>);
  private translate = inject(TranslateService);

  minDate = new Date();
  submitting = false;
  error = '';
  holidayWarning = signal(false);
  blackoutWarning = signal(false);
  blackoutReason = signal('');
  blackoutType = signal<'freeze' | 'company_holiday'>('freeze');
  private confirmedYears = new Map<number, boolean>();

  form = new FormGroup({
    startDate: new FormControl<Date | null>(null, Validators.required),
    endDate: new FormControl<Date | null>(null, Validators.required),
    comment: new FormControl<string>(''),
  });

  ngOnInit(): void {
    this.checkYearConfirmed(new Date().getFullYear());
  }

  onDateChange(): void {
    const startDate = this.form.value.startDate;
    const endDate = this.form.value.endDate;

    if (startDate) {
      this.checkYearConfirmed(startDate.getFullYear());
    }

    if (startDate && endDate) {
      this.checkBlackout(startDate, endDate);
    } else {
      this.blackoutWarning.set(false);
    }
  }

  submit(): void {
    if (this.form.invalid || this.holidayWarning() || (this.blackoutWarning() && this.blackoutType() === 'freeze')) return;

    this.submitting = true;
    this.error = '';

    const startDate = this.formatDate(this.form.value.startDate!);
    const endDate = this.formatDate(this.form.value.endDate!);
    const comment = this.form.value.comment || undefined;

    this.vacationService.requestVacation(startDate, endDate, comment).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.submitting = false;
        if (err.error?.errors?.year?.[0] === 'holidays_incomplete') {
          this.error = this.translate.instant('vacation_dialog.error_holidays_incomplete');
        } else if (err.error?.message?.includes('overlap')) {
          this.error = this.translate.instant('vacation_dialog.error_overlap');
        } else {
          this.error = err.error?.message || this.translate.instant('vacation_dialog.error_generic');
        }
      },
    });
  }

  private checkYearConfirmed(year: number): void {
    if (this.confirmedYears.has(year)) {
      this.holidayWarning.set(!this.confirmedYears.get(year)!);
      return;
    }
    this.holidayService.isYearConfirmed(year).subscribe(confirmed => {
      this.confirmedYears.set(year, confirmed);
      const startDate = this.form.value.startDate;
      if (startDate && startDate.getFullYear() === year) {
        this.holidayWarning.set(!confirmed);
      }
    });
  }

  private checkBlackout(start: Date, end: Date): void {
    const startStr = this.formatDate(start);
    const endStr = this.formatDate(end);
    this.blackoutService.checkDate(startStr, endStr).subscribe(blackout => {
      if (blackout) {
        this.blackoutWarning.set(true);
        this.blackoutReason.set(blackout.reason);
        this.blackoutType.set(blackout.type);
      } else {
        this.blackoutWarning.set(false);
        this.blackoutReason.set('');
      }
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
