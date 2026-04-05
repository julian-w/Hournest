import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WorkTimeAccountEntry } from '../../../core/models/work-time-account-entry.model';
import { WorkTimeAccountService } from '../../../core/services/work-time-account.service';
import { LedgerAdjustmentDialogData } from './ledger-adjustment-dialog.component';

@Component({
  selector: 'app-time-account-adjustment-dialog',
  standalone: true,
  imports: [
    FormsModule, DatePipe, MatButtonModule, MatDialogModule, MatDividerModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatTableModule, TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'time_tracking.account.admin_title' | translate }} — {{ data.userName }}</h2>
    <mat-dialog-content class="dialog-content">
      <div class="toolbar">
        <mat-form-field appearance="outline" class="year-field">
          <mat-label>{{ 'time_tracking.account.year' | translate }}</mat-label>
          <mat-select [(ngModel)]="selectedYear" (ngModelChange)="loadEntries()">
            @for (year of availableYears; track year) {
              <mat-option [value]="year">{{ year }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="balance-row">
          <strong>{{ 'time_tracking.account.balance' | translate }}:</strong>
          <span [class.positive]="balance() > 0" [class.negative]="balance() < 0">{{ formatSignedMinutes(balance()) }}</span>
        </div>
      </div>

      <table mat-table [dataSource]="entries()" class="ledger-table">
        <ng-container matColumnDef="effective_date">
          <th mat-header-cell *matHeaderCellDef>{{ 'time_tracking.account.date' | translate }}</th>
          <td mat-cell *matCellDef="let entry">{{ entry.effective_date | date:'shortDate' }}</td>
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

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let entry">
            @if (entry.source_type === 'manual') {
              <button mat-icon-button color="warn" (click)="deleteEntry(entry)">
                <mat-icon>delete</mat-icon>
              </button>
            }
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <mat-divider></mat-divider>

      <div class="add-form">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'time_tracking.account.date' | translate }}</mat-label>
          <input matInput type="date" [(ngModel)]="newEffectiveDate">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'time_tracking.account.type' | translate }}</mat-label>
          <mat-select [(ngModel)]="newType">
            <mat-option value="manual_adjustment">{{ 'time_tracking.account.type_manual_adjustment' | translate }}</mat-option>
            <mat-option value="carryover">{{ 'time_tracking.account.type_carryover' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'time_tracking.account.change' | translate }}</mat-label>
          <input matInput type="number" [(ngModel)]="newMinutesDelta" step="15">
        </mat-form-field>

        <mat-form-field appearance="outline" class="comment-field">
          <mat-label>{{ 'time_tracking.account.comment' | translate }}</mat-label>
          <input matInput [(ngModel)]="newComment">
        </mat-form-field>

        <button mat-raised-button color="primary" [disabled]="!canAdd()" (click)="addEntry()">
          <mat-icon>add</mat-icon>
          {{ 'common.add' | translate }}
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(changed)">{{ 'common.cancel' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content { min-width: 760px; max-height: 75vh; }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .year-field { width: 120px; }
    .ledger-table { width: 100%; margin-bottom: 16px; }
    .add-form {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 16px;
    }
    .comment-field { flex: 1; min-width: 180px; }
    .positive { color: #2e7d32; }
    .negative { color: #c62828; }
  `],
})
export class TimeAccountAdjustmentDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<TimeAccountAdjustmentDialogComponent>);
  data: LedgerAdjustmentDialogData = inject(MAT_DIALOG_DATA);
  private workTimeAccountService = inject(WorkTimeAccountService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  entries = signal<WorkTimeAccountEntry[]>([]);
  balance = signal(0);
  changed = false;

  selectedYear = new Date().getFullYear();
  availableYears: number[] = [];
  newEffectiveDate = new Date().toISOString().split('T')[0];
  newType: 'manual_adjustment' | 'carryover' = 'manual_adjustment';
  newMinutesDelta = 0;
  newComment = '';
  displayedColumns = ['effective_date', 'type', 'minutes_delta', 'balance_after', 'comment', 'actions'];

  constructor() {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      this.availableYears.push(year);
    }
  }

  ngOnInit(): void {
    this.loadEntries();
  }

  loadEntries(): void {
    this.workTimeAccountService.getUserLedger(this.data.userId, this.selectedYear).subscribe(entries => {
      this.entries.set(entries);
      this.balance.set(entries.length > 0 ? entries[entries.length - 1].balance_after : 0);
    });
  }

  canAdd(): boolean {
    return this.newEffectiveDate.length > 0 && this.newMinutesDelta !== 0 && this.newComment.trim().length > 0;
  }

  addEntry(): void {
    this.workTimeAccountService.addEntry(this.data.userId, {
      effective_date: this.newEffectiveDate,
      type: this.newType,
      minutes_delta: this.newMinutesDelta,
      comment: this.newComment.trim(),
    }).subscribe(() => {
      this.changed = true;
      this.newMinutesDelta = 0;
      this.newComment = '';
      this.loadEntries();
      this.snackBar.open(
        this.translate.instant('time_tracking.account.updated'),
        this.translate.instant('common.ok'),
        { duration: 2000 },
      );
    });
  }

  deleteEntry(entry: WorkTimeAccountEntry): void {
    if (typeof entry.id !== 'number') {
      return;
    }

    this.workTimeAccountService.deleteEntry(this.data.userId, entry.id).subscribe(() => {
      this.changed = true;
      this.loadEntries();
      this.snackBar.open(
        this.translate.instant('time_tracking.account.updated'),
        this.translate.instant('common.ok'),
        { duration: 2000 },
      );
    });
  }

  formatSignedMinutes(minutes: number): string {
    const sign = minutes > 0 ? '+' : minutes < 0 ? '-' : '';
    const absolute = Math.abs(minutes);
    const hours = Math.floor(absolute / 60);
    const remainder = absolute % 60;
    return `${sign}${hours}:${remainder.toString().padStart(2, '0')}`;
  }
}
