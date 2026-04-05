import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { VacationLedgerService } from '../../../core/services/vacation-ledger.service';
import { VacationLedgerEntry } from '../../../core/models/vacation-ledger-entry.model';

export interface LedgerAdjustmentDialogData {
  userName: string;
  userId: number;
}

interface VacationLedgerDisplayRow extends VacationLedgerEntry {
  running_balance: number;
}

@Component({
  selector: 'app-ledger-adjustment-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatTableModule,
    MatDividerModule, MatTooltipModule, MatSnackBarModule, DatePipe, TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'ledger_dialog.title' | translate }} — {{ data.userName }}</h2>
    <mat-dialog-content class="dialog-content">

      <mat-select [(value)]="selectedYear" (selectionChange)="loadEntries()" class="year-select">
        @for (y of availableYears; track y) {
          <mat-option [value]="y">{{ y }}</mat-option>
        }
      </mat-select>

      <table mat-table [dataSource]="entries()" class="ledger-table">
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>{{ 'vacations.ledger.type' | translate }}</th>
          <td mat-cell *matCellDef="let e" [class]="'type-' + e.type">
            {{ 'vacations.ledger.' + e.type | translate }}
          </td>
        </ng-container>

        <ng-container matColumnDef="days">
          <th mat-header-cell *matHeaderCellDef>{{ 'vacations.ledger.days' | translate }}</th>
          <td mat-cell *matCellDef="let e" [class.positive]="e.days > 0" [class.negative]="e.days < 0">
            {{ e.days > 0 ? '+' : '' }}{{ e.days }}
          </td>
        </ng-container>

        <ng-container matColumnDef="comment">
          <th mat-header-cell *matHeaderCellDef>{{ 'vacations.ledger.comment' | translate }}</th>
          <td mat-cell *matCellDef="let e">{{ e.comment }}</td>
        </ng-container>

        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>{{ 'vacations.ledger.date' | translate }}</th>
          <td mat-cell *matCellDef="let e">{{ e.created_at | date:'shortDate' }}</td>
        </ng-container>

        <ng-container matColumnDef="running_balance">
          <th mat-header-cell *matHeaderCellDef>{{ 'vacations.ledger.balance' | translate }}</th>
          <td mat-cell *matCellDef="let e" [class.positive]="e.running_balance > 0" [class.negative]="e.running_balance < 0">
            {{ e.running_balance > 0 ? '+' : '' }}{{ e.running_balance }}
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let e">
            @if (!e.vacation_id) {
              <button mat-icon-button color="warn"
                      [matTooltip]="'common.delete' | translate"
                      (click)="deleteEntry(e)">
                <mat-icon>delete</mat-icon>
              </button>
            }
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <div class="balance-row">
        <strong>{{ 'vacations.ledger.balance' | translate }}:</strong>
        <span [class.positive]="balance() > 0" [class.negative]="balance() < 0">{{ balance() }} {{ 'vacations.ledger.days' | translate }}</span>
      </div>

      <mat-divider></mat-divider>

      <h3>{{ 'ledger_dialog.add_entry' | translate }}</h3>
      <div class="add-form">
        <mat-form-field appearance="outline" class="type-field">
          <mat-label>{{ 'ledger_dialog.type' | translate }}</mat-label>
          <mat-select [(ngModel)]="newType">
            <mat-option value="bonus">{{ 'vacations.ledger.bonus' | translate }}</mat-option>
            <mat-option value="adjustment">{{ 'vacations.ledger.adjustment' | translate }}</mat-option>
            <mat-option value="carryover">{{ 'vacations.ledger.carryover' | translate }}</mat-option>
            <mat-option value="expired">{{ 'vacations.ledger.expired' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="days-field">
          <mat-label>{{ 'ledger_dialog.days' | translate }}</mat-label>
          <input matInput type="number" [(ngModel)]="newDays">
          <mat-hint>{{ 'ledger_dialog.days_hint' | translate }}</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="comment-field">
          <mat-label>{{ 'ledger_dialog.comment' | translate }}</mat-label>
          <input matInput [(ngModel)]="newComment">
        </mat-form-field>

        <button mat-raised-button color="primary" [disabled]="!canAdd()" (click)="addEntry()">
          <mat-icon>add</mat-icon>
          {{ 'ledger_dialog.add' | translate }}
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(changed)">{{ 'common.cancel' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content { min-width: 560px; max-height: 70vh; }
    .year-select { width: 100px; margin-bottom: 16px; }
    .ledger-table { width: 100%; margin-bottom: 8px; }
    .balance-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 15px;
    }
    .positive { color: #2e7d32; }
    .negative { color: #c62828; }
    .type-entitlement { color: #1565c0; }
    .type-bonus { color: #2e7d32; }
    .type-taken { color: #c62828; }
    .type-adjustment { color: #e65100; }
    .type-carryover { color: #6a1b9a; }
    .type-expired { color: #9e9e9e; }
    h3 { margin: 16px 0 8px; }
    .add-form {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
    }
    .type-field { width: 160px; }
    .days-field { width: 100px; }
    .comment-field { flex: 1; min-width: 160px; }
  `],
})
export class LedgerAdjustmentDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<LedgerAdjustmentDialogComponent>);
  data: LedgerAdjustmentDialogData = inject(MAT_DIALOG_DATA);
  private ledgerService = inject(VacationLedgerService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  entries = signal<VacationLedgerDisplayRow[]>([]);
  balance = signal(0);
  changed = false;

  selectedYear = new Date().getFullYear();
  availableYears: number[] = [];

  newType: 'bonus' | 'adjustment' | 'carryover' | 'expired' = 'adjustment';
  newDays = 0;
  newComment = '';

  displayedColumns = ['type', 'days', 'comment', 'date', 'running_balance', 'actions'];

  constructor() {
    const year = new Date().getFullYear();
    for (let y = year - 1; y <= year + 1; y++) {
      this.availableYears.push(y);
    }
  }

  ngOnInit(): void {
    this.loadEntries();
  }

  loadEntries(): void {
    this.ledgerService.getUserLedger(this.data.userId, this.selectedYear).subscribe(entries => {
      let runningBalance = 0;
      const rows = entries.map(entry => {
        runningBalance += entry.days;
        return { ...entry, running_balance: runningBalance };
      });
      this.entries.set(rows);
      this.balance.set(runningBalance);
    });
  }

  canAdd(): boolean {
    return this.newDays !== 0 && this.newComment.trim().length > 0;
  }

  addEntry(): void {
    this.ledgerService.addEntry(this.data.userId, {
      year: this.selectedYear,
      type: this.newType,
      days: this.newDays,
      comment: this.newComment.trim(),
    }).subscribe({
      next: () => {
        this.changed = true;
        this.newDays = 0;
        this.newComment = '';
        this.snackBar.open(
          this.translate.instant('admin_users.ledger_updated'),
          this.translate.instant('common.ok'),
          { duration: 2000 },
        );
        this.loadEntries();
      },
    });
  }

  deleteEntry(entry: VacationLedgerEntry): void {
    this.ledgerService.deleteEntry(this.data.userId, entry.id).subscribe({
      next: () => {
        this.changed = true;
        this.snackBar.open(
          this.translate.instant('ledger_dialog.entry_deleted'),
          this.translate.instant('common.ok'),
          { duration: 2000 },
        );
        this.loadEntries();
      },
    });
  }
}
