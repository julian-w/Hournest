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
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Absence } from '../../core/models/absence.model';
import { BlackoutPeriod } from '../../core/models/blackout-period.model';
import { CostCenter } from '../../core/models/cost-center.model';
import { TimeBookingTemplate } from '../../core/models/time-booking-template.model';
import { TimeBooking } from '../../core/models/time-booking.model';
import { TimeEntry } from '../../core/models/time-entry.model';
import { Vacation } from '../../core/models/vacation.model';
import { WorkTimeAccountEntry } from '../../core/models/work-time-account-entry.model';
import { AbsenceService } from '../../core/services/absence.service';
import { BlackoutService } from '../../core/services/blackout.service';
import { CostCenterService } from '../../core/services/cost-center.service';
import { TimeBookingTemplateService } from '../../core/services/time-booking-template.service';
import { TimeTrackingService } from '../../core/services/time-tracking.service';
import { VacationService } from '../../core/services/vacation.service';
import { SettingsService } from '../../core/services/settings.service';
import { WorkScheduleService } from '../../core/services/work-schedule.service';
import { WorkTimeAccountService } from '../../core/services/work-time-account.service';
import { TimeBookingTemplateDialogComponent } from './time-booking-template-dialog.component';

interface DayData {
  date: string;
  dayLabel: string;
  isToday: boolean;
  isWeekend: boolean;
  timeEntry: TimeEntry | null;
  absence: Absence | null;
  vacation: Vacation | null;
  companyHoliday: BlackoutPeriod | null;
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
    MatTableModule,
    MatTooltipModule,
    MatExpansionModule,
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
            <div class="day-col" [class.today]="day.isToday" [class.weekend]="day.isWeekend" [class.locked]="day.isLocked || day.absence || day.vacation || day.companyHoliday">
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
              @if (day.companyHoliday) {
                <div class="absence-badge">
                  <mat-chip class="absence-chip">
                    {{ 'time_tracking.absence_company_holiday' | translate }}
                  </mat-chip>
                </div>
              } @else if (day.vacation && day.vacation.scope === 'full_day') {
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
              <div class="day-col" [class.today]="day.isToday" [class.weekend]="day.isWeekend" [class.locked]="day.isLocked || (day.absence && day.absence.scope === 'full_day') || (day.vacation && day.vacation.scope === 'full_day') || day.companyHoliday">
                @if (!day.isWeekend && !(day.absence && day.absence.scope === 'full_day') && !(day.vacation && day.vacation.scope === 'full_day') && !day.companyHoliday) {
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
                 [class.total-warn]="getDayTotal(day.date) > 0 && getDayTotal(day.date) !== expectedDayTotal(day) && !(day.absence && day.absence.scope === 'full_day') && !(day.vacation && day.vacation.scope === 'full_day') && !day.companyHoliday">
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

    <mat-expansion-panel class="ledger-panel">
      <mat-expansion-panel-header>
        <mat-panel-title>
          <mat-icon>query_stats</mat-icon>
          {{ 'time_tracking.account.title' | translate }}
        </mat-panel-title>
      </mat-expansion-panel-header>

      <div class="ledger-toolbar">
        <mat-form-field appearance="outline" class="ledger-year-field">
          <mat-label>{{ 'time_tracking.account.year' | translate }}</mat-label>
          <mat-select [ngModel]="selectedLedgerYear()" (ngModelChange)="onLedgerYearChange($event)">
            @for (year of ledgerYears; track year) {
              <mat-option [value]="year">{{ year }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="ledger-balance">
          <strong>{{ 'time_tracking.account.balance' | translate }}:</strong>
          <span [class.positive]="currentLedgerBalance() > 0" [class.negative]="currentLedgerBalance() < 0">
            {{ formatSignedMinutes(currentLedgerBalance()) }}
          </span>
        </div>
      </div>

      <table mat-table [dataSource]="workTimeLedger()" class="ledger-table">
        <ng-container matColumnDef="effective_date">
          <th mat-header-cell *matHeaderCellDef>{{ 'time_tracking.account.date' | translate }}</th>
          <td mat-cell *matCellDef="let entry">{{ entry.effective_date | date:'mediumDate' }}</td>
        </ng-container>

        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>{{ 'time_tracking.account.type' | translate }}</th>
          <td mat-cell *matCellDef="let entry">{{ 'time_tracking.account.type_' + entry.type | translate }}</td>
        </ng-container>

        <ng-container matColumnDef="minutes_delta">
          <th mat-header-cell *matHeaderCellDef>{{ 'time_tracking.account.change' | translate }}</th>
          <td mat-cell *matCellDef="let entry" [class.positive]="entry.minutes_delta > 0" [class.negative]="entry.minutes_delta < 0">
            {{ formatSignedMinutes(entry.minutes_delta) }}
          </td>
        </ng-container>

        <ng-container matColumnDef="balance_after">
          <th mat-header-cell *matHeaderCellDef>{{ 'time_tracking.account.balance_after' | translate }}</th>
          <td mat-cell *matCellDef="let entry">{{ formatSignedMinutes(entry.balance_after) }}</td>
        </ng-container>

        <ng-container matColumnDef="comment">
          <th mat-header-cell *matHeaderCellDef>{{ 'time_tracking.account.comment' | translate }}</th>
          <td mat-cell *matCellDef="let entry">{{ entry.comment || '—' }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="ledgerColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: ledgerColumns;"></tr>
      </table>

      @if (workTimeLedger().length === 0) {
        <div class="empty-state">{{ 'time_tracking.account.empty' | translate }}</div>
      }
    </mat-expansion-panel>
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
      flex-direction: column;
      gap: 4px;
      align-items: stretch;
    }
    .time-input {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      text-align: center;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 4px;
      font-size: 12px;
    }
    .time-sep {
      display: none;
    }
    .break-input {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      text-align: center;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 4px;
      font-size: 11px;
      margin-left: 0;
    }
    .net-hours {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.54);
      margin-top: 6px;
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
    .ledger-panel {
      margin-top: 24px;
    }
    .ledger-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .ledger-year-field {
      width: 140px;
      margin-bottom: -1.25em;
    }
    .ledger-balance {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .ledger-table {
      width: 100%;
    }
    .empty-state {
      padding: 16px 0 4px;
      color: rgba(0, 0, 0, 0.54);
    }
    @media (max-width: 1200px) {
      .day-col {
        min-width: 112px;
      }
    }
    @media (max-width: 700px) {
      .page-header {
        align-items: stretch;
      }
      .week-nav {
        justify-content: space-between;
        width: 100%;
      }
      .week-label {
        min-width: 0;
        flex: 1;
        font-size: 13px;
      }
      .grid-container {
        min-width: 700px;
      }
      .label-col {
        width: 140px;
        min-width: 140px;
        padding: 8px;
      }
      .day-col {
        min-width: 80px;
        padding: 6px;
      }
      .time-input {
        padding: 3px;
        font-size: 11px;
      }
      .break-input {
        padding: 3px;
        font-size: 10px;
      }
      .pct-input {
        width: 42px;
        padding: 5px 3px;
        font-size: 12px;
      }
      .actions {
        padding: 12px 8px 8px;
      }
      .template-field {
        width: 100%;
      }
    }
  `],
})
export class TimeTrackingComponent implements OnInit {
  private timeService = inject(TimeTrackingService);
  private templateService = inject(TimeBookingTemplateService);
  private costCenterService = inject(CostCenterService);
  private absenceService = inject(AbsenceService);
  private blackoutService = inject(BlackoutService);
  private vacationService = inject(VacationService);
  private settingsService = inject(SettingsService);
  private workScheduleService = inject(WorkScheduleService);
  private workTimeAccountService = inject(WorkTimeAccountService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  private weekOffset = signal(0);
  private targetMinutesPerDay = signal(480);
  private defaultWeeklyTargetMinutes = signal(2400);
  private weekBookings = signal<TimeBooking[]>([]);
  private workSchedules = signal<{ start_date: string; end_date: string | null; work_days: number[]; weekly_target_minutes: number }[]>([]);

  days = signal<DayData[]>([]);
  costCenters = signal<CostCenter[]>([]);
  favorites = signal<CostCenter[]>([]);
  absences = signal<Absence[]>([]);
  companyHolidays = signal<BlackoutPeriod[]>([]);
  vacations = signal<Vacation[]>([]);
  templates = signal<TimeBookingTemplate[]>([]);
  bookingRows = signal<BookingRow[]>([]);
  workTimeLedger = signal<WorkTimeAccountEntry[]>([]);
  selectedTemplateDate = signal('');
  selectedTemplateId = signal<number | null>(null);
  selectedLedgerYear = signal(new Date().getFullYear());
  ledgerColumns = ['effective_date', 'type', 'minutes_delta', 'balance_after', 'comment'];
  ledgerYears: number[] = [];

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
    const total = this.days().reduce((sum, day) => sum + this.getDayTargetMinutes(day), 0);
    return this.formatMinutes(total);
  });

  weekDeltaMinutes = computed(() => {
    const actual = this.days().reduce((sum, day) => sum + (day.timeEntry?.net_working_minutes ?? 0), 0);
    const target = this.days().reduce((sum, day) => sum + this.getDayTargetMinutes(day), 0);
    return actual - target;
  });

  weekDelta = computed(() => {
    const delta = this.weekDeltaMinutes();
    const sign = delta > 0 ? '+' : delta < 0 ? '-' : '';
    return sign + this.formatMinutes(Math.abs(delta));
  });

  templateDays = computed(() => this.days().filter(day => this.canEditBookingsForDay(day)));
  currentLedgerBalance = computed(() => {
    const entries = this.workTimeLedger();
    return entries.length > 0 ? entries[entries.length - 1].balance_after : 0;
  });

  constructor() {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      this.ledgerYears.push(year);
    }
  }

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

  onLedgerYearChange(year: number): void {
    this.selectedLedgerYear.set(year);
    this.loadWorkTimeLedger();
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
      this.loadWorkTimeLedger();
    });
  }

  saveAll(): void {
    const days = this.days().filter(day =>
      !day.isWeekend &&
      !(day.absence && day.absence.scope === 'full_day') &&
      !(day.vacation && day.vacation.scope === 'full_day') &&
      !day.companyHoliday
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
      this.toLocalIsoDate(prevFrom),
      this.toLocalIsoDate(prevTo),
    ).subscribe(previousBookings => {
      this.bookingRows.update(rows => rows.map(row => {
        const percentages = { ...row.percentages };
        for (let index = 0; index < 7; index++) {
          const previousDate = new Date(prevFrom);
          previousDate.setDate(prevFrom.getDate() + index);
          const previousDateString = this.toLocalIsoDate(previousDate);
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
      this.toLocalIsoDate(searchFrom),
      this.toLocalIsoDate(searchTo),
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

  formatSignedMinutes(minutes: number): string {
    const sign = minutes > 0 ? '+' : minutes < 0 ? '-' : '';
    return sign + this.formatMinutes(minutes);
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

    this.settingsService.getPublicSettings().subscribe(settings => {
      const defaultWeeklyTarget = settings.find(setting => setting.key === 'default_weekly_target_minutes')?.value;
      this.defaultWeeklyTargetMinutes.set(defaultWeeklyTarget ? parseInt(defaultWeeklyTarget, 10) || 2400 : 2400);
    });

    this.workScheduleService.getMyWorkSchedules().subscribe(schedules => {
      this.workSchedules.set(schedules);
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

    this.blackoutService.getMatchingBlackouts(from, to).subscribe(blackouts => {
      const companyHolidays = blackouts.filter(blackout => blackout.type === 'company_holiday');
      this.companyHolidays.set(companyHolidays);
      this.applyCompanyHolidays(companyHolidays);
      this.syncTemplateDateSelection();
    });

    this.loadTemplates();
    this.loadWorkTimeLedger();
  }

  private loadTemplates(): void {
    this.templateService.getTemplates().subscribe(templates => {
      this.templates.set(templates);
      this.syncTemplateSelection();
    });
  }

  private loadWorkTimeLedger(): void {
    this.workTimeAccountService.getMyLedger(this.selectedLedgerYear()).subscribe(entries => {
      this.workTimeLedger.set(entries);
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
      const dateString = this.toLocalIsoDate(date);
      const todayString = this.toLocalIsoDate(today);

      days.push({
        date: dateString,
        dayLabel: dayNames[date.getDay()],
        isToday: dateString === todayString,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        timeEntry: null,
        absence: null,
        vacation: null,
        companyHoliday: null,
        isLocked: false,
        startTime: '',
        endTime: '',
        breakMinutes: 0,
      });
    }

    return { from: days[0].date, to: days[6].date, days };
  }

  private toLocalIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  private applyCompanyHolidays(blackouts: BlackoutPeriod[]): void {
    this.days.update(days => days.map(day => {
      const blackout = blackouts.find(entry =>
        entry.start_date <= day.date &&
        entry.end_date >= day.date
      );

      return { ...day, companyHoliday: blackout ?? null };
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
      !(day.vacation && day.vacation.scope === 'full_day') &&
      !day.companyHoliday;
  }

  private getDayTargetMinutes(day: DayData): number {
    const dailyTarget = this.getConfiguredDailyTargetMinutes(day.date);
    const daySchedule = this.getScheduleForDate(day.date);

    if (day.isWeekend || day.companyHoliday) {
      return 0;
    }

    if (daySchedule) {
      const jsDay = new Date(`${day.date}T00:00:00`).getDay();
      if (!daySchedule.work_days.includes(jsDay)) {
        return 0;
      }
    }

    if ((day.absence && day.absence.scope === 'full_day') || (day.vacation && day.vacation.scope === 'full_day')) {
      return 0;
    }

    if ((day.absence && day.absence.scope !== 'full_day') || (day.vacation && day.vacation.scope !== 'full_day')) {
      return Math.round(dailyTarget / 2);
    }

    return dailyTarget;
  }

  private getConfiguredDailyTargetMinutes(date: string): number {
    const schedule = this.getScheduleForDate(date);

    if (schedule) {
      const workDaysCount = schedule.work_days.length || 1;
      return Math.round(schedule.weekly_target_minutes / workDaysCount);
    }

    return Math.round(this.defaultWeeklyTargetMinutes() / 5);
  }

  private getScheduleForDate(date: string) {
    return this.workSchedules().find(entry =>
      entry.start_date <= date && (!entry.end_date || entry.end_date >= date)
    );
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
