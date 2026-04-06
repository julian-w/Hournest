# Backend

Das Backend ist eine Laravel 13 REST-API, die alle Geschäftslogik und Datenverwaltung bereitstellt.

---

## Projektstruktur

```
backend/
├── app/
│   ├── Enums/                    # PHP-Enums
│   │   ├── UserRole.php          # employee, admin, superadmin
│   │   ├── VacationStatus.php    # pending, approved, rejected
│   │   ├── HolidayType.php       # fixed, variable
│   │   └── LedgerEntryType.php   # entitlement, carryover, bonus, taken, expired, adjustment
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── VacationController.php
│   │   │   ├── AdminController.php
│   │   │   ├── HolidayController.php
│   │   │   ├── SettingController.php
│   │   │   ├── WorkScheduleController.php
│   │   │   └── VacationLedgerController.php
│   │   ├── Middleware/
│   │   │   └── EnsureAdmin.php
│   │   ├── Requests/             # Form Requests (Validierung)
│   │   └── Resources/            # API Resources (JSON-Transformation)
│   └── Models/
│       ├── User.php
│       ├── Vacation.php
│       ├── Holiday.php
│       ├── WorkSchedule.php
│       ├── VacationLedgerEntry.php
│       └── Setting.php
├── database/
│   ├── factories/                # Test-Factories
│   ├── migrations/               # Datenbank-Migrationen
│   └── seeders/                  # Datenbank-Seeder
├── routes/
│   └── api.php                   # Alle API-Routen
├── config/                       # Laravel-Konfiguration
└── tests/
    ├── Feature/                  # Feature-Tests (HTTP-basiert)
    └── Unit/                     # Unit-Tests
```

---

## Models und Beziehungen

### User

- `hasMany(Vacation)` -- eigene Urlaubsanträge
- `hasMany(Vacation, 'reviewed_by')` -- genehmigte/abgelehnte Anträge
- `hasMany(WorkSchedule)` -- individuelle Arbeitszeitmodelle
- `hasMany(VacationLedgerEntry)` -- Urlaubskonto-Buchungen
- Verwendet **SoftDeletes** und **HasFactory**
- Wichtige Methoden:
    - `isAdmin()` -- prüft ob Rolle admin oder superadmin ist
    - `getActiveWorkSchedule(Carbon $date)` -- gibt aktives Arbeitszeitmodell für ein Datum zurück
    - `isWorkDay(Carbon $date)` -- prüft ob ein Datum ein Arbeitstag ist (berücksichtigt Arbeitszeitmodell, Feiertage, Flags)
    - `remainingVacationDays(int $year)` -- berechnet Resturlaub aus Urlaubskonto

### Vacation

- `belongsTo(User)` -- der beantragende Mitarbeiter
- `belongsTo(User, 'reviewed_by')` -- der genehmigende/ablehnende Admin
- `hasMany(VacationLedgerEntry)` -- zugehörige Konto-Buchungen
- Verwendet **SoftDeletes** und **HasFactory**
- Wichtige Methoden:
    - `countWorkdays(int $year)` -- zählt Arbeitstage im Urlaubszeitraum (berücksichtigt individuelles Arbeitszeitmodell)

### Holiday

- Keine Beziehungen
- Felder: `name`, `date`, `type`

### WorkSchedule

- `belongsTo(User)`
- Felder: `user_id`, `start_date`, `end_date`, `work_days` (JSON-Array)

### VacationLedgerEntry

- `belongsTo(User)`
- `belongsTo(Vacation)` -- optional, nur bei Typ "taken"
- Felder: `user_id`, `year`, `type`, `days`, `comment`, `vacation_id`

### Setting

- Key-Value-Store
- Statische Methoden: `Setting::get(key, default)`, `Setting::set(key, value)`

---

## Enums

### UserRole

```php
enum UserRole: string
{
    case Employee = 'employee';
    case Admin = 'admin';
    case Superadmin = 'superadmin';
}
```

### VacationStatus

```php
enum VacationStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
}
```

### HolidayType

```php
enum HolidayType: string
{
    case Fixed = 'fixed';
    case Variable = 'variable';
}
```

### LedgerEntryType

```php
enum LedgerEntryType: string
{
    case Entitlement = 'entitlement';
    case Carryover = 'carryover';
    case Bonus = 'bonus';
    case Taken = 'taken';
    case Expired = 'expired';
    case Adjustment = 'adjustment';
}
```

---

## Controllers

### AuthController

- `redirect()` -- leitet zu OIDC-Provider weiter
- `callback()` -- verarbeitet OIDC-Callback, erstellt/aktualisiert Benutzer, setzt Session
- `login()` -- Superadmin-Login mit Benutzername/Passwort
- `logout()` -- Session beenden

### VacationController

