import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TimeTrackingService } from '../../core/services/time-tracking.service';
import { CostCenterService } from '../../core/services/cost-center.service';
import { AbsenceService } from '../../core/services/absence.service';
import { TimeEntry } from '../../core/models/time-entry.model';
import { TimeBooking } from '../../core/models/time-booking.model';
import { CostCenter } from '../../core/models/cost-center.model';
import { Absence } from '../../core/models/absence.model';

interface DayData {
  date: string;
  dayLabel: string;
  isToday: boolean;
  isWeekend: boolean;
  timeEntry: TimeEntry | null;
  bookings: TimeBooking[];
  absence: Absence | null;
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
    MatButtonModule, MatIconModule, MatCardModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatTooltipModule, MatChipsModule, MatSnackBarModule,
    FormsModule, DatePipe, TranslateModule,
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
        <!-- Header row -->
        <div class="grid-header">
          <div class="label-col">{{ 'time_tracking.cost_center' | translate }}</div>
          @for (day of days(); track day.date) {
            <div class="day-col" [class.today]="day.isToday" [class.weekend]="day.isWeekend" [class.locked]="day.isLocked || day.absence">
              <div class="day-name">{{ day.dayLabel }}</div>
              <div class="day-date">{{ day.date | date:'dd.MM.' }}</div>
            </div>
          }
        </div>

