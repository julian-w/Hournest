import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { VacationService } from '../../core/services/vacation.service';
import { VacationLedgerService } from '../../core/services/vacation-ledger.service';
import { AuthService } from '../../core/services/auth.service';
import { Vacation } from '../../core/models/vacation.model';
import { VacationLedgerEntry } from '../../core/models/vacation-ledger-entry.model';
import { VacationDialogComponent } from './vacation-dialog.component';

@Component({
  selector: 'app-my-vacations',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatTableModule, MatChipsModule, MatDialogModule,
    MatCardModule, MatTooltipModule, MatExpansionModule, MatSelectModule, DatePipe, TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h2>{{ 'vacations.title' | translate }}</h2>
      <div class="header-info">
        <span class="remaining">{{ 'vacations.remaining' | translate:{ days: auth.user()?.remaining_vacation_days } }}</span>
        <button mat-raised-button color="primary" (click)="openRequestDialog()">
          <mat-icon>add</mat-icon>
          {{ 'vacations.request_button' | translate }}
        </button>
      </div>
    </div>

    <mat-card>
      <table mat-table [dataSource]="vacations()">
        <ng-container matColumnDef="start_date">
          <th mat-header-cell *matHeaderCellDef>{{ 'vacations.from' | translate }}</th>
          <td mat-cell *matCellDef="let v">{{ v.start_date | date:'mediumDate' }}</td>
        </ng-container>

        <ng-container matColumnDef="end_date">
          <th mat-header-cell *matHeaderCellDef>{{ 'vacations.to' | translate }}</th>
          <td mat-cell *matCellDef="let v">{{ v.end_date | date:'mediumDate' }}</td>
        </ng-container>

        <ng-container matColumnDef="workdays">
          <th mat-header-cell *matHeaderCellDef>{{ 'vacations.days' | translate }}</th>
          <td mat-cell *matCellDef="let v">{{ v.workdays }}</td>
        </ng-container>

        <ng-container matColumnDef="scope">
          <th mat-header-cell *matHeaderCellDef>{{ 'vacations.scope' | translate }}</th>
          <td mat-cell *matCellDef="let v">{{ 'vacations.scope_' + v.scope | translate }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>{{ 'vacations.status' | translate }}</th>
          <td mat-cell *matCellDef="let v">
            <mat-chip [class]="'status-' + v.status">
              {{ 'vacations.status_' + v.status | translate }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="comment">
          <th mat-header-cell *matHeaderCellDef>{{ 'vacations.comment' | translate }}</th>
          <td mat-cell *matCellDef="let v">{{ v.comment || '\u2014' }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let v">
            @if (v.status === 'pending') {
              <button mat-icon-button color="warn" (click)="cancelVacation(v)" [matTooltip]="'vacations.cancel' | translate">
                <mat-icon>close</mat-icon>
              </button>
            }
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      @if (vacations().length === 0) {
        <div class="empty-state">
          <mat-icon>beach_access</mat-icon>
          <p>{{ 'vacations.no_vacations' | translate }}</p>
        </div>
      }
    </mat-card>

    <mat-expansion-panel class="ledger-panel">
      <mat-expansion-panel-header>
        <mat-panel-title>
          <mat-icon>account_balance</mat-icon>
          {{ 'vacations.ledger.title' | translate }}
        </mat-panel-title>
      </mat-expansion-panel-header>

      <div class="ledger-year-select">
        <mat-select [value]="selectedYear()" (selectionChange)="onYearChange($event.value)">
          @for (y of availableYears; track y) {
            <mat-option [value]="y">{{ y }}</mat-option>
          }
        </mat-select>
      </div>

      <table mat-table [dataSource]="ledgerEntries()" class="ledger-table">
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>{{ 'vacations.ledger.type' | translate }}</th>
          <td mat-cell *matCellDef="let e">{{ 'vacations.ledger.' + e.type | translate }}</td>
        </ng-container>

        <ng-container matColumnDef="days">
          <th mat-header-cell *matHeaderCellDef>{{ 'vacations.ledger.days' | translate }}</th>
          <td mat-cell *matCellDef="let e" [class.positive]="e.days > 0" [class.negative]="e.days < 0">
            {{ e.days > 0 ? '+' : '' }}{{ e.days }}
          </td>
        </ng-container>

        <ng-container matColumnDef="comment">
          <th mat-header-cell *matHeaderCellDef>{{ 'vacations.ledger.comment' | translate }}</th>
          <td mat-cell *matCellDef="let e">{{ e.comment || '\u2014' }}</td>
        </ng-container>

        <ng-container matColumnDef="created_at">
          <th mat-header-cell *matHeaderCellDef>{{ 'vacations.ledger.date' | translate }}</th>
          <td mat-cell *matCellDef="let e">{{ e.created_at | date:'mediumDate' }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="ledgerColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: ledgerColumns;"></tr>
      </table>
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
    .header-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .remaining {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      background: #fff8e1;
      padding: 6px 12px;
      border-radius: 16px;
    }
    table {
      width: 100%;
    }
    .status-pending { background-color: #fff3e0 !important; color: #e65100 !important; }
    .status-approved { background-color: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-rejected { background-color: #ffebee !important; color: #c62828 !important; }
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
    .ledger-panel {
      margin-top: 24px;
    }
    .ledger-panel mat-panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ledger-year-select {
      margin-bottom: 16px;
      max-width: 120px;
    }
    .ledger-table {
      width: 100%;
    }
    .positive {
      color: #2e7d32;
      font-weight: 500;
    }
    .negative {
      color: #c62828;
      font-weight: 500;
    }
  `],
})
export class MyVacationsComponent implements OnInit {
  private vacationService = inject(VacationService);
  private ledgerService = inject(VacationLedgerService);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);
  auth = inject(AuthService);

  vacations = signal<Vacation[]>([]);
  ledgerEntries = signal<VacationLedgerEntry[]>([]);
  selectedYear = signal(new Date().getFullYear());
  displayedColumns = ['start_date', 'end_date', 'scope', 'workdays', 'status', 'comment', 'actions'];
  ledgerColumns = ['type', 'days', 'comment', 'created_at'];

  availableYears: number[] = [];

  constructor() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
      this.availableYears.push(y);
    }
  }

  ngOnInit(): void {
    this.loadVacations();
    this.loadLedger();
  }

  openRequestDialog(): void {
    const dialogRef = this.dialog.open(VacationDialogComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadVacations();
        this.loadLedger();
        this.auth.loadUser();
      }
    });
  }

  cancelVacation(vacation: Vacation): void {
    this.vacationService.cancelVacation(vacation.id).subscribe(() => {
      this.loadVacations();
      this.loadLedger();
      this.auth.loadUser();
    });
  }

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.loadLedger();
  }

  private loadVacations(): void {
    this.vacationService.getMyVacations().subscribe(vacations => {
      this.vacations.set(vacations);
    });
  }

  private loadLedger(): void {
    this.ledgerService.getMyLedger(this.selectedYear()).subscribe(entries => {
      this.ledgerEntries.set(entries);
    });
  }
}
