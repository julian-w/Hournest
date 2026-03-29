import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BlackoutService } from '../../../core/services/blackout.service';
import { BlackoutPeriod } from '../../../core/models/blackout-period.model';

@Component({
  selector: 'app-blackout-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatRadioModule, MatSnackBarModule, TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ (isEdit ? 'admin_blackouts.edit' : 'admin_blackouts.add') | translate }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-fields">
        <label class="radio-label">{{ 'admin_blackouts.type' | translate }}</label>
        <mat-radio-group formControlName="type" class="type-radio-group">
          <mat-radio-button value="freeze">
            <span class="radio-option">
              <strong>{{ 'admin_blackouts.type_freeze' | translate }}</strong>
              <span class="radio-desc">{{ 'admin_blackouts.type_freeze_desc' | translate }}</span>
            </span>
          </mat-radio-button>
          <mat-radio-button value="company_holiday">
            <span class="radio-option">
              <strong>{{ 'admin_blackouts.type_company_holiday' | translate }}</strong>
              <span class="radio-desc">{{ 'admin_blackouts.type_company_holiday_desc' | translate }}</span>
            </span>
          </mat-radio-button>
        </mat-radio-group>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_blackouts.from' | translate }}</mat-label>
          <input matInput [matDatepicker]="startPicker" formControlName="startDate">
          <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_blackouts.to' | translate }}</mat-label>
          <input matInput [matDatepicker]="endPicker" formControlName="endDate"
                 [min]="form.get('startDate')?.value">
          <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_blackouts.reason' | translate }}</mat-label>
          <textarea matInput formControlName="reason" rows="2"></textarea>
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
    .radio-label {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: -4px;
    }
    .type-radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 8px;
    }
    .radio-option {
      display: flex;
      flex-direction: column;
    }
    .radio-desc {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }
  `],
})
export class BlackoutDialogComponent implements OnInit {
  private blackoutService = inject(BlackoutService);
  private dialogRef = inject(MatDialogRef<BlackoutDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  data: BlackoutPeriod | null = inject(MAT_DIALOG_DATA, { optional: true }) ?? null;

  isEdit = false;
  submitting = false;

  form = new FormGroup({
    type: new FormControl<'freeze' | 'company_holiday'>('freeze', Validators.required),
    startDate: new FormControl<Date | null>(null, Validators.required),
    endDate: new FormControl<Date | null>(null, Validators.required),
    reason: new FormControl<string>('', Validators.required),
  });

  ngOnInit(): void {
    if (this.data) {
      this.isEdit = true;
      this.form.patchValue({
        type: this.data.type,
        startDate: new Date(this.data.start_date + 'T00:00:00'),
        endDate: new Date(this.data.end_date + 'T00:00:00'),
        reason: this.data.reason,
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting = true;

    const start = this.formatDate(this.form.value.startDate!);
    const end = this.formatDate(this.form.value.endDate!);
    const reason = this.form.value.reason!;
    const type = this.form.value.type!;

    const payload = { type, start_date: start, end_date: end, reason };

    const action$ = this.isEdit
      ? this.blackoutService.updateBlackout(this.data!.id, payload)
      : this.blackoutService.createBlackout(payload);

    action$.subscribe({
      next: () => {
        const msgKey = this.isEdit ? 'admin_blackouts.updated' : 'admin_blackouts.created';
        this.snackBar.open(
          this.translate.instant(msgKey),
          this.translate.instant('common.ok'),
          { duration: 3000 },
        );
        this.dialogRef.close(true);
      },
      error: () => { this.submitting = false; },
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