        <!-- Time entry row -->
        <div class="grid-row time-row">
          <div class="label-col">
            <mat-icon>schedule</mat-icon>
            {{ 'time_tracking.hours' | translate }}
          </div>
          @for (day of days(); track day.date) {
            <div class="day-col" [class.today]="day.isToday" [class.weekend]="day.isWeekend" [class.locked]="day.isLocked">
              @if (day.absence && day.absence.scope === 'full_day') {
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

        <!-- Booking rows per cost center -->
        @for (row of bookingRows(); track row.costCenter.id) {
          <div class="grid-row" [class.favorite-row]="row.isFavorite">
            <div class="label-col cost-center-label">
              @if (row.isFavorite) {
                <mat-icon class="fav-icon">star</mat-icon>
              }
              <span class="cc-name" [matTooltip]="row.costCenter.code">{{ row.costCenter.name }}</span>
            </div>
            @for (day of days(); track day.date) {
              <div class="day-col" [class.today]="day.isToday" [class.weekend]="day.isWeekend" [class.locked]="day.isLocked || (day.absence && day.absence.scope === 'full_day')">
                @if (!day.isWeekend && !(day.absence && day.absence.scope === 'full_day')) {
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

        <!-- Total row -->
        <div class="grid-row total-row">
          <div class="label-col"><strong>{{ 'time_tracking.total' | translate }}</strong></div>
          @for (day of days(); track day.date) {
            <div class="day-col" [class.today]="day.isToday" [class.weekend]="day.isWeekend"
                 [class.total-ok]="getDayTotal(day.date) === 100"
                 [class.total-warn]="getDayTotal(day.date) > 0 && getDayTotal(day.date) !== 100 && !(day.absence && day.absence.scope === 'full_day')">
              @if (!day.isWeekend) {
                <strong>{{ getDayTotal(day.date) }}%</strong>
              }
            </div>
          }
        </div>

        <!-- Weekly summary row -->
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

      <!-- Action buttons -->
      <div class="actions">
        <button mat-stroked-button (click)="copyPreviousWeek()" [matTooltip]="'time_tracking.copy_prev_week' | translate">
          <mat-icon>content_copy</mat-icon>
          {{ 'time_tracking.copy_prev_week' | translate }}
        </button>
        <button mat-raised-button color="primary" (click)="saveAll()">
          <mat-icon>save</mat-icon>
          {{ 'time_tracking.save_all' | translate }}
        </button>
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
      color: rgba(0,0,0,0.54);
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
      color: rgba(0,0,0,0.38);
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
      color: rgba(0,0,0,0.54);
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
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 12px 8px;
    }
  `],
})
export class TimeTrackingComponent implements OnInit {
  private timeService = inject(TimeTrackingService);
  private costCenterService = inject(CostCenterService);
  private absenceService = inject(AbsenceService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  private weekOffset = signal(0);
  days = signal<DayData[]>([]);
  costCenters = signal<CostCenter[]>([]);
  favorites = signal<CostCenter[]>([]);
  absences = signal<Absence[]>([]);
  bookingRows = signal<BookingRow[]>([]);
  private targetMinutesPerDay = signal(480); // default 8h

  weekLabel = computed(() => {
    const d = this.days();
    if (d.length === 0) return '';
    return `${d[0].date} — ${d[d.length - 1].date}`;
  });

  weekActual = computed(() => {
    const total = this.days().reduce((sum, day) => {
      return sum + (day.timeEntry?.net_working_minutes ?? 0);
    }, 0);
    return this.formatMinutes(total);
  });

  weekTarget = computed(() => {
    const workDays = this.days().filter(d => !d.isWeekend).length;
    return this.formatMinutes(workDays * this.targetMinutesPerDay());
  });

  weekDeltaMinutes = computed(() => {
    const actual = this.days().reduce((sum, day) => sum + (day.timeEntry?.net_working_minutes ?? 0), 0);
    const workDays = this.days().filter(d => !d.isWeekend).length;
    return actual - workDays * this.targetMinutesPerDay();
  });

  weekDelta = computed(() => {
    const delta = this.weekDeltaMinutes();
    const sign = delta >= 0 ? '+' : '';
    return sign + this.formatMinutes(Math.abs(delta));
  });

  ngOnInit(): void {
    this.loadWeek();
  }

  navigateWeek(direction: number): void {
    this.weekOffset.update(v => v + direction);
    this.loadWeek();
  }

  goToToday(): void {
    this.weekOffset.set(0);
    this.loadWeek();
  }

  private loadWeek(): void {
    const { from, to, days } = this.getWeekDates();
    this.days.set(days);

    this.costCenterService.getAvailableCostCenters().subscribe(ccs => {
      this.costCenters.set(ccs.filter(cc => !cc.is_system));
    });

    this.costCenterService.getFavorites().subscribe(favs => {
      this.favorites.set(favs);
      this.buildBookingRows();
    });

    this.timeService.getTimeEntries(from, to).subscribe(entries => {
      this.applyTimeEntries(entries);
    });

    this.timeService.getTimeBookings(from, to).subscribe(bookings => {
      this.applyBookings(bookings);
    });

    this.absenceService.getMyAbsences().subscribe(abs => {
      this.absences.set(abs);
      this.applyAbsences(abs);
    });
  }

  private getWeekDates(): { from: string; to: string; days: DayData[] } {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + this.weekOffset() * 7);

    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const days: DayData[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        dayLabel: dayNames[d.getDay()],
        isToday: dateStr === todayStr,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        timeEntry: null,
        bookings: [],
        absence: null,
        isLocked: false,
        startTime: '',
        endTime: '',
        breakMinutes: 0,
      });
    }

    return { from: days[0].date, to: days[6].date, days };
  }

  private applyTimeEntries(entries: TimeEntry[]): void {
    this.days.update(days => {
      return days.map(day => {
        const entry = entries.find(e => e.date === day.date);
        return {
          ...day,
          timeEntry: entry ?? null,
          startTime: entry?.start_time ?? '',
          endTime: entry?.end_time ?? '',
          breakMinutes: entry?.break_minutes ?? 0,
        };
      });
    });
  }

  private applyBookings(bookings: TimeBooking[]): void {
    const rows = this.bookingRows();
    const updated = rows.map(row => {
      const pcts = { ...row.percentages };
      for (const b of bookings) {
        if (b.cost_center_id === row.costCenter.id) {
          pcts[b.date] = b.percentage;
        }
      }
      return { ...row, percentages: pcts };
    });
    this.bookingRows.set(updated);
  }

  private applyAbsences(absences: Absence[]): void {
    this.days.update(days => {
      return days.map(day => {
        const absence = absences.find(a =>
          a.start_date <= day.date && a.end_date >= day.date &&
          ['acknowledged', 'approved', 'admin_created'].includes(a.status)
        );
        return { ...day, absence: absence ?? null };
      });
    });
  }

  private buildBookingRows(): void {
    const favIds = new Set(this.favorites().map(f => f.id));
    const allCCs = this.costCenters().filter(cc => !cc.is_system);

    const favRows: BookingRow[] = this.favorites()
      .filter(f => !f.is_system)
      .map(cc => ({
        costCenter: cc,
        isFavorite: true,
        percentages: {},
      }));

    const otherRows: BookingRow[] = allCCs
      .filter(cc => !favIds.has(cc.id))
      .map(cc => ({
        costCenter: cc,
        isFavorite: false,
        percentages: {},
      }));

    this.bookingRows.set([...favRows, ...otherRows]);
  }

  onPercentageChange(row: BookingRow, date: string, value: number | null): void {
    this.bookingRows.update(rows => {
      return rows.map(r => {
        if (r.costCenter.id === row.costCenter.id) {
          return { ...r, percentages: { ...r.percentages, [date]: value } };
        }
        return r;
      });
    });
  }

  getDayTotal(date: string): number {
    return this.bookingRows().reduce((sum, row) => sum + (row.percentages[date] ?? 0), 0);
  }

  saveTimeEntry(day: DayData): void {
    if (!day.startTime || !day.endTime) return;

    this.timeService.saveTimeEntry(day.date, {
      start_time: day.startTime,
      end_time: day.endTime,
      break_minutes: day.breakMinutes || 0,
    }).subscribe(entry => {
      this.days.update(days => days.map(d =>
        d.date === day.date ? { ...d, timeEntry: entry } : d
      ));
    });
  }

  saveAll(): void {
    const days = this.days().filter(d => !d.isWeekend && !(d.absence && d.absence.scope === 'full_day'));
    let pending = 0;
    let completed = 0;

    for (const day of days) {
      const bookings = this.bookingRows()
        .filter(r => (r.percentages[day.date] ?? 0) > 0)
        .map(r => ({
          cost_center_id: r.costCenter.id,
          percentage: r.percentages[day.date]!,
        }));

      if (bookings.length === 0) continue;
      const total = bookings.reduce((s, b) => s + b.percentage, 0);
      if (total !== 100) continue;

      pending++;
      this.timeService.saveTimeBookings(day.date, bookings).subscribe({
        next: () => {
          completed++;
          if (completed === pending) {
            this.snackBar.open(
              this.translate.instant('time_tracking.saved'),
              this.translate.instant('common.ok'),
              { duration: 3000 }
            );
          }
        },
        error: () => {
          this.snackBar.open(
            this.translate.instant('time_tracking.save_error'),
            this.translate.instant('common.ok'),
            { duration: 3000 }
          );
        },
      });
    }

    if (pending === 0) {
      this.snackBar.open(
        this.translate.instant('time_tracking.nothing_to_save'),
        this.translate.instant('common.ok'),
        { duration: 3000 }
      );
    }
  }

  copyPreviousWeek(): void {
    const prevFrom = new Date(this.days()[0].date);
    prevFrom.setDate(prevFrom.getDate() - 7);
    const prevTo = new Date(this.days()[6].date);
    prevTo.setDate(prevTo.getDate() - 7);

    this.timeService.getTimeBookings(
      prevFrom.toISOString().split('T')[0],
      prevTo.toISOString().split('T')[0]
    ).subscribe(prevBookings => {
      this.bookingRows.update(rows => {
        return rows.map(row => {
          const pcts = { ...row.percentages };
          for (let i = 0; i < 7; i++) {
            const prevDate = new Date(prevFrom);
            prevDate.setDate(prevFrom.getDate() + i);
            const prevDateStr = prevDate.toISOString().split('T')[0];
            const currentDate = this.days()[i].date;

            const prevBooking = prevBookings.find(
              b => b.date === prevDateStr && b.cost_center_id === row.costCenter.id
            );
            if (prevBooking) {
              pcts[currentDate] = prevBooking.percentage;
            }
          }
          return { ...row, percentages: pcts };
        });
      });

      this.snackBar.open(
        this.translate.instant('time_tracking.copied'),
        this.translate.instant('common.ok'),
        { duration: 2000 }
      );
    });
  }

  formatMinutes(minutes: number): string {
    const h = Math.floor(Math.abs(minutes) / 60);
    const m = Math.abs(minutes) % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  }
}
