# Frontend

Das Frontend ist eine Angular 18 Single Page Application (SPA) mit Angular Material als UI-Bibliothek.

---

## Projektstruktur

```
frontend/src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts          # Schützt authentifizierte Routen
│   │   └── admin.guard.ts         # Schützt Admin-Routen
│   ├── interceptors/
│   │   └── credentials.interceptor.ts  # Setzt withCredentials für Sanctum-Cookies
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── vacation.model.ts
│   │   ├── holiday.model.ts
│   │   ├── work-schedule.model.ts
│   │   ├── vacation-ledger-entry.model.ts
│   │   └── setting.model.ts
│   ├── services/
│   │   ├── auth.service.ts         # Login, Logout, User-Info
│   │   ├── vacation.service.ts     # Urlaubsanträge CRUD
│   │   ├── admin.service.ts        # Admin-Operationen
│   │   ├── holiday.service.ts      # Feiertage
│   │   ├── vacation-ledger.service.ts  # Urlaubskonto
│   │   └── settings.service.ts     # Globale Einstellungen
│   └── mock/
│       ├── mock.service.ts         # Mock-Modus-Verwaltung
│       ├── mock.interceptor.ts     # HTTP-Interceptor für Mock-Daten
│       ├── mock-data.ts            # Testdaten
│       └── mock-toolbar.component.ts  # Rollen-Umschalter
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
├── app.component.ts                # Root-Komponente (Toolbar, Sidenav)
├── app.config.ts                   # App-Konfiguration (Providers)
└── app.routes.ts                   # Routing-Definition
```

---

## Standalone Components

Hournest verwendet ausschließlich **Standalone Components** (keine NgModules). Jede Komponente deklariert ihre eigenen Imports:

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, TranslateModule],
  template: `<h2>{{ 'dashboard.title' | translate }}</h2>`,
})
export class DashboardComponent { }
```

Aktueller Hinweis: Die Anwendung verwendet überwiegend **inline templates** und **inline styles** in den Standalone-Komponenten.

---

## Core Layer

### Services

Alle Services liegen unter `core/services/` und kapseln die HTTP-Kommunikation mit dem Backend:

| Service               | Aufgabe                                       |
|-----------------------|-----------------------------------------------|
| `AuthService`         | Login, Logout, aktuellen User abrufen         |
| `VacationService`     | Urlaube laden, erstellen, löschen            |
| `AdminService`        | Offene Anträge, User-Verwaltung, Review      |
| `HolidayService`      | Feiertage CRUD                                |
| `VacationLedgerService`| Urlaubskonto-Einträge laden und erstellen   |
| `SettingsService`     | Globale Einstellungen laden und speichern     |

### Guards

| Guard        | Zweck                                               |
|--------------|-----------------------------------------------------|
| `authGuard`  | Prüft ob der Benutzer eingeloggt ist, sonst Redirect zu `/login` |
| `adminGuard` | Prüft ob der Benutzer admin oder superadmin ist    |

### Interceptors

| Interceptor              | Zweck                                       |
|--------------------------|---------------------------------------------|
| `credentialsInterceptor` | Setzt `withCredentials: true` für alle API-Anfragen, damit Sanctum-Session-Cookies mitgesendet werden |

### Models

TypeScript-Interfaces für alle Datentypen. Beispiel:

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

## Routing und Lazy Loading

Alle Feature-Routen werden per **Lazy Loading** geladen. Die Routing-Konfiguration befindet sich in `app.routes.ts`:

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

Admin-Routen sind doppelt geschützt: sowohl `authGuard` als auch `adminGuard` müssen bestanden werden.

Aktueller Hinweis: Neben den hier gezeigten Kernrouten existieren inzwischen weitere Feature-Routen, u.a. für **Absences**, **Time Tracking**, **Cost Centers**, **User Groups** und **Blackouts**.

---

## Angular Signals

Hournest nutzt Angular Signals für reaktives State-Management, wo es sinnvoll ist. Signals ersetzen teilweise die Verwendung von BehaviorSubjects und RxJS-Streams für lokalen Component-State.

Aktueller Hinweis: Zusätzlich gibt es inzwischen Spec-Dateien für alle Services unter `core/services/` sowie erste Feature-Komponenten-Tests.

---

## Angular Material

Die gesamte UI basiert auf Angular Material-Komponenten:

- `MatToolbar` -- Kopfzeile
- `MatSidenav` -- Seitennavigation
- `MatCard` -- Dashboard-Karten, Formulare
- `MatTable` -- Listen und Tabellen
- `MatDialog` -- Dialoge (z.B. Urlaubsantrag, Feiertag erstellen)
- `MatButton`, `MatIconButton` -- Aktionsbuttons
- `MatFormField`, `MatInput`, `MatSelect`, `MatDatepicker` -- Formularfelder
- `MatChip` -- Status-Anzeige
- `MatSnackBar` -- Benachrichtigungen

### Theming

Das Theme verwendet die Farben **Amber** (Primär) und **Deep Orange** (Akzent) mit einem dunklen Standardmodus (Slate). Ein Umschalter zwischen Hell- und Dunkelmodus ist verfügbar.

---

## Internationalisierung (i18n)

Die Übersetzung erfolgt zur Laufzeit über `ngx-translate`. Kein separater Build pro Sprache erforderlich.

### Struktur

```
frontend/src/assets/i18n/
├── de.json     # Deutsche Übersetzungen
└── en.json     # Englische Übersetzungen
```

### Verwendung in Templates

```html
<h1>{{ 'DASHBOARD.TITLE' | translate }}</h1>
```

### Neue Übersetzungsschlüssel hinzufügen

1. Öffne `src/assets/i18n/de.json` und füge den neuen Schlüssel hinzu
2. Öffne `src/assets/i18n/en.json` und füge die englische Übersetzung hinzu
3. Verwende den Schlüssel im Template mit der `translate`-Pipe

!!! warning "Vollständigkeit"
    Stelle sicher, dass jeder Schlüssel in **beiden** Sprachdateien vorhanden ist. Fehlende Schlüssel werden als Rohtext angezeigt.

---

## Styles und Theming

- **SCSS** wird als CSS-Präprozessor verwendet
- Globale Styles liegen in `src/styles.scss`
- Komponenten-spezifische Styles in den jeweiligen `.scss`-Dateien
- Das Material-Theme wird in der `angular.json` konfiguriert
- Farben: Amber (Primär), Deep Orange (Akzent)
