# Frontend

The frontend is an Angular 18 Single Page Application (SPA) with Angular Material as the UI library.

---

## Project Structure

```
frontend/src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts          # Protects authenticated routes
│   │   └── admin.guard.ts         # Protects admin routes
│   ├── interceptors/
│   │   └── credentials.interceptor.ts  # Sets withCredentials for Sanctum cookies
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── vacation.model.ts
│   │   ├── holiday.model.ts
│   │   ├── work-schedule.model.ts
│   │   ├── vacation-ledger-entry.model.ts
│   │   └── setting.model.ts
│   ├── services/
│   │   ├── auth.service.ts         # Login, logout, fetch current user
│   │   ├── vacation.service.ts     # Vacations CRUD
│   │   ├── admin.service.ts        # Admin operations
│   │   ├── holiday.service.ts      # Holidays
│   │   ├── vacation-ledger.service.ts  # Vacation account
│   │   └── settings.service.ts     # Global settings
│   └── mock/
│       ├── mock.service.ts         # Mock mode management
│       ├── mock.interceptor.ts     # HTTP interceptor for mock data
│       ├── mock-data.ts            # Test data
│       └── mock-toolbar.component.ts  # Role switcher
├── features/
│   ├── login/
│   │   └── login.component.ts
│   ├── dashboard/
│   │   └── dashboard.component.ts
│   ├── calendar/
│   │   └── calendar.component.ts
│   ├── vacation/
│   │   ├── my-vacations.component.ts
│   │   └── vacation-dialog.component.ts
│   └── admin/
│       ├── requests/
│       │   └── admin-requests.component.ts
│       ├── users/
│       │   └── admin-users.component.ts
│       ├── holidays/
│       │   ├── admin-holidays.component.ts
│       │   └── holiday-dialog.component.ts
│       └── settings/
│           └── admin-settings.component.ts
├── shared/                         # Shared components
├── app.component.ts                # Root component (toolbar, sidenav)
├── app.config.ts                   # App configuration (providers)
└── app.routes.ts                   # Route definitions
```

---

## Standalone Components

Hournest exclusively uses **Standalone Components** (no NgModules). Each component declares its own imports:

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, TranslateModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent { }
```

---

## Core Layer

### Services

All services are located under `core/services/` and encapsulate HTTP communication with the backend:

| Service               | Purpose                                       |
|-----------------------|-----------------------------------------------|
| `AuthService`         | Login, logout, fetch current user             |
| `VacationService`     | Load, create, delete vacations                |
| `AdminService`        | Pending requests, user management, review     |
| `HolidayService`      | Holidays CRUD                                 |
| `VacationLedgerService`| Load and create vacation account entries     |
| `SettingsService`     | Load and save global settings                 |

### Guards

| Guard        | Purpose                                             |
|--------------|-----------------------------------------------------|
| `authGuard`  | Checks if user is logged in, otherwise redirects to `/login` |
| `adminGuard` | Checks if user is admin or superadmin               |

### Interceptors

| Interceptor              | Purpose                                     |
|--------------------------|---------------------------------------------|
| `credentialsInterceptor` | Sets `withCredentials: true` for all API requests so Sanctum session cookies are sent |

### Models

TypeScript interfaces for all data types. Example:

```typescript
export interface User {
  id: number;
  email: string;
  display_name: string;
  role: 'employee' | 'admin' | 'superadmin';
  vacation_days_per_year: number;
  remaining_vacation_days: number;
  holidays_exempt: boolean;
  weekend_worker: boolean;
}
```

---

## Routing and Lazy Loading

All feature routes are loaded via **lazy loading**. The routing configuration is in `app.routes.ts`:

```typescript
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'calendar', canActivate: [authGuard], loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent) },
  { path: 'my-vacations', canActivate: [authGuard], loadComponent: () => import('./features/vacation/my-vacations.component').then(m => m.MyVacationsComponent) },
  { path: 'admin/requests', canActivate: [authGuard, adminGuard], loadComponent: () => ... },
  { path: 'admin/users', canActivate: [authGuard, adminGuard], loadComponent: () => ... },
  { path: 'admin/holidays', canActivate: [authGuard, adminGuard], loadComponent: () => ... },
  { path: 'admin/settings', canActivate: [authGuard, adminGuard], loadComponent: () => ... },
  { path: '**', redirectTo: 'dashboard' },
];
```

Admin routes are double-protected: both `authGuard` and `adminGuard` must pass.

---

## Angular Signals

Hournest uses Angular Signals for reactive state management where appropriate. Signals partially replace the use of BehaviorSubjects and RxJS streams for local component state.

---

## Angular Material

The entire UI is built on Angular Material components:

- `MatToolbar` -- header bar
- `MatSidenav` -- side navigation
- `MatCard` -- dashboard cards, forms
- `MatTable` -- lists and tables
- `MatDialog` -- dialogs (e.g., vacation request, create holiday)
- `MatButton`, `MatIconButton` -- action buttons
- `MatFormField`, `MatInput`, `MatSelect`, `MatDatepicker` -- form fields
- `MatChip` -- status display
- `MatSnackBar` -- notifications

### Theming

The theme uses the colors **Amber** (primary) and **Deep Orange** (accent) with a dark default mode (Slate). A toggle between light and dark mode is available.

---

## Internationalization (i18n)

Translation is done at runtime via `ngx-translate`. No separate build per language is required.

### Structure

```
frontend/src/assets/i18n/
├── de.json     # German translations
└── en.json     # English translations
```

### Usage in Templates

```html
<h1>{{ 'DASHBOARD.TITLE' | translate }}</h1>
```

### Adding New Translation Keys

1. Open `src/assets/i18n/de.json` and add the new key
2. Open `src/assets/i18n/en.json` and add the English translation
3. Use the key in the template with the `translate` pipe

!!! warning "Completeness"
    Make sure every key is present in **both** language files. Missing keys will be displayed as raw text.

---

## Styles and Theming

- **SCSS** is used as the CSS preprocessor
- Global styles are in `src/styles.scss`
- Component-specific styles in their respective `.scss` files
- The Material theme is configured in `angular.json`
- Colors: Amber (primary), Deep Orange (accent)
