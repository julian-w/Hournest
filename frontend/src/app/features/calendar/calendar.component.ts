import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { VacationService } from '../../core/services/vacation.service';
import { HolidayService } from '../../core/services/holiday.service';
import { Vacation } from '../../core/models/vacation.model';
import { Holiday } from '../../core/models/holiday.model';

interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  vacations: Vacation[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule, TranslateModule],
  template: `
    <div class="calendar-header">
      <button mat-icon-button (click)="previousMonth()">
        <mat-icon>chevron_left</mat-icon>
      </button>
      <h2>{{ monthName() }} {{ year() }}</h2>
      <button mat-icon-button (click)="nextMonth()">
        <mat-icon>chevron_right</mat-icon>
      </button>
      <button mat-stroked-button (click)="goToToday()">{{ 'calendar.today' | translate }}</button>
    </div>

    <div class="calendar-info">
      <mat-icon>info</mat-icon>
      <span>{{ visibilityHintKey() | translate }}</span>
    </div>

    <mat-card class="calendar-card">
      <div class="calendar-grid">
        <div class="weekday-header">{{ 'calendar.weekdays.mon' | translate }}</div>
        <div class="weekday-header">{{ 'calendar.weekdays.tue' | translate }}</div>
        <div class="weekday-header">{{ 'calendar.weekdays.wed' | translate }}</div>
        <div class="weekday-header">{{ 'calendar.weekdays.thu' | translate }}</div>
        <div class="weekday-header">{{ 'calendar.weekdays.fri' | translate }}</div>
        <div class="weekday-header weekend">{{ 'calendar.weekdays.sat' | translate }}</div>
        <div class="weekday-header weekend">{{ 'calendar.weekdays.sun' | translate }}</div>

        @for (day of calendarDays(); track day.date) {
          <div class="calendar-day"
               [class.other-month]="!day.isCurrentMonth"
               [class.today]="day.isToday"
               [class.weekend]="day.isWeekend"
               [class.holiday]="day.isHoliday">
            <span class="day-number">{{ day.dayOfMonth }}</span>
            @if (day.isHoliday) {
              <div class="holiday-label" [matTooltip]="day.holidayName || ''">
                {{ day.holidayName }}
              </div>
            }
            <div class="vacation-bars">
              @for (vacation of day.vacations; track vacation.id) {
                <div class="vacation-bar"
                     [class.vacation-pending]="vacation.status === 'pending'"
                     [style.background-color]="vacation.status === 'pending' ? '' : getColor(vacation.user_id)"
                     [matTooltip]="vacation.user_name || 'Unknown'">
                </div>
              }
            </div>
          </div>
        }
      </div>
    </mat-card>

    @if (legend().length > 0) {
      <div class="legend">
        @for (entry of legend(); track entry.userId) {
          <div class="legend-item">
            <span class="legend-color" [style.background-color]="getColor(entry.userId)"></span>
            {{ entry.name }}
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .calendar-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .calendar-header h2 {
      min-width: 200px;
      text-align: center;
      margin: 0;
    }
    .calendar-card {
      overflow: auto;
    }
    .calendar-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 10px 12px;
      border-radius: 12px;
      background-color: #fff8e1;
      color: #8d5a00;
      font-size: 14px;
    }
    .calendar-info mat-icon {
      color: #ff8f00;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background-color: #e0e0e0;
    }
    .weekday-header {
      background-color: #fff8e1;
      padding: 8px;
      text-align: center;
      font-weight: 500;
      font-size: 13px;
    }
    .weekday-header.weekend {
      color: rgba(0, 0, 0, 0.38);
    }
    .calendar-day {
      background-color: white;
      min-height: 80px;
      padding: 4px;
      position: relative;
    }
    .calendar-day.other-month {
      background-color: #fafafa;
      color: rgba(0, 0, 0, 0.3);
    }
    .calendar-day.weekend {
      background-color: #f5f5f5;
    }
    .calendar-day.holiday {
      background-color: #fff3e0;
    }
    .calendar-day.today {
      outline: 2px solid #ff8f00;
      outline-offset: -2px;
    }
    .day-number {
      font-size: 13px;
      font-weight: 500;
    }
    .holiday-label {
      font-size: 10px;
      color: #e65100;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .vacation-bars {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 4px;
    }
    .vacation-bar {
      height: 6px;
      border-radius: 3px;
      cursor: pointer;
    }
    .vacation-pending {
      background-color: #bdbdbd !important;
      background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(255,255,255,0.4) 2px,
        rgba(255,255,255,0.4) 4px
      );
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 16px;
      padding: 8px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
    }
    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    @media (max-width: 700px) {
      .calendar-header {
        flex-wrap: wrap;
      }
      .calendar-header h2 {
        min-width: 0;
        flex: 1 1 100%;
        order: -1;
      }
      .calendar-info {
        align-items: flex-start;
      }
    }
  `],
})
export class CalendarComponent implements OnInit {
  auth = inject(AuthService);
  private vacationService = inject(VacationService);
  private holidayService = inject(HolidayService);
  private vacations = signal<Vacation[]>([]);
  private holidays = signal<Holiday[]>([]);

