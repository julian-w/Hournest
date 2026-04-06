import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../../core/services/admin.service';
import { Absence, AbsenceType, AbsenceScope } from '../../../core/models/absence.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-absences',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatTableModule, MatCardModule, MatChipsModule,
    MatTabsModule, MatDialogModule, MatSnackBarModule, DatePipe, TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h2>{{ 'admin_absences.title' | translate }}</h2>
      <button mat-raised-button color="primary" (click)="openCreateDialog()">
        <mat-icon>add</mat-icon>
        {{ 'admin_absences.create' | translate }}
      </button>
    </div>

    <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
      <mat-tab [label]="'admin_absences.tab_pending' | translate">
        <ng-template matTabContent>
          <mat-card>
            <table mat-table [dataSource]="pendingAbsences()">
              <ng-container matColumnDef="employee">
                <th mat-header-cell *matHeaderCellDef>{{ 'admin_absences.employee' | translate }}</th>
                <td mat-cell *matCellDef="let a">{{ a.user_name }}</td>
              </ng-container>
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>{{ 'admin_absences.type' | translate }}</th>
                <td mat-cell *matCellDef="let a">
                  <mat-chip [class]="'type-' + a.type">
                    {{ 'admin_absences.type_' + a.type | translate }}
                  </mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="dates">
                <th mat-header-cell *matHeaderCellDef>{{ 'admin_absences.dates' | translate }}</th>
                <td mat-cell *matCellDef="let a">{{ a.start_date | date:'mediumDate' }} — {{ a.end_date | date:'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="scope">
                <th mat-header-cell *matHeaderCellDef>{{ 'admin_absences.scope' | translate }}</th>
                <td mat-cell *matCellDef="let a">{{ 'admin_absences.scope_' + a.scope | translate }}</td>
              </ng-container>
              <ng-container matColumnDef="comment">
                <th mat-header-cell *matHeaderCellDef>{{ 'admin_absences.comment' | translate }}</th>
                <td mat-cell *matCellDef="let a">{{ a.comment || '\u2014' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let a">
                  @if (a.type === 'illness' && a.status === 'reported') {
                    <button mat-raised-button color="primary" class="action-btn" (click)="reviewAbsence(a, 'acknowledged')">
                      {{ 'admin_absences.acknowledge' | translate }}
                    </button>
                  }
                  @if (a.type === 'special_leave' && a.status === 'pending') {
                    <button mat-raised-button color="primary" class="action-btn" (click)="reviewAbsence(a, 'approved')">
                      {{ 'admin_absences.approve' | translate }}
                    </button>
                    <button mat-raised-button color="warn" class="action-btn" (click)="reviewAbsence(a, 'rejected')">
                      {{ 'admin_absences.reject' | translate }}
                    </button>
                  }
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="pendingColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: pendingColumns;"></tr>
            </table>
            @if (pendingAbsences().length === 0) {
              <div class="empty-state">
                <mat-icon>check_circle</mat-icon>
                <p>{{ 'admin_absences.no_pending' | translate }}</p>
              </div>
            }
          </mat-card>
        </ng-template>
      </mat-tab>

      <mat-tab [label]="'admin_absences.tab_all' | translate">
        <ng-template matTabContent>
          <mat-card>
            <table mat-table [dataSource]="allAbsences()">
              <ng-container matColumnDef="employee">
                <th mat-header-cell *matHeaderCellDef>{{ 'admin_absences.employee' | translate }}</th>
                <td mat-cell *matCellDef="let a">{{ a.user_name }}</td>
              </ng-container>
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>{{ 'admin_absences.type' | translate }}</th>
                <td mat-cell *matCellDef="let a">
                  <mat-chip [class]="'type-' + a.type">{{ 'admin_absences.type_' + a.type | translate }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="dates">
                <th mat-header-cell *matHeaderCellDef>{{ 'admin_absences.dates' | translate }}</th>
                <td mat-cell *matCellDef="let a">{{ a.start_date | date:'mediumDate' }} — {{ a.end_date | date:'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="scope">
                <th mat-header-cell *matHeaderCellDef>{{ 'admin_absences.scope' | translate }}</th>
                <td mat-cell *matCellDef="let a">{{ 'admin_absences.scope_' + a.scope | translate }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>{{ 'admin_absences.status' | translate }}</th>
                <td mat-cell *matCellDef="let a">
                  <mat-chip [class]="'status-' + a.status">{{ 'admin_absences.status_' + a.status | translate }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let a">
                  <button mat-icon-button color="warn" (click)="deleteAbsence(a)"><mat-icon>delete</mat-icon></button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="allColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: allColumns;"></tr>
            </table>
          </mat-card>
        </ng-template>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    table { width: 100%; }
    .action-btn { margin-right: 8px; }
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
    mat-card { margin-top: 16px; }
  `],
})
export class AdminAbsencesComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  pendingAbsences = signal<Absence[]>([]);
  allAbsences = signal<Absence[]>([]);
  pendingColumns = ['employee', 'type', 'dates', 'scope', 'comment', 'actions'];
  allColumns = ['employee', 'type', 'dates', 'scope', 'status', 'actions'];

  ngOnInit(): void {
    this.loadPending();
  }

  onTabChange(index: number): void {
    if (index === 0) this.loadPending();
    else this.loadAll();
  }

  loadPending(): void {
    this.adminService.getAbsences().subscribe(data => {
      this.pendingAbsences.set(data.filter(a => a.status === 'reported' || a.status === 'pending'));
    });
  }

  loadAll(): void {
    this.adminService.getAbsences().subscribe(data => this.allAbsences.set(data));
  }

  reviewAbsence(absence: Absence, status: string): void {
    this.adminService.reviewAbsence(absence.id, status).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('admin_absences.reviewed'),
          this.translate.instant('common.ok'),
          { duration: 3000 },
        );
        this.loadPending();
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || this.translate.instant('login.error_generic'),
          this.translate.instant('common.ok'),
          { duration: 3000 },
        );
      },
    });
  }

  deleteAbsence(absence: Absence): void {
    this.adminService.deleteAbsence(absence.id).subscribe(() => {
      this.snackBar.open(
        this.translate.instant('admin_absences.deleted'),
        this.translate.instant('common.ok'),
        { duration: 3000 },
      );
      this.loadAll();
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(CreateAbsenceDialogComponent, { width: '500px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.loadPending();
        this.loadAll();
      }
    });
  }
}

@Component({
  selector: 'app-create-absence-dialog',
  standalone: true,
  imports: [
    MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatDialogModule, FormsModule, TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'admin_absences.create' | translate }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'admin_absences.employee' | translate }}</mat-label>
        <mat-select [(ngModel)]="userId">
          @for (user of users(); track user.id) {
            <mat-option [value]="user.id">{{ user.display_name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'admin_absences.type' | translate }}</mat-label>
        <mat-select [(ngModel)]="type">
          <mat-option value="illness">{{ 'admin_absences.type_illness' | translate }}</mat-option>
          <mat-option value="special_leave">{{ 'admin_absences.type_special_leave' | translate }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'admin_absences.scope' | translate }}</mat-label>
        <mat-select [(ngModel)]="scope">
          <mat-option value="full_day">{{ 'admin_absences.scope_full_day' | translate }}</mat-option>
          <mat-option value="morning">{{ 'admin_absences.scope_morning' | translate }}</mat-option>
          <mat-option value="afternoon">{{ 'admin_absences.scope_afternoon' | translate }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'admin_absences.start_date' | translate }}</mat-label>
        <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate">
        <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
        <mat-datepicker #startPicker></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'admin_absences.end_date' | translate }}</mat-label>
        <input matInput [matDatepicker]="endPicker" [(ngModel)]="endDate">
        <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
        <mat-datepicker #endPicker></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'admin_absences.admin_comment' | translate }}</mat-label>
        <textarea matInput [(ngModel)]="adminComment" rows="2"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="!canSave()">
        {{ 'common.save' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class CreateAbsenceDialogComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<CreateAbsenceDialogComponent>);
  users = signal<User[]>([]);

  userId: number | null = null;
  type: AbsenceType = 'illness';
  scope: AbsenceScope = 'full_day';
  startDate: Date | null = null;
  endDate: Date | null = null;
  adminComment = '';

  ngOnInit(): void {
    this.adminService.getUsers().subscribe(users => this.users.set(users));
  }

  canSave(): boolean {
    return !!this.userId && !!this.startDate && !!this.endDate;
  }

  save(): void {
    if (!this.userId || !this.startDate || !this.endDate) return;

    this.adminService.createAbsence({
      user_id: this.userId,
      start_date: this.formatDate(this.startDate),
      end_date: this.formatDate(this.endDate),
      type: this.type,
      scope: this.scope,
      admin_comment: this.adminComment || undefined,
    }).subscribe(() => this.dialogRef.close(true));
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