- `index()` -- alle genehmigten Urlaube (für Kalender)
- `mine()` -- eigene Urlaube des angemeldeten Benutzers
- `store()` -- neuen Urlaubsantrag erstellen (mit Überlappungsprüfung)
- `destroy()` -- offenen Antrag stornieren (nur Pending, nur eigene)

### AdminController

- `pendingVacations()` -- alle offenen Anträge
- `reviewVacation()` -- Antrag genehmigen/ablehnen (erstellt automatisch Ledger-Eintrag bei Genehmigung)
- `users()` -- alle Benutzer auflisten
- `updateUser()` -- Benutzer-Einstellungen ändern

### HolidayController

- `index()` -- Feiertage auflisten (mit optionalem Jahresfilter)
- `store()` -- Feiertag erstellen (Admin)
- `update()` -- Feiertag bearbeiten (Admin)
- `destroy()` -- Feiertag löschen (Admin)

### SettingController

- `index()` -- alle Einstellungen auflisten
- `update()` -- Einstellungen aktualisieren (Admin)

### WorkScheduleController

- `index()` -- Arbeitszeitmodelle eines Benutzers auflisten
- `store()` -- neues Arbeitszeitmodell erstellen
- `update()` -- Arbeitszeitmodell bearbeiten
- `destroy()` -- Arbeitszeitmodell löschen

### VacationLedgerController

- `index()` -- eigene Urlaubskonto-Buchungen (mit Jahresfilter)
- `adminIndex()` -- Urlaubskonto-Buchungen eines bestimmten Benutzers (Admin)
- `store()` -- neue Buchung erstellen (Admin)

---

## Middleware

### EnsureAdmin

Die Middleware `EnsureAdmin` schützt alle Admin-Routen. Sie prüft, ob der authentifizierte Benutzer die Rolle `admin` oder `superadmin` hat. Andernfalls wird ein 403-Fehler zurückgegeben.

---

## Form Requests und Validierung

Alle eingehenden Daten werden über Form Requests validiert:

- **StoreVacationRequest** -- start_date (required, date, after_or_equal:today), end_date (required, date, after_or_equal:start_date)
- **ReviewVacationRequest** -- status (required, in:approved,rejected), comment (optional, string)
- **UpdateUserRequest** -- role (optional, in:employee,admin), vacation_days_per_year (optional, integer, min:0)
- **StoreHolidayRequest** -- name (required, string), date (required, date), type (required, in:fixed,variable)
- **UpdateHolidayRequest** -- analog zu StoreHolidayRequest
- **UpdateSettingsRequest** -- settings (required, array)
- **StoreWorkScheduleRequest** -- start_date (required, date), end_date (optional, date), work_days (required, array)
- **StoreVacationLedgerEntryRequest** -- year (optional, integer), type (required), days (required, numeric), comment (optional, string)

---

## Geschäftslogik

### Arbeitstage-Berechnung

Die Methode `User::isWorkDay(Carbon $date)` prüft für ein gegebenes Datum:

1. Gibt es ein aktives Arbeitszeitmodell? Falls ja, verwende dessen Arbeitstage
2. Falls nein, verwende die globalen Standard-Arbeitstage aus den Settings
3. Ist der Tag im Arbeitstage-Array enthalten?
4. Sonderfall: `weekend_worker`-Flag überschreibt Wochenendprüfung
5. Ist der Tag ein Feiertag? (Ausser `holidays_exempt` ist gesetzt)

### Resturlaub-Berechnung

Die Methode `User::remainingVacationDays(int $year)`:

1. Summiere alle Ledger-Einträge für das gegebene Jahr
2. Falls keine Einträge vorhanden: Fallback auf `vacation_days_per_year - genehmigte Arbeitstage`

### Urlaubsgenehmigung

Bei Genehmigung eines Antrags (`AdminController::reviewVacation()`):

1. Status auf `approved` setzen
2. Arbeitstage im Urlaubszeitraum zählen (über `Vacation::countWorkdays()`)
3. Automatisch einen Ledger-Eintrag vom Typ `taken` erstellen

---

## Seeder

Der Datenbank-Seeder erstellt Testdaten für die lokale Entwicklung. Er kann mit `php artisan db:seed` ausgeführt werden.

---

## Aktueller Hinweis

Einige Frontend-Bereiche sind im Projekt bereits weiter vorbereitet als die hier dokumentierten stabilen Backend-Funktionen. Das betrifft vor allem spätere Komfortfunktionen und weiterführende Auswertungen im Zeitbuchungsbereich. Wenn eine Funktion in `CONCEPT.md` als geplant beschrieben ist, sollte für den Ist-Zustand immer zusätzlich geprüft werden, ob dafür bereits echte Laravel-Routen und Controller in `backend/routes/api.php` und `backend/app/Http/Controllers` vorhanden sind.
