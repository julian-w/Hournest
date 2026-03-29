import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SettingsService } from '../../../core/services/settings.service';
import { AppSetting } from '../../../core/models/setting.model';

interface WorkDayOption {
  day: number;
  labelKey: string;
  checked: boolean;
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    TranslateModule,
  ],
  template: `
    <h2>{{ 'admin_settings.title' | translate }}</h2>

    <mat-card class="settings-card">
      <h3>{{ 'admin_settings.work_days' | translate }}</h3>
      <div class="work-days-grid">
        @for (wd of workDays; track wd.day) {
          <mat-checkbox [(ngModel)]="wd.checked">
            {{ wd.labelKey | translate }}
          </mat-checkbox>
        }
      </div>

      <mat-slide-toggle [(ngModel)]="weekendFree" class="setting-toggle">
        {{ 'admin_settings.weekend_free' | translate }}
      </mat-slide-toggle>

      <mat-slide-toggle [(ngModel)]="carryoverEnabled" class="setting-toggle">
        {{ 'admin_settings.carryover_enabled' | translate }}
      </mat-slide-toggle>

      @if (carryoverEnabled) {
        <mat-form-field appearance="outline" class="expiry-field">
          <mat-label>{{ 'admin_settings.carryover_expiry' | translate }}</mat-label>
          <input matInput [(ngModel)]="carryoverExpiry" placeholder="TT.MM">
          <mat-hint>{{ 'admin_settings.carryover_expiry_hint' | translate }}</mat-hint>
        </mat-form-field>
      }

      <h3 style="margin-top: 24px">{{ 'admin_settings.vacation_booking_start' | translate }}</h3>
      <mat-form-field appearance="outline" class="expiry-field">
        <mat-label>{{ 'admin_settings.vacation_booking_start' | translate }}</mat-label>
        <input matInput [(ngModel)]="vacationBookingStart" placeholder="TT.MM">
        <mat-hint>{{ 'admin_settings.vacation_booking_start_hint' | translate }}</mat-hint>
      </mat-form-field>

      <div class="actions">
        <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">
          {{ 'common.save' | translate }}
        </button>
      </div>
    </mat-card>
  `,
  styles: [`
    .settings-card {
      max-width: 600px;
      padding: 24px;
    }
    h3 {
      margin-bottom: 12px;
    }
    .work-days-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
    }
    .setting-toggle {
      display: block;
      margin-bottom: 16px;
    }
    .expiry-field {
      display: block;
      margin-bottom: 16px;
      max-width: 300px;
    }
    .actions {
      margin-top: 24px;
    }
  `],
})
export class AdminSettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  saving = signal(false);

  workDays: WorkDayOption[] = [
    { day: 1, labelKey: 'admin_settings.mon', checked: true },
    { day: 2, labelKey: 'admin_settings.tue', checked: true },
    { day: 3, labelKey: 'admin_settings.wed', checked: true },
    { day: 4, labelKey: 'admin_settings.thu', checked: true },
    { day: 5, labelKey: 'admin_settings.fri', checked: true },
    { day: 6, labelKey: 'admin_settings.sat', checked: false },
    { day: 0, labelKey: 'admin_settings.sun', checked: false },
  ];

  weekendFree = true;
  carryoverEnabled = false;
  carryoverExpiry = '';
  vacationBookingStart = '';

  ngOnInit(): void {
    this.loadSettings();
  }

  save(): void {
    this.saving.set(true);

    const selectedDays = this.workDays
      .filter(wd => wd.checked)
      .map(wd => wd.day);

    const settings: Record<string, string> = {
      default_work_days: JSON.stringify(selectedDays),
      weekend_is_free: this.weekendFree ? '1' : '0',
      carryover_enabled: this.carryoverEnabled ? '1' : '0',
      carryover_expiry_date: this.carryoverExpiry || '',
      vacation_booking_start: this.vacationBookingStart || '',
    };

    this.settingsService.updateSettings(settings).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(this.translate.instant('admin_settings.saved'), this.translate.instant('common.ok'), { duration: 3000 });
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  private loadSettings(): void {
    this.settingsService.getSettings().subscribe(settings => {
      this.applySettings(settings);
    });
  }

  private applySettings(settings: AppSetting[]): void {
    const map = new Map<string, string | null>();
    settings.forEach(s => map.set(s.key, s.value));

    const workDaysStr = map.get('default_work_days');
    if (workDaysStr) {
      try {
        const days = JSON.parse(workDaysStr) as number[];
        this.workDays.forEach(wd => {
          wd.checked = days.includes(wd.day);
        });
      } catch {
        // keep defaults
      }
    }

    const weekendFreeStr = map.get('weekend_is_free');
    if (weekendFreeStr !== undefined) {
      this.weekendFree = weekendFreeStr === '1';
    }

    const carryoverStr = map.get('carryover_enabled');
    if (carryoverStr !== undefined) {
      this.carryoverEnabled = carryoverStr === '1';
    }

    const expiryStr = map.get('carryover_expiry_date');
    if (expiryStr) {
      this.carryoverExpiry = expiryStr;
    }

    const bookingStartStr = map.get('vacation_booking_start');
    if (bookingStartStr) {
      this.vacationBookingStart = bookingStartStr;
    }
  }
}
