import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AbsenceService } from '../../core/services/absence.service';
import { Absence, AbsenceType, AbsenceScope } from '../../core/models/absence.model';

@Component({
  selector: 'app-my-absences',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatTableModule, MatCardModule, MatChipsModule,
    MatDialogModule, MatSnackBarModule, MatTooltipModule, DatePipe, TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h2>{{ 'my_absences.title' | translate }}</h2>
      <div class="header-actions">
        <button mat-raised-button color="primary" (click)="openReportDialog('illness')">
          <mat-icon>sick</mat-icon>
          {{ 'my_absences.report_illness' | translate }}
        </button>
        <button mat-raised-button (click)="openReportDialog('special_leave')">
          <mat-icon>event_note</mat-icon>
          {{ 'my_absences.request_special_leave' | translate }}
        </button>
      </div>
    </div>

    <mat-card>
      <table mat-table [dataSource]="absences()">
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>{{ 'my_absences.type' | translate }}</th>
          <td mat-cell *matCellDef="let a">
            <mat-chip [class]="'type-' + a.type">{{ 'my_absences.type_' + a.type | translate }}</mat-chip>
          </td>
        </ng-container>
        <ng-container matColumnDef="dates">
          <th mat-header-cell *matHeaderCellDef>{{ 'my_absences.dates' | translate }}</th>
          <td mat-cell *matCellDef="let a">{{ a.start_date | date:'mediumDate' }} — {{ a.end_date | date:'mediumDate' }}</td>
        </ng-container>
        <ng-container matColumnDef="scope">
          <th mat-header-cell *matHeaderCellDef>{{ 'my_absences.scope' | translate }}</th>
          <td mat-cell *matCellDef="let a">{{ 'my_absences.scope_' + a.scope | translate }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>{{ 'my_absences.status' | translate }}</th>
          <td mat-cell *matCellDef="let a">
            <mat-chip [class]="'status-' + a.status">{{ 'my_absences.status_' + a.status | translate }}</mat-chip>
          </td>
        </ng-container>
        <ng-container matColumnDef="comment">
          <th mat-header-cell *matHeaderCellDef>{{ 'my_absences.comment' | translate }}</th>
          <td mat-cell *matCellDef="let a">{{ a.comment || '\u2014' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let a">
            @if (a.status === 'reported' || a.status === 'pending') {
              <button mat-icon-button color="warn" (click)="cancelAbsence(a)" [matTooltip]="'my_absences.cancel' | translate">
                <mat-icon>close</mat-icon>
              </button>
            }
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
      @if (absences().length === 0) {
        <div class="empty-state">
          <mat-icon>check_circle_outline</mat-icon>
          <p>{{ 'my_absences.no_absences' | translate }}</p>
        </div>
      }
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
    .header-actions { display: flex; gap: 8px; }
    table { width: 100%; }
    .type-illness { background-color: #fff3e0 !important; color: #e65100 !important; }
    .type-special_leave { background-color: #e3f2fd !important; color: #1565c0 !important; }
    .status-reported { background-color: #fff3e0 !important; color: #e65100 !important; }
    .status-acknowledged { background-color: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-pending { background-color: #fff3e0 !important; color: #e65100 !important; }
    .status-approved { background-color: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-rejected { background-color: #ffebee !important; color: #c62828 !important; }
    .status-admin_created { background-color: #e8f5e9 !important; color: #2e7d32 !important; }
    .empty-state { text-align: center; padding: 48px 16px; color: rgba(0,0,0,0.38); }
    .empty-state mat-icon { font-size: 48px; height: 48px; width: 48px; }
  `],
})
export class MyAbsencesComponent implements OnInit {
  private absenceService = inject(AbsenceService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  absences = signal<Absence[]>([]);
  columns = ['type', 'dates', 'scope', 'status', 'comment', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.absenceService.getMyAbsences().subscribe(data => this.absences.set(data));
  }

  openReportDialog(type: AbsenceType): void {
    const ref = this.dialog.open(ReportAbsenceDialogComponent, {
      width: '450px',
      data: type,
    });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  cancelAbsence(absence: Absence): void {
    this.absenceService.cancelAbsence(absence.id).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Error',
          this.translate.instant('common.ok'),
          { duration: 3000 },
        );
        this.load();
      },
    });
  }
}

@Component({
  selector: 'app-report-absence-dialog',
  standalone: true,
  imports: [
    MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatDialogModule, FormsModule, TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ (type === 'illness' ? 'my_absences.report_illness' : 'my_absences.request_special_leave') | translate }}
    </h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'my_absences.scope' | translate }}</mat-label>
        <mat-select [(ngModel)]="scope">
          <mat-option value="full_day">{{ 'my_absences.scope_full_day' | translate }}</mat-option>
          <mat-option value="morning">{{ 'my_absences.scope_morning' | translate }}</mat-option>
          <mat-option value="afternoon">{{ 'my_absences.scope_afternoon' | translate }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'my_absences.start_date' | translate }}</mat-label>
        <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate">
        <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
        <mat-datepicker #startPicker></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'my_absences.end_date' | translate }}</mat-label>
        <input matInput [matDatepicker]="endPicker" [(ngModel)]="endDate">
        <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
        <mat-datepicker #endPicker></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'my_absences.comment' | translate }}</mat-label>
        <textarea matInput [(ngModel)]="comment" rows="2"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="!startDate || !endDate">
        {{ 'common.save' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class ReportAbsenceDialogComponent {
  private absenceService = inject(AbsenceService);
  private dialogRef = inject(MatDialogRef<ReportAbsenceDialogComponent>);
  type: AbsenceType = inject<AbsenceType>(MAT_DIALOG_DATA);

  scope: AbsenceScope = 'full_day';
  startDate: Date | null = null;
  endDate: Date | null = null;
  comment = '';

  save(): void {
    if (!this.startDate || !this.endDate) return;

    this.absenceService.reportAbsence({
      start_date: this.startDate.toISOString().split('T')[0],
      end_date: this.endDate.toISOString().split('T')[0],
      type: this.type,
      scope: this.scope,
      comment: this.comment || undefined,
    }).subscribe(() => this.dialogRef.close(true));
  }
}
