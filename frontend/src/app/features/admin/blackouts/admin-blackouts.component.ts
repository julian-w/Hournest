import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BlackoutService } from '../../../core/services/blackout.service';
import { BlackoutPeriod } from '../../../core/models/blackout-period.model';
import { BlackoutDialogComponent } from './blackout-dialog.component';

@Component({
  selector: 'app-admin-blackouts',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule,
    MatDialogModule, MatSnackBarModule, MatTooltipModule, DatePipe, TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h2>{{ 'admin_blackouts.title' | translate }}</h2>
      <button mat-raised-button color="primary" (click)="openDialog()">
        <mat-icon>add</mat-icon>
        {{ 'admin_blackouts.add' | translate }}
      </button>
    </div>

    <mat-card>
      <table mat-table [dataSource]="blackouts()">
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_blackouts.type' | translate }}</th>
          <td mat-cell *matCellDef="let b">
            <span class="type-badge" [class.freeze]="b.type === 'freeze'" [class.company-holiday]="b.type === 'company_holiday'">
              <mat-icon class="type-icon">{{ b.type === 'freeze' ? 'block' : 'holiday_village' }}</mat-icon>
              {{ (b.type === 'freeze' ? 'admin_blackouts.type_freeze' : 'admin_blackouts.type_company_holiday') | translate }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="start_date">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_blackouts.from' | translate }}</th>
          <td mat-cell *matCellDef="let b">{{ b.start_date | date:'mediumDate' }}</td>
        </ng-container>

        <ng-container matColumnDef="end_date">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_blackouts.to' | translate }}</th>
          <td mat-cell *matCellDef="let b">{{ b.end_date | date:'mediumDate' }}</td>
        </ng-container>

        <ng-container matColumnDef="reason">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_blackouts.reason' | translate }}</th>
          <td mat-cell *matCellDef="let b">{{ b.reason }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let b">
            <button mat-icon-button
                    [matTooltip]="'admin_blackouts.edit' | translate"
                    (click)="editBlackout(b)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn"
                    [matTooltip]="'common.delete' | translate"
                    (click)="deleteBlackout(b)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      @if (blackouts().length === 0) {
        <div class="empty-state">
          <mat-icon>event_busy</mat-icon>
          <p>{{ 'admin_blackouts.no_blackouts' | translate }}</p>
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
    }
    table { width: 100%; }
    .type-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 500;
    }
    .type-icon { font-size: 16px; height: 16px; width: 16px; }
    .type-badge.freeze {
      background: #ffebee;
      color: #c62828;
    }
    .type-badge.company-holiday {
      background: #fff3e0;
      color: #e65100;
    }
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
export class AdminBlackoutsComponent implements OnInit {
  private blackoutService = inject(BlackoutService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  blackouts = signal<BlackoutPeriod[]>([]);
  displayedColumns = ['type', 'start_date', 'end_date', 'reason', 'actions'];

  ngOnInit(): void {
    this.loadBlackouts();
  }

  openDialog(): void {
    const ref = this.dialog.open(BlackoutDialogComponent, { width: '440px' });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadBlackouts();
    });
  }

  editBlackout(blackout: BlackoutPeriod): void {
    const ref = this.dialog.open(BlackoutDialogComponent, { width: '440px', data: blackout });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadBlackouts();
    });
  }

  deleteBlackout(blackout: BlackoutPeriod): void {
    this.blackoutService.deleteBlackout(blackout.id).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('admin_blackouts.deleted'),
          this.translate.instant('common.ok'),
          { duration: 3000 },
        );
        this.loadBlackouts();
      },
    });
  }

  private loadBlackouts(): void {
    this.blackoutService.getBlackouts().subscribe(b => this.blackouts.set(b));
  }
}
