import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Absence } from '../../core/models/absence.model';
import { CostCenter } from '../../core/models/cost-center.model';
import { TimeBookingTemplate } from '../../core/models/time-booking-template.model';
import { TimeBooking } from '../../core/models/time-booking.model';
import { TimeEntry } from '../../core/models/time-entry.model';
import { Vacation } from '../../core/models/vacation.model';
import { AbsenceService } from '../../core/services/absence.service';
import { CostCenterService } from '../../core/services/cost-center.service';
import { TimeBookingTemplateService } from '../../core/services/time-booking-template.service';
import { TimeTrackingService } from '../../core/services/time-tracking.service';
import { VacationService } from '../../core/services/vacation.service';
import { TimeBookingTemplateDialogComponent } from './time-booking-template-dialog.component';

interface DayData {
  date: string;
  dayLabel: string;
  isToday: boolean;
  isWeekend: boolean;
  timeEntry: TimeEntry | null;
  absence: Absence | null;
  vacation: Vacation | null;
  isLocked: boolean;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

interface BookingRow {
  costCenter: CostCenter;
  isFavorite: boolean;
  percentages: { [date: string]: number | null };
}

@Component({
  selector: 'app-time-tracking',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
    TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h2>{{ 'time_tracking.title' | translate }}</h2>
      <div class="week-nav">
        <button mat-icon-button (click)="navigateWeek(-1)" [matTooltip]="'time_tracking.prev_week' | translate">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <button mat-stroked-button (click)="goToToday()">{{ 'time_tracking.today' | translate }}</button>
        <span class="week-label">{{ weekLabel() }}</span>
        <button mat-icon-button (click)="navigateWeek(1)" [matTooltip]="'time_tracking.next_week' | translate">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>
    </div>

    <mat-card class="time-grid">
      <div class="grid-container">
        <div class="grid-header">
          <div class="label-col">{{ 'time_tracking.cost_center' | translate }}</div>
          @for (day of days(); track day.date) {
            <div class="day-col" [class.today]="day.isToday" [class.weekend]="day.isWeekend" [class.locked]="day.isLocked || day.absence || day.vacation">
              <div class="day-name">{{ day.dayLabel }}</div>
              <div class="day-date">{{ day.date | date:'dd.MM.' }}</div>
            </div>
          }
        </div>

        <div class="grid-row time-row">
          <div class="label-col">
            <mat-icon>schedule</mat-icon>
            {{ 'time_tracking.hours' | translate }}
          </div>
          @for (day of days(); track day.date) {
            <div class="day-col" [class.today]="day.isToday" [class.weekend]="day.isWeekend" [class.locked]="day.isLocked">
              @if (day.vacation && day.vacation.scope === 'full_day') {
                <div class="absence-badge">
                  <mat-chip class="absence-chip">
                    {{ 'time_tracking.absence_vacation' | translate }}
                  </mat-chip>
                </div>
              } @else if (day.absence && day.absence.scope === 'full_day') {
                <div class="absence-badge">
                  <mat-chip class="absence-chip">
                    {{ 'time_tracking.absence_' + day.absence.type | translate }}
                  </mat-chip>
                </div>
              } @else if (!day.isWeekend) {
                <div class="time-inputs">
                  <input class="time-input" type="time" [(ngModel)]="day.startTime"
                         (change)="saveTimeEntry(day)" [disabled]="day.isLocked"
                         [placeholder]="'HH:mm'">
                  <span class="time-sep">-</span>
                  <input class="time-input" type="time" [(ngModel)]="day.endTime"
                         (change)="saveTimeEntry(day)" [disabled]="day.isLocked"
                         [placeholder]="'HH:mm'">
                  <input class="break-input" type="number" [(ngModel)]="day.breakMinutes"
                         (change)="saveTimeEntry(day)" [disabled]="day.isLocked"
                         min="0" max="480" [matTooltip]="'time_tracking.break_minutes' | translate">
                </div>
                @if (day.timeEntry) {
                  <div class="net-hours">{{ formatMinutes(day.timeEntry.net_working_minutes) }}</div>
                }
              }
            </div>
          }
        </div>

        @for (row of bookingRows(); track row.costCenter.id) {
          <div class="grid-row" [class.favorite-row]="row.isFavorite">
            <div class="label-col cost-center-label">
              @if (row.isFavorite) {
                <mat-icon class="fav-icon">star</mat-icon>
              }
              <span class="cc-name" [matTooltip]="row.costCenter.code">{{ row.costCenter.name }}</span>
            </div>
            @for (day of days(); track day.date) {
              <div class="day-col" [class.today]="day.isToday" [class.weekend]="day.isWeekend" [class.locked]="day.isLocked || (day.absence && day.absence.scope === 'full_day') || (day.vacation && day.vacation.scope === 'full_day')">
                @if (!day.isWeekend && !(day.absence && day.absence.scope === 'full_day') && !(day.vacation && day.vacation.scope === 'full_day')) {
                  <input class="pct-input" type="number"
                         [ngModel]="row.percentages[day.date]"
                         (ngModelChange)="onPercentageChange(row, day.date, $event)"
                         [disabled]="day.isLocked"
                         min="0" max="100" step="5"
                         [placeholder]="'—'">
                }
              </div>
            }
          </div>
        }

        <div class="grid-row total-row">
          <div class="label-col"><strong>{{ 'time_tracking.total' | translate }}</strong></div>
          @for (day of days(); track day.date) {
            <div class="day-col" [class.today]="day.isToday" [class.weekend]="day.isWeekend"
                 [class.total-ok]="getDayTotal(day.date) === expectedDayTotal(day)"
                 [class.total-warn]="getDayTotal(day.date) > 0 && getDayTotal(day.date) !== expectedDayTotal(day) && !(day.absence && day.absence.scope === 'full_day') && !(day.vacation && day.vacation.scope === 'full_day')">
              @if (!day.isWeekend) {
                <strong>{{ getDayTotal(day.date) }}%</strong>
              }
            </div>
          }
        </div>

        <div class="grid-row summary-row">
          <div class="label-col summary-label">
            <div>{{ 'time_tracking.week_actual' | translate }}: <strong>{{ weekActual() }}</strong></div>
            <div>{{ 'time_tracking.week_target' | translate }}: <strong>{{ weekTarget() }}</strong></div>
            <div [class.positive]="weekDeltaMinutes() >= 0" [class.negative]="weekDeltaMinutes() < 0">
              {{ 'time_tracking.week_delta' | translate }}: <strong>{{ weekDelta() }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <div class="template-actions">
          <mat-form-field appearance="outline" class="template-field">
            <mat-label>{{ 'time_tracking.template_day' | translate }}</mat-label>
            <mat-select [ngModel]="selectedTemplateDate()" (ngModelChange)="selectedTemplateDate.set($event)">
              @for (day of templateDays(); track day.date) {
                <mat-option [value]="day.date">
                  {{ day.date | date:'EEE dd.MM.' }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="template-field">
            <mat-label>{{ 'time_tracking.template_label' | translate }}</mat-label>
            <mat-select [ngModel]="selectedTemplateId()" (ngModelChange)="selectedTemplateId.set($event)">
              @for (template of templates(); track template.id) {
                <mat-option [value]="template.id">{{ template.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <button mat-stroked-button (click)="applySelectedTemplate()" [disabled]="!selectedTemplateId() || !selectedTemplateDate()">
            <mat-icon>play_arrow</mat-icon>
            {{ 'time_tracking.apply_template' | translate }}
          </button>

          <button mat-stroked-button (click)="openSaveTemplateDialog()" [disabled]="!selectedTemplateDate()">
            <mat-icon>bookmark_add</mat-icon>
            {{ 'time_tracking.save_template' | translate }}
          </button>

          <button mat-stroked-button (click)="openUpdateTemplateDialog()" [disabled]="!selectedTemplateId() || !selectedTemplateDate()">
            <mat-icon>edit</mat-icon>
            {{ 'time_tracking.update_template' | translate }}
          </button>

          <button mat-stroked-button color="warn" (click)="deleteSelectedTemplate()" [disabled]="!selectedTemplateId()">
            <mat-icon>delete</mat-icon>
            {{ 'time_tracking.delete_template' | translate }}
          </button>
        </div>

        <div class="save-actions">
          <button mat-stroked-button (click)="copyPreviousDay()" [disabled]="!selectedTemplateDate()">
            <mat-icon>redo</mat-icon>
            {{ 'time_tracking.copy_prev_day' | translate }}
          </button>
          <button mat-stroked-button (click)="copyPreviousWeek()" [matTooltip]="'time_tracking.copy_prev_week' | translate">
            <mat-icon>content_copy</mat-icon>
            {{ 'time_tracking.copy_prev_week' | translate }}
          </button>
          <button mat-raised-button color="primary" (click)="saveAll()">
            <mat-icon>save</mat-icon>
            {{ 'time_tracking.save_all' | translate }}
          </button>
        </div>
      </div>
    </mat-card>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .week-nav {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .week-label {
      font-weight: 500;
      min-width: 200px;
      text-align: center;
    }
    .time-grid {
      overflow-x: auto;
    }
    .grid-container {
      min-width: 800px;
    }
    .grid-header, .grid-row {
      display: flex;
      border-bottom: 1px solid #e0e0e0;
    }
    .grid-header {
      font-weight: 500;
      background: #fafafa;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .label-col {
      width: 180px;
      min-width: 180px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-right: 1px solid #e0e0e0;
    }
    .day-col {
      flex: 1;
      padding: 8px;
      text-align: center;
      border-right: 1px solid #f0f0f0;
      min-width: 100px;
    }
    .day-col.today {
      background: #fff8e1;
    }
    .day-col.weekend {
      background: #f5f5f5;
    }
    .day-col.locked {
      background: #f0f0f0;
      opacity: 0.7;
    }
    .day-name {
      font-size: 12px;
      text-transform: uppercase;
      color: rgba(0, 0, 0, 0.54);
    }
    .day-date {
      font-size: 13px;
    }
    .time-row {
      background: #fafafa;
    }
    .time-inputs {
      display: flex;
      align-items: center;
      gap: 2px;
      justify-content: center;
    }
    .time-input {
      width: 60px;
      text-align: center;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 4px;
      font-size: 12px;
    }
    .time-sep {
      color: rgba(0, 0, 0, 0.38);
    }
    .break-input {
      width: 36px;
      text-align: center;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 4px;
      font-size: 11px;
      margin-left: 4px;
    }
    .net-hours {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.54);
      margin-top: 2px;
    }
    .pct-input {
      width: 50px;
      text-align: center;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 6px 4px;
      font-size: 13px;
    }
    .pct-input:focus {
      border-color: #ff9800;
      outline: none;
    }
    .favorite-row {
      background: #fffde7;
    }
    .fav-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      color: #ff9800;
    }
    .cc-name {
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .cost-center-label {
      font-size: 13px;
    }
    .total-row {
      background: #fafafa;
      font-size: 14px;
    }
    .total-ok strong {
      color: #2e7d32;
    }
    .total-warn strong {
      color: #c62828;
    }
    .summary-row {
      border-bottom: none;
    }
    .summary-label {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      font-size: 13px;
      width: 100%;
      max-width: 100%;
    }
    .positive {
      color: #2e7d32;
    }
    .negative {
      color: #c62828;
    }
    .absence-badge {
      padding: 4px 0;
    }
    .absence-chip {
      font-size: 11px;
    }
    .actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      padding: 16px 12px 8px;
    }
    .template-actions,
    .save-actions {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .template-field {
      width: 190px;
      margin-bottom: -1.25em;
    }
  `],
})
export class TimeTrackingComponent implements OnInit {
  private timeService = inject(TimeTrackingService);
  private templateService = inject(TimeBookingTemplateService);
  private costCenterService = inject(CostCenterService);
  private absenceService = inject(AbsenceService);
  private vacationService = inject(VacationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  private weekOffset = signal(0);
  private targetMinutesPerDay = signal(480);
  private weekBookings = signal<TimeBooking[]>([]);

  days = signal<DayData[]>([]);
  costCenters = signal<CostCenter[]>([]);
  favorites = signal<CostCenter[]>([]);
  absences = signal<Absence[]>([]);
  vacations = signal<Vacation[]>([]);
  templates = signal<TimeBookingTemplate[]>([]);
  bookingRows = signal<BookingRow[]>([]);
  selectedTemplateDate = signal('');
  selectedTemplateId = signal<number | null>(null);

  weekLabel = computed(() => {
    const weekDays = this.days();
    if (weekDays.length === 0) {
      return '';
    }

    return `${weekDays[0].date} — ${weekDays[weekDays.length - 1].date}`;
  });

  weekActual = computed(() => {
    const total = this.days().reduce((sum, day) => sum + (day.timeEntry?.net_working_minutes ?? 0), 0);
    return this.formatMinutes(total);
  });

  weekTarget = computed(() => {
    const workDays = this.days().filter(day => !day.isWeekend).length;
    return this.formatMinutes(workDays * this.targetMinutesPerDay());
  });

  weekDeltaMinutes = computed(() => {
    const actual = this.days().reduce((sum, day) => sum + (day.timeEntry?.net_working_minutes ?? 0), 0);
    const workDays = this.days().filter(day => !day.isWeekend).length;
    return actual - workDays * this.targetMinutesPerDay();
  });

  weekDelta = computed(() => {
    const delta = this.weekDeltaMinutes();
    const sign = delta >= 0 ? '+' : '';
    return sign + this.formatMinutes(Math.abs(delta));
  });

  templateDays = computed(() => this.days().filter(day => this.canEditBookingsForDay(day)));

  ngOnInit(): void {
    this.loadWeek();
  }

  navigateWeek(direction: number): void {
    this.weekOffset.update(value => value + direction);
    this.loadWeek();
  }

  goToToday(): void {
    this.weekOffset.set(0);
    this.loadWeek();
  }

  onPercentageChange(row: BookingRow, date: string, value: number | null): void {
    this.bookingRows.update(rows => rows.map(entry =>
      entry.costCenter.id === row.costCenter.id
        ? { ...entry, percentages: { ...entry.percentages, [date]: value } }
        : entry
    ));
  }

  getDayTotal(date: string): number {
    return this.bookingRows().reduce((sum, row) => sum + (row.percentages[date] ?? 0), 0);
  }

  expectedDayTotal(day: DayData): number {
    if ((day.absence && day.absence.scope !== 'full_day') || (day.vacation && day.vacation.scope !== 'full_day')) {
      return 50;
    }

    return 100;
  }

  saveTimeEntry(day: DayData): void {
    if (!day.startTime || !day.endTime) {
      return;
    }

    this.timeService.saveTimeEntry(day.date, {
      start_time: day.startTime,
      end_time: day.endTime,
      break_minutes: day.breakMinutes || 0,
    }).subscribe(entry => {
      this.days.update(days => days.map(item =>
        item.date === day.date ? { ...item, timeEntry: entry } : item
      ));
    });
  }

  saveAll(): void {
    const days = this.days().filter(day =>
      !day.isWeekend &&
      !(day.absence && day.absence.scope === 'full_day') &&
      !(day.vacation && day.vacation.scope === 'full_day')
    );
    let pending = 0;
    let completed = 0;

    for (const day of days) {
      const bookings = this.bookingRows()
        .filter(row => (row.percentages[day.date] ?? 0) > 0)
        .map(row => ({
          cost_center_id: row.costCenter.id,
          percentage: row.percentages[day.date]!,
        }));

      if (bookings.length === 0) {
        continue;
      }

      const total = bookings.reduce((sum, booking) => sum + booking.percentage, 0);
      if (total !== this.expectedDayTotal(day)) {
        continue;
      }

      pending++;
      this.timeService.saveTimeBookings(day.date, bookings).subscribe({
        next: () => {
          completed++;
          if (completed === pending) {
            this.snackBar.open(
              this.translate.instant('time_tracking.saved'),
              this.translate.instant('common.ok'),
              { duration: 3000 },
            );
          }
        },
        error: () => {
          this.snackBar.open(
            this.translate.instant('time_tracking.save_error'),
            this.translate.instant('common.ok'),
            { duration: 3000 },
          );
        },
      });
    }

    if (pending === 0) {
      this.snackBar.open(
        this.translate.instant('time_tracking.nothing_to_save'),
        this.translate.instant('common.ok'),
        { duration: 3000 },
      );
    }
  }

  copyPreviousWeek(): void {
    const currentDays = this.days();
    if (currentDays.length === 0) {
      return;
    }

    const prevFrom = new Date(currentDays[0].date);
    prevFrom.setDate(prevFrom.getDate() - 7);
    const prevTo = new Date(currentDays[6].date);
    prevTo.setDate(prevTo.getDate() - 7);

    this.timeService.getTimeBookings(
      prevFrom.toISOString().split('T')[0],
      prevTo.toISOString().split('T')[0],
    ).subscribe(previousBookings => {
      this.bookingRows.update(rows => rows.map(row => {
        const percentages = { ...row.percentages };
        for (let index = 0; index < 7; index++) {
          const previousDate = new Date(prevFrom);
          previousDate.setDate(prevFrom.getDate() + index);
          const previousDateString = previousDate.toISOString().split('T')[0];
          const currentDate = currentDays[index].date;
          const previousBooking = previousBookings.find(booking =>
            booking.date === previousDateString && booking.cost_center_id === row.costCenter.id
          );

          if (previousBooking) {
            percentages[currentDate] = previousBooking.percentage;
          }
        }

        return { ...row, percentages };
      }));

      this.snackBar.open(
        this.translate.instant('time_tracking.copied'),
        this.translate.instant('common.ok'),
        { duration: 2000 },
      );
    });
  }

  copyPreviousDay(): void {
    const targetDate = this.selectedTemplateDate();
    if (!targetDate) {
      return;
    }

    const target = new Date(`${targetDate}T00:00:00`);
    const searchFrom = new Date(target);
    searchFrom.setDate(target.getDate() - 42);
    const searchTo = new Date(target);
    searchTo.setDate(target.getDate() - 1);

    this.timeService.getTimeBookings(
      searchFrom.toISOString().split('T')[0],
      searchTo.toISOString().split('T')[0],
    ).subscribe(previousBookings => {
      const previousDates = [...new Set(previousBookings.map(booking => booking.date))]
        .filter(date => date < targetDate)
        .sort()
        .reverse();
      const sourceDate = previousDates[0];

      if (!sourceDate) {
        this.snackBar.open(
          this.translate.instant('time_tracking.copy_prev_day_empty'),
          this.translate.instant('common.ok'),
          { duration: 2500 },
        );
        return;
      }

      this.bookingRows.update(rows => rows.map(row => {
        const percentages = { ...row.percentages };
        const previousBooking = previousBookings.find(booking =>
          booking.date === sourceDate && booking.cost_center_id === row.costCenter.id
        );

        percentages[targetDate] = previousBooking?.percentage ?? null;

        return { ...row, percentages };
      }));

      this.snackBar.open(
        this.translate.instant('time_tracking.copied_prev_day'),
        this.translate.instant('common.ok'),
        { duration: 2000 },
      );
    });
  }

  applySelectedTemplate(): void {
    const template = this.getSelectedTemplate();
    const date = this.selectedTemplateDate();
    const day = this.days().find(entry => entry.date === date);

    if (!template || !date || !day || !this.canEditBookingsForDay(day)) {
      return;
    }

    const percentages = new Map(template.items.map(item => [item.cost_center_id, item.percentage]));

    this.bookingRows.update(rows => rows.map(row => ({
      ...row,
      percentages: {
        ...row.percentages,
        [date]: percentages.get(row.costCenter.id) ?? null,
      },
    })));

    this.snackBar.open(
      this.translate.instant('time_tracking.template_applied'),
      this.translate.instant('common.ok'),
      { duration: 2500 },
    );
  }

  openSaveTemplateDialog(): void {
    const date = this.selectedTemplateDate();
    const items = this.getTemplatePayloadForDate(date);

    if (!date || items.length === 0) {
      this.snackBar.open(
        this.translate.instant('time_tracking.template_empty_day'),
        this.translate.instant('common.ok'),
        { duration: 3000 },
      );
      return;
    }

    this.dialog.open(TimeBookingTemplateDialogComponent, {
      data: {
        titleKey: 'time_tracking.template_save_title',
        confirmKey: 'common.save',
        initialName: this.translate.instant('time_tracking.template_default_name', { date }),
      },
    }).afterClosed().subscribe(name => {
      if (!name) {
        return;
      }

      this.templateService.createTemplate({ name, items }).subscribe(() => {
        this.loadTemplates();
        this.snackBar.open(
          this.translate.instant('time_tracking.template_saved'),
          this.translate.instant('common.ok'),
          { duration: 2500 },
        );
      });
    });
  }

  openUpdateTemplateDialog(): void {
    const template = this.getSelectedTemplate();
    const date = this.selectedTemplateDate();
    const items = this.getTemplatePayloadForDate(date);

    if (!template || !date || items.length === 0) {
      this.snackBar.open(
        this.translate.instant('time_tracking.template_empty_day'),
        this.translate.instant('common.ok'),
        { duration: 3000 },
      );
      return;
    }

    this.dialog.open(TimeBookingTemplateDialogComponent, {
      data: {
        titleKey: 'time_tracking.template_update_title',
        confirmKey: 'common.save',
        initialName: template.name,
      },
    }).afterClosed().subscribe(name => {
      if (!name) {
        return;
      }

      this.templateService.updateTemplate(template.id, { name, items }).subscribe(() => {
        this.loadTemplates();
        this.snackBar.open(
          this.translate.instant('time_tracking.template_updated'),
          this.translate.instant('common.ok'),
          { duration: 2500 },
        );
      });
    });
  }

  deleteSelectedTemplate(): void {
    const template = this.getSelectedTemplate();
    if (!template) {
      return;
    }

    this.templateService.deleteTemplate(template.id).subscribe(() => {
      this.templates.update(templates => templates.filter(entry => entry.id !== template.id));
      this.syncTemplateSelection();
      this.snackBar.open(
        this.translate.instant('time_tracking.template_deleted'),
        this.translate.instant('common.ok'),
        { duration: 2500 },
      );
    });
  }

  formatMinutes(minutes: number): string {
    const hours = Math.floor(Math.abs(minutes) / 60);
    const remainder = Math.abs(minutes) % 60;
    return `${hours}:${remainder.toString().padStart(2, '0')}`;
  }

  private loadWeek(): void {
    const { from, to, days } = this.getWeekDates();
    this.days.set(days);
    this.syncTemplateDateSelection();

    this.costCenterService.getAvailableCostCenters().subscribe(costCenters => {
      this.costCenters.set(costCenters.filter(costCenter => !costCenter.is_system));
      this.buildBookingRows();
    });

    this.costCenterService.getFavorites().subscribe(favorites => {
      this.favorites.set(favorites);
      this.buildBookingRows();
    });

    this.timeService.getTimeEntries(from, to).subscribe(entries => {
      this.applyTimeEntries(entries);
    });

    this.timeService.getTimeBookings(from, to).subscribe(bookings => {
      this.weekBookings.set(bookings);
      this.buildBookingRows();
    });

    this.absenceService.getMyAbsences().subscribe(absences => {
      this.absences.set(absences);
      this.applyAbsences(absences);
      this.syncTemplateDateSelection();
    });

    this.vacationService.getMyVacations().subscribe(vacations => {
      this.vacations.set(vacations);
      this.applyVacations(vacations);
      this.syncTemplateDateSelection();
    });

    this.loadTemplates();
  }

  private loadTemplates(): void {
    this.templateService.getTemplates().subscribe(templates => {
      this.templates.set(templates);
      this.syncTemplateSelection();
    });
  }

  private getWeekDates(): { from: string; to: string; days: DayData[] } {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + this.weekOffset() * 7);

    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const days: DayData[] = [];

    for (let index = 0; index < 7; index++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateString = date.toISOString().split('T')[0];
      const todayString = today.toISOString().split('T')[0];

      days.push({
        date: dateString,
        dayLabel: dayNames[date.getDay()],
        isToday: dateString === todayString,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        timeEntry: null,
        absence: null,
        vacation: null,
        isLocked: false,
        startTime: '',
        endTime: '',
        breakMinutes: 0,
      });
    }

    return { from: days[0].date, to: days[6].date, days };
  }

  private applyTimeEntries(entries: TimeEntry[]): void {
    this.days.update(days => days.map(day => {
      const entry = entries.find(item => item.date === day.date);
      return {
        ...day,
        timeEntry: entry ?? null,
        startTime: entry?.start_time ?? '',
        endTime: entry?.end_time ?? '',
        breakMinutes: entry?.break_minutes ?? 0,
      };
    }));
  }

  private applyAbsences(absences: Absence[]): void {
    this.days.update(days => days.map(day => {
      const absence = absences.find(entry =>
        entry.start_date <= day.date &&
        entry.end_date >= day.date &&
        ['acknowledged', 'approved', 'admin_created'].includes(entry.status)
      );

      return { ...day, absence: absence ?? null };
    }));
  }

  private applyVacations(vacations: Vacation[]): void {
    this.days.update(days => days.map(day => {
      const vacation = vacations.find(entry =>
        entry.start_date <= day.date &&
        entry.end_date >= day.date &&
        entry.status === 'approved'
      );

      return { ...day, vacation: vacation ?? null };
    }));
  }

  private buildBookingRows(): void {
    const favoriteIds = new Set(this.favorites().map(favorite => favorite.id));
    const allCostCenters = this.costCenters().filter(costCenter => !costCenter.is_system);
    const bookings = this.weekBookings();

    const favoriteRows: BookingRow[] = this.favorites()
      .filter(favorite => !favorite.is_system)
      .map(costCenter => ({
        costCenter,
        isFavorite: true,
        percentages: this.getPercentagesForCostCenter(costCenter.id, bookings),
      }));

    const otherRows: BookingRow[] = allCostCenters
      .filter(costCenter => !favoriteIds.has(costCenter.id))
      .map(costCenter => ({
        costCenter,
        isFavorite: false,
        percentages: this.getPercentagesForCostCenter(costCenter.id, bookings),
      }));

    this.bookingRows.set([...favoriteRows, ...otherRows]);
  }

  private getPercentagesForCostCenter(costCenterId: number, bookings: TimeBooking[]): { [date: string]: number | null } {
    const percentages: { [date: string]: number | null } = {};

    for (const booking of bookings) {
      if (booking.cost_center_id === costCenterId) {
        percentages[booking.date] = booking.percentage;
      }
    }

    return percentages;
  }

  private canEditBookingsForDay(day: DayData): boolean {
    return !day.isWeekend &&
      !day.isLocked &&
      !(day.absence && day.absence.scope === 'full_day') &&
      !(day.vacation && day.vacation.scope === 'full_day');
  }

  private syncTemplateDateSelection(): void {
    const availableDates = this.templateDays().map(day => day.date);

    if (availableDates.includes(this.selectedTemplateDate())) {
      return;
    }

    this.selectedTemplateDate.set(availableDates[0] ?? '');
  }

  private syncTemplateSelection(): void {
    const templateIds = this.templates().map(template => template.id);

    if (this.selectedTemplateId() !== null && templateIds.includes(this.selectedTemplateId()!)) {
      return;
    }

    this.selectedTemplateId.set(templateIds[0] ?? null);
  }

  private getTemplatePayloadForDate(date: string): { cost_center_id: number; percentage: number }[] {
    return this.bookingRows()
      .map(row => ({
        cost_center_id: row.costCenter.id,
        percentage: row.percentages[date] ?? 0,
      }))
      .filter(item => item.percentage > 0);
  }

  private getSelectedTemplate(): TimeBookingTemplate | undefined {
    return this.templates().find(template => template.id === this.selectedTemplateId());
  }
}
