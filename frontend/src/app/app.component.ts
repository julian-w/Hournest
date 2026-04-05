import { Component, inject, ViewChild, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from './core/services/auth.service';
import { ConfigService } from './core/services/config.service';
import { MockService } from './core/mock/mock.service';
import { MockToolbarComponent } from './core/mock/mock-toolbar.component';
import { ChangePasswordDialogComponent } from './features/auth/change-password-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
    MatMenuModule,
    MatDialogModule,
    TranslateModule,
    MockToolbarComponent,
  ],
  template: `
    @if (auth.isLoggedIn()) {
      <mat-sidenav-container class="app-container">
        <mat-sidenav #sidenav [mode]="isMobile() ? 'over' : 'side'"
                     [opened]="!isMobile()">
          <mat-nav-list>
            <a mat-list-item routerLink="/dashboard" routerLinkActive="active" (click)="closeSidenav()">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>{{ 'nav.dashboard' | translate }}</span>
            </a>
            <a mat-list-item routerLink="/calendar" routerLinkActive="active" (click)="closeSidenav()">
              <mat-icon matListItemIcon>calendar_month</mat-icon>
              <span matListItemTitle>{{ 'nav.calendar' | translate }}</span>
            </a>
            <a mat-list-item routerLink="/my-vacations" routerLinkActive="active" (click)="closeSidenav()">
              <mat-icon matListItemIcon>beach_access</mat-icon>
              <span matListItemTitle>{{ 'nav.my_vacations' | translate }}</span>
            </a>
            <a mat-list-item routerLink="/time-tracking" routerLinkActive="active" (click)="closeSidenav()">
              <mat-icon matListItemIcon>timer</mat-icon>
              <span matListItemTitle>{{ 'nav.time_tracking' | translate }}</span>
            </a>
            <a mat-list-item routerLink="/my-absences" routerLinkActive="active" (click)="closeSidenav()">
              <mat-icon matListItemIcon>sick</mat-icon>
              <span matListItemTitle>{{ 'nav.my_absences' | translate }}</span>
            </a>
            @if (auth.isAdmin()) {
              <mat-divider></mat-divider>
              <div class="nav-section-label">{{ 'nav.admin' | translate }}</div>
              <a mat-list-item routerLink="/admin/requests" routerLinkActive="active" (click)="closeSidenav()">
                <mat-icon matListItemIcon>pending_actions</mat-icon>
                <span matListItemTitle>{{ 'nav.requests' | translate }}</span>
              </a>
              <a mat-list-item routerLink="/admin/users" routerLinkActive="active" (click)="closeSidenav()">
                <mat-icon matListItemIcon>people</mat-icon>
                <span matListItemTitle>{{ 'nav.users' | translate }}</span>
              </a>
              <a mat-list-item routerLink="/admin/holidays" routerLinkActive="active" (click)="closeSidenav()">
                <mat-icon matListItemIcon>event</mat-icon>
                <span matListItemTitle>{{ 'nav.holidays' | translate }}</span>
              </a>
              <a mat-list-item routerLink="/admin/blackouts" routerLinkActive="active" (click)="closeSidenav()">
                <mat-icon matListItemIcon>event_busy</mat-icon>
                <span matListItemTitle>{{ 'nav.blackouts' | translate }}</span>
              </a>
              <a mat-list-item routerLink="/admin/cost-centers" routerLinkActive="active" (click)="closeSidenav()">
                <mat-icon matListItemIcon>account_tree</mat-icon>
                <span matListItemTitle>{{ 'nav.cost_centers' | translate }}</span>
              </a>
              <a mat-list-item routerLink="/admin/user-groups" routerLinkActive="active" (click)="closeSidenav()">
                <mat-icon matListItemIcon>group_work</mat-icon>
                <span matListItemTitle>{{ 'nav.user_groups' | translate }}</span>
              </a>
              <a mat-list-item routerLink="/admin/absences" routerLinkActive="active" (click)="closeSidenav()">
                <mat-icon matListItemIcon>event_busy</mat-icon>
                <span matListItemTitle>{{ 'nav.absences' | translate }}</span>
              </a>
              <a mat-list-item routerLink="/admin/reports" routerLinkActive="active" (click)="closeSidenav()">
                <mat-icon matListItemIcon>assessment</mat-icon>
                <span matListItemTitle>{{ 'nav.reports' | translate }}</span>
              </a>
              <a mat-list-item routerLink="/admin/settings" routerLinkActive="active" (click)="closeSidenav()">
                <mat-icon matListItemIcon>settings</mat-icon>
                <span matListItemTitle>{{ 'nav.settings' | translate }}</span>
              </a>
            }
          </mat-nav-list>
        </mat-sidenav>

        <mat-sidenav-content>
          <mat-toolbar color="primary">
            @if (isMobile()) {
              <button mat-icon-button (click)="sidenav.toggle()">
                <mat-icon>menu</mat-icon>
              </button>
            }
            <span class="app-name">{{ 'app.name' | translate }}</span>
            <span class="spacer"></span>
            <button mat-button [matMenuTriggerFor]="langMenu" class="lang-btn">
              <mat-icon>language</mat-icon>
              {{ currentLang() === 'de' ? 'DE' : 'EN' }}
            </button>
            <mat-menu #langMenu="matMenu">
              <button mat-menu-item (click)="switchLanguage('en')">
                {{ 'language.en' | translate }}
              </button>
              <button mat-menu-item (click)="switchLanguage('de')">
                {{ 'language.de' | translate }}
              </button>
            </mat-menu>
            @if (!configService.isOAuthEnabled()) {
              <button mat-icon-button (click)="openChangePassword()" [matTooltip]="'password.change_title' | translate">
                <mat-icon>key</mat-icon>
              </button>
            }
            <span class="user-info">{{ auth.user()?.display_name }}</span>
            <button mat-icon-button (click)="auth.logout()" [matTooltip]="'app.logout' | translate">
              <mat-icon>logout</mat-icon>
            </button>
          </mat-toolbar>
          <main class="content">
            <router-outlet />
          </main>
        </mat-sidenav-content>
      </mat-sidenav-container>
    } @else {
      <router-outlet />
    }
    @if (mockService.isActive()) {
      <app-mock-toolbar />
    }
  `,
  styles: [`
    .app-container {
      height: 100vh;
    }
    mat-sidenav {
      width: 240px;
    }
    .nav-section-label {
      padding: 16px 16px 4px;
      font-size: 12px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.54);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .active {
      background-color: rgba(255, 152, 0, 0.12) !important;
      --mdc-list-list-item-label-text-color: #e65100 !important;
      --mdc-list-list-item-leading-icon-color: #e65100 !important;
      --mdc-list-list-item-hover-label-text-color: #e65100 !important;
      --mdc-list-list-item-hover-leading-icon-color: #e65100 !important;
      --mdc-list-list-item-focus-label-text-color: #e65100 !important;
      --mdc-list-list-item-focus-leading-icon-color: #e65100 !important;
      --mat-list-active-indicator-color: rgba(255, 152, 0, 0.12) !important;
    }
    mat-sidenav a[mat-list-item] {
      --mdc-list-list-item-hover-label-text-color: rgba(0, 0, 0, 0.87) !important;
      --mdc-list-list-item-focus-label-text-color: rgba(0, 0, 0, 0.87) !important;
      --mdc-list-list-item-hover-leading-icon-color: rgba(0, 0, 0, 0.54) !important;
      --mdc-list-list-item-focus-leading-icon-color: rgba(0, 0, 0, 0.54) !important;
      --mat-list-active-indicator-color: transparent !important;
      --mdc-list-list-item-pressed-label-text-color: rgba(0, 0, 0, 0.87) !important;
      --mdc-list-list-item-pressed-leading-icon-color: rgba(0, 0, 0, 0.54) !important;
    }
    mat-sidenav a[mat-list-item].active {
      --mdc-list-list-item-hover-label-text-color: #e65100 !important;
      --mdc-list-list-item-focus-label-text-color: #e65100 !important;
      --mdc-list-list-item-hover-leading-icon-color: #e65100 !important;
      --mdc-list-list-item-focus-leading-icon-color: #e65100 !important;
      --mdc-list-list-item-pressed-label-text-color: #e65100 !important;
      --mdc-list-list-item-pressed-leading-icon-color: #e65100 !important;
    }
    mat-toolbar {
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .app-name {
      font-weight: 600;
      margin-left: 8px;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .user-info {
      font-size: 14px;
      margin-right: 8px;
    }
    .lang-btn {
      margin-right: 8px;
      min-width: auto;
    }
    .content {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
  `],
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  configService = inject(ConfigService);
  mockService = inject(MockService);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isMobile = signal(false);
  currentLang = signal('en');

  private breakpointObserver = inject(BreakpointObserver);

  ngOnInit(): void {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile.set(result.matches);
    });

    const savedLang = localStorage.getItem('hournest_lang') || 'en';
    this.translate.use(savedLang);
    this.currentLang.set(savedLang);
  }

  switchLanguage(lang: string): void {
    this.translate.use(lang);
    this.currentLang.set(lang);
    localStorage.setItem('hournest_lang', lang);
  }

  openChangePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '400px',
      data: { forced: false },
    });
  }

  closeSidenav(): void {
    if (this.isMobile() && this.sidenav) {
      this.sidenav.close();
    }
  }
}
