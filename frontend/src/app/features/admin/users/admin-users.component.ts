import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../../core/services/admin.service';
import { ConfigService } from '../../../core/services/config.service';
import { User } from '../../../core/models/user.model';
import { LedgerAdjustmentDialogComponent } from './ledger-adjustment-dialog.component';
import { CreateUserDialogComponent } from './create-user-dialog.component';
import { ResetPasswordDialogComponent } from './reset-password-dialog.component';
import { TimeAccountAdjustmentDialogComponent } from './time-account-adjustment-dialog.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatSelectModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule,
    MatSnackBarModule, MatDialogModule, MatTooltipModule, FormsModule, TranslateModule,
  ],
  template: `
    <h2>{{ 'admin_users.title' | translate }}</h2>

    <button mat-raised-button color="primary" class="create-btn" (click)="openCreateUserDialog()">
      <mat-icon>person_add</mat-icon>
      {{ 'admin_users.create_user' | translate }}
    </button>

    <mat-card>
      <table mat-table [dataSource]="users()">
        <ng-container matColumnDef="display_name">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_users.name' | translate }}</th>
          <td mat-cell *matCellDef="let u">{{ u.display_name }}</td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_users.email' | translate }}</th>
          <td mat-cell *matCellDef="let u">{{ u.email }}</td>
        </ng-container>

        <ng-container matColumnDef="role">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_users.role' | translate }}</th>
          <td mat-cell *matCellDef="let u">
            <mat-select [value]="u.role" (selectionChange)="updateRole(u, $event.value)">
              <mat-option value="employee">{{ 'admin_users.role_employee' | translate }}</mat-option>
              <mat-option value="admin">{{ 'admin_users.role_admin' | translate }}</mat-option>
            </mat-select>
          </td>
        </ng-container>

        <ng-container matColumnDef="vacation_days_per_year">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_users.vacation_days' | translate }}</th>
          <td mat-cell *matCellDef="let u">
            <mat-form-field appearance="outline" class="days-field">
              <input matInput type="number" [value]="u.vacation_days_per_year"
                     (change)="updateDays(u, $event)">
            </mat-form-field>
          </td>
        </ng-container>

        <ng-container matColumnDef="remaining_vacation_days">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_users.remaining' | translate }}</th>
          <td mat-cell *matCellDef="let u">{{ u.remaining_vacation_days }}</td>
        </ng-container>

        <ng-container matColumnDef="holidays_exempt">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_users.holidays_exempt' | translate }}</th>
          <td mat-cell *matCellDef="let u">
            <mat-slide-toggle [checked]="u.holidays_exempt" (change)="updateHolidaysExempt(u, $event.checked)">
            </mat-slide-toggle>
          </td>
        </ng-container>

        <ng-container matColumnDef="weekend_worker">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_users.weekend_worker' | translate }}</th>
          <td mat-cell *matCellDef="let u">
            <mat-slide-toggle [checked]="u.weekend_worker" (change)="updateWeekendWorker(u, $event.checked)">
            </mat-slide-toggle>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let u">
            <button mat-icon-button color="primary"
                    [matTooltip]="'admin_users.adjust_ledger' | translate"
                    (click)="openLedgerDialog(u)">
              <mat-icon>account_balance_wallet</mat-icon>
            </button>
            <button mat-icon-button color="primary"
                    [matTooltip]="'admin_users.adjust_time_account' | translate"
                    (click)="openTimeAccountDialog(u)">
              <mat-icon>schedule</mat-icon>
            </button>
            @if (!configService.isOAuthEnabled()) {
              <button mat-icon-button color="warn"
                      [matTooltip]="'admin_users.reset_password' | translate"
                      (click)="resetPassword(u)">
                <mat-icon>lock_reset</mat-icon>
              </button>
            }
            <button mat-icon-button
                    [matTooltip]="'admin_users.delete_user' | translate"
                    (click)="deleteUser(u)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </mat-card>
  `,
  styles: [`
    table { width: 100%; }
    .days-field { width: 80px; font-size: 13px; }
    mat-select { width: 120px; }
    .create-btn { margin-bottom: 16px; }
  `],
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);
  configService = inject(ConfigService);

  users = signal<User[]>([]);
  displayedColumns = [
    'display_name', 'email', 'role', 'vacation_days_per_year',
    'remaining_vacation_days', 'holidays_exempt', 'weekend_worker', 'actions',
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  updateRole(user: User, role: string): void {
    this.adminService.updateUser(user.id, { role }).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('admin_users.role_updated'), this.translate.instant('common.ok'), { duration: 3000 });
        this.loadUsers();
      },
    });
  }

  updateDays(user: User, event: Event): void {
    const input = event.target as HTMLInputElement;
    const days = parseInt(input.value, 10);
    if (isNaN(days) || days < 0) return;

    this.adminService.updateUser(user.id, { vacation_days_per_year: days }).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('admin_users.days_updated'), this.translate.instant('common.ok'), { duration: 3000 });
        this.loadUsers();
      },
    });
  }

  updateHolidaysExempt(user: User, checked: boolean): void {
    this.adminService.updateUser(user.id, { holidays_exempt: checked }).subscribe({
      next: () => this.loadUsers(),
    });
  }

  updateWeekendWorker(user: User, checked: boolean): void {
    this.adminService.updateUser(user.id, { weekend_worker: checked }).subscribe({
      next: () => this.loadUsers(),
    });
  }

  openLedgerDialog(user: User): void {
    const ref = this.dialog.open(LedgerAdjustmentDialogComponent, {
      width: '700px',
      data: { userName: user.display_name, userId: user.id },
    });
    ref.afterClosed().subscribe((changed: boolean) => {
      if (changed) this.loadUsers();
    });
  }

  openTimeAccountDialog(user: User): void {
    const ref = this.dialog.open(TimeAccountAdjustmentDialogComponent, {
      width: '900px',
      data: { userName: user.display_name, userId: user.id },
    });
    ref.afterClosed().subscribe((changed: boolean) => {
      if (changed) this.loadUsers();
    });
  }

  openCreateUserDialog(): void {
    const ref = this.dialog.open(CreateUserDialogComponent, {
      width: '450px',
    });
    ref.afterClosed().subscribe((created: boolean) => {
      if (created) {
        this.snackBar.open(this.translate.instant('admin_users.user_created'), this.translate.instant('common.ok'), { duration: 3000 });
        this.loadUsers();
      }
    });
  }

  deleteUser(user: User): void {
    if (!confirm(this.translate.instant('admin_users.delete_confirm', { name: user.display_name }))) return;

    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('admin_users.user_deleted'), this.translate.instant('common.ok'), { duration: 3000 });
        this.loadUsers();
      },
    });
  }

  resetPassword(user: User): void {
    const ref = this.dialog.open(ResetPasswordDialogComponent, {
      width: '400px',
    });
    ref.afterClosed().subscribe((password: string | undefined) => {
      if (!password) return;
      this.adminService.resetUserPassword(user.id, password).subscribe({
        next: () => {
          this.snackBar.open(this.translate.instant('admin_users.password_reset'), this.translate.instant('common.ok'), { duration: 3000 });
        },
      });
    });
  }

  private loadUsers(): void {
    this.adminService.getUsers().subscribe(users => {
      this.users.set(users);
    });
  }
}
