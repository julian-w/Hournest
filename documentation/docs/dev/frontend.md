# Frontend

Das Frontend ist eine Angular 18 Single Page Application (SPA) mit Angular Material als UI-Bibliothek.

---

## Projektstruktur

```
frontend/src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts          # Schuetzt authentifizierte Routen
│   │   └── admin.guard.ts         # Schuetzt Admin-Routen
│   ├── interceptors/
│   │   └── credentials.interceptor.ts  # Setzt withCredentials fuer Sanctum-Cookies
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── vacation.model.ts
│   │   ├── holiday.model.ts
│   │   ├── work-schedule.model.ts
│   │   ├── vacation-ledger-entry.model.ts
│   │   └── setting.model.ts
│   ├── services/
│   │   ├── auth.service.ts         # Login, Logout, User-Info
│   │   ├── vacation.service.ts     # Urlaubsantraege CRUD
│   │   ├── admin.service.ts        # Admin-Operationen
│   │   ├── holiday.service.ts      # Feiertage
│   │   ├── vacation-ledger.service.ts  # Urlaubskonto
│   │   └── settings.service.ts     # Globale Einstellungen
│   └── mock/
│       ├── mock.service.ts         # Mock-Modus-Verwaltung
│       ├── mock.interceptor.ts     # HTTP-Interceptor fuer Mock-Daten
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
├── shared/                         # Gemeinsame Komponenten
├── app.component.ts                # Root-Komponente (Toolbar, Sidenav)
├── app.config.ts                   # App-Konfiguration (Providers)
└── app.routes.ts                   # Routing-Definition
```

---

## Standalone Components

Hournest verwendet ausschliesslich **Standalone Components** (keine NgModules). Jede Komponente deklariert ihre eigenen Imports:

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

Alle Services liegen unter `core/services/` und kapseln die HTTP-Kommunikation mit dem Backend:

| Service               | Aufgabe                                       |
|-----------------------|-----------------------------------------------|
| `AuthService`         | Login, Logout, aktuellen User abrufen         |
| `VacationService`     | Urlaube laden, erstellen, loeschen            |
| `AdminService`        | Offene Antraege, User-Verwaltung, Review      |
| `HolidayService`      | Feiertage CRUD                                |
| `VacationLedgerService`| Urlaubskonto-Eintraege laden und erstellen   |
| `SettingsService`     | Globale Einstellungen laden und speichern     |

### Guards

| Guard        | Zweck                                               |
|--------------|-----------------------------------------------------|
| `authGuard`  | Prueft ob der Benutzer eingeloggt ist, sonst Redirect zu `/login` |
| `adminGuard` | Prueft ob der Benutzer admin oder superadmin ist    |

### Interceptors

| Interceptor              | Zweck                                       |
|--------------------------|---------------------------------------------|
| `credentialsInterceptor` | Setzt `withCredentials: true` fuer alle API-Anfragen, damit Sanctum-Session-Cookies mitgesendet werden |

### Models

TypeScript-Interfaces fuer alle Datentypen. Beispiel:

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

Admin-Routen sind doppelt geschuetzt: sowohl `authGuard` als auch `adminGuard` muessen bestanden werden.

---

## Angular Signals

Hournest nutzt Angular Signals fuer reaktives State-Management, wo es sinnvoll ist. Signals ersetzen teilweise die Verwendung von BehaviorSubjects und RxJS-Streams fuer lokalen Component-State.

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

Das Theme verwendet die Farben **Amber** (Primaer) und **Deep Orange** (Akzent) mit einem dunklen Standardmodus (Slate). Ein Umschalter zwischen Hell- und Dunkelmodus ist verfuegbar.

---

## Internationalisierung (i18n)

Die Uebersetzung erfolgt zur Laufzeit ueber `ngx-translate`. Kein separater Build pro Sprache erforderlich.

### Struktur

```
frontend/src/assets/i18n/
├── de.json     # Deutsche Uebersetzungen
└── en.json     # Englische Uebersetzungen
```

### Verwendung in Templates

```html
<h1>{{ 'DASHBOARD.TITLE' | translate }}</h1>
```

### Neue Uebersetzungsschluessel hinzufuegen

1. Oeffne `src/assets/i18n/de.json` und fuege den neuen Schluessel hinzu
2. Oeffne `src/assets/i18n/en.json` und fuege die englische Uebersetzung hinzu
3. Verwende den Schluessel im Template mit der `translate`-Pipe

!!! warning "Vollstaendigkeit"
    Stelle sicher, dass jeder Schluessel in **beiden** Sprachdateien vorhanden ist. Fehlende Schluessel werden als Rohtext angezeigt.

---

## Styles und Theming

- **SCSS** wird als CSS-Praeprozessor verwendet
- Globale Styles liegen in `src/styles.scss`
- Komponenten-spezifische Styles in den jeweiligen `.scss`-Dateien
- Das Material-Theme wird in der `angular.json` konfiguriert
- Farben: Amber (Primaer), Deep Orange (Akzent)
