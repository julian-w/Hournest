import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HolidayService } from '../../../core/services/holiday.service';
import { Holiday, HolidayInstance } from '../../../core/models/holiday.model';
import { HolidayDialogComponent } from './holiday-dialog.component';
import { HolidayDateDialogComponent } from './holiday-date-dialog.component';

@Component({
  selector: 'app-admin-holidays',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatSelectModule, MatChipsModule, MatDialogModule, MatSnackBarModule,
    MatTooltipModule, DatePipe, TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h2>{{ 'admin_holidays.title' | translate }}</h2>
      <div class="header-actions">
        <mat-select [value]="selectedYear()" (selectionChange)="onYearChange($event.value)" class="year-select">
          @for (y of availableYears; track y) {
            <mat-option [value]="y">{{ y }}</mat-option>
          }
        </mat-select>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          {{ 'admin_holidays.add' | translate }}
        </button>
      </div>
    </div>

    <div class="status-banner" [class.confirmed]="allConfirmed()" [class.pending]="!allConfirmed()">
      <mat-icon>{{ allConfirmed() ? 'check_circle' : 'warning' }}</mat-icon>
      @if (allConfirmed()) {
        <span>{{ 'admin_holidays.all_confirmed' | translate:{ year: selectedYear() } }}</span>
      } @else {
        <span>{{ 'admin_holidays.not_all_confirmed' | translate:{ count: pendingCount(), year: selectedYear() } }}</span>
        <span class="hint">{{ 'admin_holidays.confirm_hint' | translate }}</span>
      }
    </div>

    <mat-card>
      <table mat-table [dataSource]="instances()">
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let h">
            <mat-icon [class.status-ok]="h.confirmed" [class.status-missing]="!h.confirmed">
              {{ h.confirmed ? 'check_circle' : 'error' }}
            </mat-icon>
          </td>
        </ng-container>

        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_holidays.name' | translate }}</th>
          <td mat-cell *matCellDef="let h">{{ h.name }}</td>
        </ng-container>

        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_holidays.date' | translate }}</th>
          <td mat-cell *matCellDef="let h" [class.date-missing]="!h.confirmed">
            @if (h.date) {
              {{ h.date | date:'mediumDate' }}
            } @else {
              <em>{{ 'admin_holidays.status_pending' | translate }}</em>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_holidays.type' | translate }}</th>
          <td mat-cell *matCellDef="let h">
            {{ h.type === 'fixed' ? ('admin_holidays.type_fixed' | translate) : ('admin_holidays.type_variable' | translate) }}
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let h">
            @if (h.type === 'variable') {
              <button mat-icon-button color="primary"
                      [matTooltip]="'admin_holidays.edit' | translate"
                      (click)="openDateDialog(h)">
                <mat-icon>edit_calendar</mat-icon>
              </button>
            }
            <button mat-icon-button
                    [matTooltip]="'admin_holidays.edit' | translate"
                    (click)="openEditDialog(h)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn"
                    [matTooltip]="'admin_holidays.delete' | translate"
                    (click)="deleteHoliday(h)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"
            [class.row-pending]="!row.confirmed"></tr>
      </table>

      @if (instances().length === 0) {
        <div class="empty-state">
          <mat-icon>event</mat-icon>
          <p>{{ 'admin_holidays.no_holidays' | translate }}</p>
        </div>
      }
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
    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .year-select {
      width: 100px;
    }
    .status-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .status-banner.confirmed {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    .status-banner.pending {
      background-color: #fff3e0;
      color: #e65100;
    }
    .status-banner .hint {
      font-size: 12px;
      opacity: 0.8;
      width: 100%;
      margin-left: 32px;
    }
    table { width: 100%; }
    .status-ok { color: #4caf50; }
    .status-missing { color: #f44336; }
    .date-missing { color: #f44336; font-style: italic; }
    .row-pending { background-color: #fff8e1; }
    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: rgba(0, 0, 0, 0.38);
    }
    .empty-state mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
    }
  `],
})
export class AdminHolidaysComponent implements OnInit {
  private holidayService = inject(HolidayService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  instances = signal<HolidayInstance[]>([]);
  selectedYear = signal(new Date().getFullYear());
  displayedColumns = ['status', 'name', 'date', 'type', 'actions'];
  availableYears: number[] = [];

  allConfirmed = computed(() => {
    const list = this.instances();
    return list.length > 0 && list.every(i => i.confirmed);
  });

  pendingCount = computed(() => this.instances().filter(i => !i.confirmed).length);

  constructor() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 1; y <= currentYear + 2; y++) {
      this.availableYears.push(y);
    }
  }

  ngOnInit(): void {
    this.loadInstances();
  }

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.loadInstances();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(HolidayDialogComponent, {
      width: '400px',
      data: { year: this.selectedYear() },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadInstances();
    });
  }

  openEditDialog(instance: HolidayInstance): void {
    // Find the base holiday to pass to the edit dialog
    this.holidayService.getHolidays().subscribe(holidays => {
      const holiday = holidays.find(h => h.id === instance.holiday_id);
      if (holiday) {
        const dialogRef = this.dialog.open(HolidayDialogComponent, {
          width: '400px',
          data: { holiday, year: this.selectedYear() },
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result) this.loadInstances();
        });
      }
    });
  }

  openDateDialog(instance: HolidayInstance): void {
    const dialogRef = this.dialog.open(HolidayDateDialogComponent, {
      width: '400px',
      data: {
        holidayId: instance.holiday_id,
        name: instance.name,
        year: instance.year,
        currentDate: instance.date,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadInstances();
    });
  }

  deleteHoliday(instance: HolidayInstance): void {
    this.holidayService.deleteHoliday(instance.holiday_id).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('admin_holidays.deleted'),
          this.translate.instant('common.ok'),
          { duration: 3000 }
        );
        this.loadInstances();
      },
    });
  }

  private loadInstances(): void {
    this.holidayService.getHolidayInstances(this.selectedYear()).subscribe(instances => {
      this.instances.set(instances);
    });
  }
}
