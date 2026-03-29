import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../../core/services/admin.service';
import { Vacation } from '../../../core/models/vacation.model';

@Component({
  selector: 'app-admin-requests',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatTooltipModule, MatSnackBarModule,
    DatePipe, FormsModule, TranslateModule,
  ],
  template: `
    <h2>{{ 'admin_requests.title' | translate }}</h2>

    <mat-card>
      <table mat-table [dataSource]="vacations()">
        <ng-container matColumnDef="user_name">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_requests.employee' | translate }}</th>
          <td mat-cell *matCellDef="let v">{{ v.user_name }}</td>
        </ng-container>

        <ng-container matColumnDef="start_date">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_requests.from' | translate }}</th>
          <td mat-cell *matCellDef="let v">{{ v.start_date | date:'mediumDate' }}</td>
        </ng-container>

        <ng-container matColumnDef="end_date">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_requests.to' | translate }}</th>
          <td mat-cell *matCellDef="let v">{{ v.end_date | date:'mediumDate' }}</td>
        </ng-container>

        <ng-container matColumnDef="workdays">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_requests.days' | translate }}</th>
          <td mat-cell *matCellDef="let v">{{ v.workdays }}</td>
        </ng-container>

        <ng-container matColumnDef="created_at">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_requests.requested' | translate }}</th>
          <td mat-cell *matCellDef="let v">{{ v.created_at | date:'mediumDate' }}</td>
        </ng-container>

        <ng-container matColumnDef="comment">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_requests.comment' | translate }}</th>
          <td mat-cell *matCellDef="let v">
            <mat-form-field appearance="outline" class="comment-field">
              <input matInput [(ngModel)]="comments[v.id]" [placeholder]="'admin_requests.comment' | translate">
            </mat-form-field>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>{{ 'admin_requests.actions' | translate }}</th>
          <td mat-cell *matCellDef="let v">
            <button mat-icon-button color="primary" (click)="review(v, 'approved')" [matTooltip]="'admin_requests.approve' | translate">
              <mat-icon>check_circle</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="review(v, 'rejected')" [matTooltip]="'admin_requests.reject' | translate">
              <mat-icon>cancel</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      @if (vacations().length === 0) {
        <div class="empty-state">
          <mat-icon>check_circle_outline</mat-icon>
          <p>{{ 'admin_requests.no_pending' | translate }}</p>
        </div>
      }
    </mat-card>
  `,
  styles: [`
    table { width: 100%; }
    .comment-field { width: 100%; font-size: 13px; }
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
export class AdminRequestsComponent implements OnInit {
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  vacations = signal<Vacation[]>([]);
  displayedColumns = ['user_name', 'start_date', 'end_date', 'workdays', 'created_at', 'comment', 'actions'];
  comments: Record<number, string> = {};

  ngOnInit(): void {
    this.loadPending();
  }

  review(vacation: Vacation, status: 'approved' | 'rejected'): void {
    this.adminService.reviewVacation(vacation.id, status, this.comments[vacation.id]).subscribe({
      next: () => {
        const msgKey = status === 'approved' ? 'admin_requests.approved_msg' : 'admin_requests.rejected_msg';
        this.snackBar.open(this.translate.instant(msgKey), this.translate.instant('common.ok'), { duration: 3000 });
        this.loadPending();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error', this.translate.instant('common.ok'), { duration: 3000 });
      },
    });
  }

  private loadPending(): void {
    this.adminService.getPendingVacations().subscribe(vacations => {
      this.vacations.set(vacations);
    });
  }
}
