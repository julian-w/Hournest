import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { VacationService } from '../../core/services/vacation.service';
import { AdminService } from '../../core/services/admin.service';
import { Vacation } from '../../core/models/vacation.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    DatePipe,
    TranslateModule,
  ],
  template: `
    <h2>{{ 'dashboard.title' | translate }}</h2>

    <div class="dashboard-grid">
      <mat-card class="dashboard-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="card-icon remaining-icon">event_available</mat-icon>
          <mat-card-title>{{ 'dashboard.remaining_days' | translate }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="big-number">{{ auth.user()?.remaining_vacation_days ?? 0 }}</div>
          <div class="big-label">{{ 'dashboard.days' | translate }}</div>
        </mat-card-content>
      </mat-card>

      <mat-card class="dashboard-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="card-icon pending-icon">hourglass_empty</mat-icon>
          <mat-card-title>{{ 'dashboard.pending_requests' | translate }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="big-number">{{ pendingCount() }}</div>
        </mat-card-content>
      </mat-card>

      <mat-card class="dashboard-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="card-icon next-icon">flight_takeoff</mat-icon>
          <mat-card-title>{{ 'dashboard.next_vacation' | translate }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (nextVacation()) {
            <div class="next-vacation-info">
              <span class="next-date">{{ nextVacation()!.start_date | date:'mediumDate' }}</span>
              <span class="next-label">{{ 'dashboard.starts' | translate }}</span>
            </div>
          } @else {
            <p class="no-data">{{ 'dashboard.no_upcoming' | translate }}</p>
          }
        </mat-card-content>
      </mat-card>

      @if (auth.isAdmin()) {
        <mat-card class="dashboard-card admin-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="card-icon approval-icon">assignment</mat-icon>
            <mat-card-title>{{ 'dashboard.admin.pending_approvals' | translate }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (adminPendingVacations().length > 0) {
              <div class="pending-list">
                @for (v of adminPendingVacations().slice(0, 3); track v.id) {
                  <div class="pending-item">
                    <span class="pending-name">{{ v.user_name }}</span>
                    <span class="pending-dates">{{ v.start_date | date:'shortDate' }} - {{ v.end_date | date:'shortDate' }}</span>
                  </div>
                }
              </div>
              <a mat-button color="primary" routerLink="/admin/requests">{{ 'dashboard.admin.view_all' | translate }}</a>
            } @else {
              <p class="no-data">{{ 'dashboard.admin.no_pending' | translate }}</p>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card admin-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="card-icon team-icon">groups</mat-icon>
            <mat-card-title>{{ 'dashboard.admin.team_status' | translate }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (absentToday().length > 0) {
              <div class="pending-list">
                @for (v of absentToday(); track v.id) {
                  <div class="pending-item">
                    <span class="pending-name">{{ v.user_name }}</span>
                  </div>
                }
              </div>
            } @else {
              <p class="no-data">{{ 'dashboard.admin.no_absences' | translate }}</p>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    .dashboard-card {
      padding: 8px;
    }
    .card-icon {
      font-size: 28px;
      height: 40px;
      width: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: white;
    }
    .remaining-icon { background-color: #4caf50; }
    .pending-icon { background-color: #ff9800; }
    .next-icon { background-color: #2196f3; }
    .approval-icon { background-color: #f44336; }
    .team-icon { background-color: #9c27b0; }
    .big-number {
      font-size: 36px;
      font-weight: 600;
      color: #333;
      margin-top: 8px;
    }
    .big-label {
      color: rgba(0, 0, 0, 0.54);
      font-size: 14px;
    }
    .next-vacation-info {
      margin-top: 8px;
    }
    .next-date {
      font-size: 20px;
      font-weight: 500;
      display: block;
    }
    .next-label {
      color: rgba(0, 0, 0, 0.54);
      font-size: 13px;
    }
    .no-data {
      color: rgba(0, 0, 0, 0.38);
      font-style: italic;
      margin-top: 8px;
    }
    .admin-card {
      border-left: 4px solid #ff8f00;
    }
    .pending-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
    }
    .pending-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      border-bottom: 1px solid #eee;
    }
    .pending-name {
      font-weight: 500;
    }
    .pending-dates {
      color: rgba(0, 0, 0, 0.54);
      font-size: 13px;
    }
  `],
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private vacationService = inject(VacationService);
  private adminService = inject(AdminService);

  private myVacations = signal<Vacation[]>([]);
  adminPendingVacations = signal<Vacation[]>([]);
  private allVacations = signal<Vacation[]>([]);

  pendingCount = computed(() =>
    this.myVacations().filter(v => v.status === 'pending').length
  );

  nextVacation = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = this.myVacations()
      .filter(v => v.status === 'approved' && v.start_date >= today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    return upcoming.length > 0 ? upcoming[0] : null;
  });

  absentToday = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.allVacations().filter(
      v => v.status === 'approved' && v.start_date <= today && v.end_date >= today
    );
  });

  ngOnInit(): void {
    this.vacationService.getMyVacations().subscribe(v => this.myVacations.set(v));

    if (this.auth.isAdmin()) {
      this.adminService.getPendingVacations().subscribe(v => this.adminPendingVacations.set(v));
      this.vacationService.getTeamVacations().subscribe(v => this.allVacations.set(v));
    }
  }
}
