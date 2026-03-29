import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'calendar',
    canActivate: [authGuard],
    loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent),
  },
  {
    path: 'my-vacations',
    canActivate: [authGuard],
    loadComponent: () => import('./features/vacation/my-vacations.component').then(m => m.MyVacationsComponent),
  },
  {
    path: 'admin/requests',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/requests/admin-requests.component').then(m => m.AdminRequestsComponent),
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/users/admin-users.component').then(m => m.AdminUsersComponent),
  },
  {
    path: 'admin/holidays',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/holidays/admin-holidays.component').then(m => m.AdminHolidaysComponent),
  },
  {
    path: 'admin/blackouts',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/blackouts/admin-blackouts.component').then(m => m.AdminBlackoutsComponent),
  },
  {
    path: 'admin/settings',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/settings/admin-settings.component').then(m => m.AdminSettingsComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
