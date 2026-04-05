import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MissingEntryReportRow, TimeBookingReportRow } from '../../../core/models/admin-report.model';
import { AbsenceReportRow } from '../../../core/models/absence-report.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h2>{{ 'admin_reports.title' | translate }}</h2>
    </div>

    <mat-card class="filter-card">
      <div class="filter-row">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_reports.from' | translate }}</mat-label>
          <input matInput type="date" [(ngModel)]="from">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_reports.to' | translate }}</mat-label>
          <input matInput type="date" [(ngModel)]="to">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'admin_reports.group_by' | translate }}</mat-label>
          <mat-select [(ngModel)]="groupBy">
            <mat-option value="user">{{ 'admin_reports.group_user' | translate }}</mat-option>
            <mat-option value="cost_center">{{ 'admin_reports.group_cost_center' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="button-row">
          <button mat-raised-button color="primary" (click)="loadReports()">
            <mat-icon>analytics</mat-icon>
            {{ 'admin_reports.load' | translate }}
          </button>
          <button mat-stroked-button (click)="exportCsv()">
            <mat-icon>download</mat-icon>
            {{ 'admin_reports.export_csv' | translate }}
          </button>
        </div>
      </div>
    </mat-card>

    <mat-card class="report-card">
      <div class="section-title">{{ 'admin_reports.time_booking_summary' | translate }}</div>
      <table mat-table [dataSource]="timeBookingRows()">
        <ng-container matColumnDef="label">
          <th mat-header-cell *matHeaderCellDef>{{ summaryLabelHeader() | translate }}</th>
          <td mat-cell *matCellDef="let row">{{ row.label }}</td>
        </ng-container>

        <ng-container matColumnDef="code">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_reports.code' | translate }}</th>
          <td mat-cell *matCellDef="let row">{{ row.code || '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="percentage_points">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_reports.percentage_points' | translate }}</th>
          <td mat-cell *matCellDef="let row">{{ row.percentage_points }}</td>
        </ng-container>

        <ng-container matColumnDef="booked_minutes">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_reports.booked_minutes' | translate }}</th>
          <td mat-cell *matCellDef="let row">{{ row.booked_minutes }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="summaryColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: summaryColumns;"></tr>
      </table>

      @if (timeBookingRows().length === 0) {
        <div class="empty-state">{{ 'admin_reports.no_summary' | translate }}</div>
      }
    </mat-card>

    <mat-card class="report-card">
      <div class="section-title">{{ 'admin_reports.missing_entries' | translate }}</div>
      <table mat-table [dataSource]="missingEntries()">
        <ng-container matColumnDef="user_name">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_reports.employee' | translate }}</th>
          <td mat-cell *matCellDef="let row">{{ row.user_name }}</td>
        </ng-container>

        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_reports.date' | translate }}</th>
          <td mat-cell *matCellDef="let row">{{ row.date | date:'mediumDate' }}</td>
        </ng-container>

        <ng-container matColumnDef="reason">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_reports.reason' | translate }}</th>
          <td mat-cell *matCellDef="let row">{{ ('admin_reports.reason_' + row.reason) | translate }}</td>
        </ng-container>

        <ng-container matColumnDef="expected_percentage">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_reports.expected' | translate }}</th>
          <td mat-cell *matCellDef="let row">{{ row.expected_percentage }}%</td>
        </ng-container>

        <ng-container matColumnDef="actual_percentage">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_reports.actual' | translate }}</th>
          <td mat-cell *matCellDef="let row">{{ row.actual_percentage }}%</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="missingColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: missingColumns;"></tr>
      </table>

      @if (missingEntries().length === 0) {
        <div class="empty-state">{{ 'admin_reports.no_missing_entries' | translate }}</div>
      }
    </mat-card>
  `,
  styles: [`
    .page-header {
      margin-bottom: 16px;
    }
    .filter-card,
    .report-card {
      margin-bottom: 16px;
    }
    .filter-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .button-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .section-title {
      font-weight: 600;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
    }
    .empty-state {
      padding: 16px 0 4px;
      color: rgba(0, 0, 0, 0.54);
    }
  `],
})
export class AdminReportsComponent implements OnInit {
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  from = this.getDefaultFrom();
  to = this.getDefaultTo();
  groupBy: 'user' | 'cost_center' = 'user';

  timeBookingRows = signal<TimeBookingReportRow[]>([]);
  missingEntries = signal<MissingEntryReportRow[]>([]);
  absences = signal<AbsenceReportRow[]>([]);
  summaryColumns = ['label', 'code', 'percentage_points', 'booked_minutes'];
  missingColumns = ['user_name', 'date', 'reason', 'expected_percentage', 'actual_percentage'];

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.adminService.getTimeBookingReport(this.from, this.to, this.groupBy).subscribe(rows => {
      this.timeBookingRows.set(rows);
    });

    this.adminService.getMissingEntriesReport(this.from, this.to).subscribe(rows => {
      this.missingEntries.set(rows);
    });

    this.adminService.getAbsenceReport(this.from, this.to).subscribe(rows => {
      this.absences.set(rows);
    });
  }

  exportCsv(): void {
    this.adminService.exportTimeBookingsCsv(this.from, this.to).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `time-bookings-${this.from}-to-${this.to}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);

      this.snackBar.open(
        this.translate.instant('admin_reports.export_started'),
        this.translate.instant('common.ok'),
        { duration: 2500 },
      );
    });
  }

  summaryLabelHeader(): string {
    return this.groupBy === 'cost_center' ? 'admin_reports.cost_center' : 'admin_reports.employee';
  }

  private getDefaultFrom(): string {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return first.toISOString().split('T')[0];
  }

  private getDefaultTo(): string {
    return new Date().toISOString().split('T')[0];
  }
}