  currentDate = signal(new Date());
  year = computed(() => this.currentDate().getFullYear());
  month = computed(() => this.currentDate().getMonth());
  monthName = computed(() => this.currentDate().toLocaleString('en', { month: 'long' }));

  private colors = ['#FF8F00', '#F4511E', '#7CB342', '#039BE5', '#8E24AA', '#D81B60', '#00897B', '#5E35B1', '#3949AB', '#C0CA33'];
  private userColorMap = new Map<number, string>();

  calendarDays = computed(() => {
    const year = this.year();
    const month = this.month();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: CalendarDay[] = [];
    const today = new Date();

    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(this.createDay(date, false, today));
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push(this.createDay(date, true, today));
    }

    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const date = new Date(year, month + 1, i);
        days.push(this.createDay(date, false, today));
      }
    }

    return days;
  });

  legend = computed(() => {
    const map = new Map<number, string>();
    this.vacations().forEach(v => {
      if (v.user_name && !map.has(v.user_id)) {
        map.set(v.user_id, v.user_name);
      }
    });
    return Array.from(map.entries()).map(([userId, name]) => ({ userId, name }));
  });

  visibilityHintKey = computed(() =>
    this.auth.isAdmin() ? 'calendar.visibility.admin' : 'calendar.visibility.employee'
  );

  ngOnInit(): void {
    this.loadVacations();
    this.loadHolidays();
  }

  previousMonth(): void {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    this.loadHolidays();
  }

  nextMonth(): void {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    this.loadHolidays();
  }

  goToToday(): void {
    this.currentDate.set(new Date());
    this.loadHolidays();
  }

  getColor(userId: number): string {
    if (!this.userColorMap.has(userId)) {
      this.userColorMap.set(userId, this.colors[this.userColorMap.size % this.colors.length]);
    }
    return this.userColorMap.get(userId)!;
  }

  private loadVacations(): void {
    this.vacationService.getTeamVacations().subscribe(vacations => {
      this.vacations.set(vacations);
    });
  }

  private loadHolidays(): void {
    this.holidayService.getHolidays(this.year()).subscribe(holidays => {
      this.holidays.set(holidays);
    });
  }

  private createDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
    const dateStr = this.toDateString(date);
    const dayOfWeek = date.getDay();
    const vacationsOnDay = this.vacations().filter(v =>
      dateStr >= v.start_date && dateStr <= v.end_date
    );

    const holiday = this.holidays().find(h => h.date === dateStr);

    return {
      date: dateStr,
      dayOfMonth: date.getDate(),
      isCurrentMonth,
      isToday: date.toDateString() === today.toDateString(),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isHoliday: !!holiday,
      holidayName: holiday ? holiday.name : null,
      vacations: vacationsOnDay,
    };
  }

  private toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
