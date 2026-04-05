# Tests

Hournest wird derzeit auf zwei Ebenen getestet:

- **Backend:** PHPUnit/Laravel Feature- und Unit-Tests für API-Endpunkte, Validierung, Berechnungen und systemübergreifende Geschäftslogik
- **Frontend:** Angular-Specs für Core-Services und erste Feature-Komponenten

---

## Tests ausführen

Backend:

```bash
cd backend
php artisan test
```

Oder direkt mit PHPUnit:

```bash
cd backend
./vendor/bin/phpunit
```

Frontend-Specs typprüfen:

```bash
cd frontend
npx tsc -p tsconfig.spec.json --noEmit
```

Frontend-Specs im Browser ausführen:

```bash
cd frontend
npm test
```

Frontend-Coverage-Report:

```bash
cd frontend
npm run test:coverage
```

Headless Frontend-Coverage-Report:

```bash
cd frontend
npm run test:coverage:ci
```

Backend-Coverage-Report:

```bash
cd backend
composer test:coverage
```

Backend-Coverage-HTML-Report:

```bash
cd backend
composer test:coverage:html
```

Hinweis:

- Frontend-Coverage nutzt Karma/Istanbul
- Backend-Coverage benötigt in der Regel `Xdebug` oder `PCOV`
- Backend-Coverage-Skripte liegen jetzt direkt in `composer.json`
- Prozentwerte sind ein guter technischer Hinweis, sollten aber zusammen mit [Feature-Inventar](feature-inventory.md) und [Test-Matrix](test-matrix.md) gelesen werden

### Test-Ausgabe filtern

```bash
# Nur einen bestimmten Test ausführen
php artisan test --filter=test_user_can_request_vacation

# Nur eine bestimmte Test-Klasse
php artisan test --filter=VacationTest

# Nur Feature-Tests
php artisan test tests/Feature

# Nur Unit-Tests
php artisan test tests/Unit
```

---

## Datenbank für Tests

Die Backend-Tests verwenden eine **SQLite :memory:-Datenbank**. Diese wird vor jedem Test automatisch erstellt und nach dem Test verworfen. Keine separate Datenbankkonfiguration nötig.

Die Konfiguration erfolgt über das Trait `RefreshDatabase`, das in den Feature-Tests verwendet wird:

```php
class VacationTest extends TestCase
{
    use RefreshDatabase;
}
```

---

## Teststruktur

```text
backend/tests/
├── TestCase.php
├── Feature/
│   ├── AbsenceAdminManagementTest.php
│   ├── AbsenceTest.php
│   ├── AdminTest.php
│   ├── AuthOidcTest.php
│   ├── AuthTest.php
│   ├── CostCenterFavoriteTest.php
│   ├── CostCenterTest.php
│   ├── CrossSystemTest.php
│   ├── HolidayTest.php
│   ├── SecurityTest.php
│   ├── SettingTest.php
│   ├── TimeBookingAdminTest.php
│   ├── TimeBookingTemplateTest.php
│   ├── TimeBookingTest.php
│   ├── TimeEntryTest.php
│   ├── TimeLockTest.php
│   ├── UserGroupTest.php
│   ├── VacationLedgerTest.php
│   ├── VacationTest.php
│   ├── WorkTimeAccountTest.php
│   ├── WorkScheduleTest.php
│   └── YearlyMaintenanceTest.php
└── Unit/
    └── VacationTest.php
```

```text
frontend/src/app/
├── app.component.spec.ts
├── core/services/*.spec.ts
└── features/
    ├── login/login.component.spec.ts
    ├── time-tracking/time-tracking.component.spec.ts
    └── vacation/my-vacations.component.spec.ts
```

---

## Aktueller Stand

- Backend-Suite: **402 Tests / 1172 Assertions**
- Frontend: alle Services unter `frontend/src/app/core/services` haben Spec-Dateien
- Feature-Komponenten mit Specs: Dashboard, Kalender, Login, Mein Urlaub, Meine Abwesenheiten, Zeiterfassung, Admin-Abwesenheiten, Urlaubsantrags-Review, Kostenstellen-Verwaltung, Benutzergruppen-Administration, Benutzerverwaltung, Feiertagsverwaltung, Blackout-Verwaltung und Einstellungen
- Ergänzende Übersichten: [Feature-Inventar](feature-inventory.md) und [Test-Matrix](test-matrix.md)

---

## Test-Schwerpunkte

### Authentifizierung

| Testdatei | Beschreibung |
|-----------|-------------|
| `AuthTest` | Lokaler Login, Logout, Passwortwechsel, Must-change-password-Flow |
| `AuthOidcTest` | OIDC-Redirect/Callback, Vorab-Provisionierung, Rollen-Zuordnung, Fallbacks |

### Urlaub & Urlaubskonto

| Testdatei | Beschreibung |
|-----------|-------------|
| `VacationTest` | Antragstellung, Validierung, Team-/Eigenansichten, Stornierung und Halbtags-Urlaub |
| `AdminTest` | Admin-Review von Urlaubsanträgen und Benutzerverwaltung |
| `VacationLedgerTest` | Urlaubskonto, Bonus-, Carryover-, Expired- und Adjustment-Einträge |
| `WorkTimeAccountTest` | Arbeitszeitkonto, Eröffnungssaldo, Tagesdeltas, Feiertage, Betriebsferien, Urlaub, Krankheit, Teilzeit-Modelle, Prioritäten und manuelle Korrekturen |
| `YearlyMaintenanceTest` | Jahresanspruch, Übertrag, Verfall, Dry-Run und Idempotenz |
| `WorkScheduleTest` | Individuelle Arbeitstage und Auswirkungen auf Berechnungen |
| `HolidayTest` | Feiertagsverwaltung und Filter |
| `SettingTest` | Globale Konfigurationen wie Carryover-Verfall und Standard-Arbeitstage |

### Zeiterfassung, Kostenstellen & Abwesenheiten

| Testdatei | Beschreibung |
|-----------|-------------|
| `CostCenterTest` | CRUD für Kostenstellen, Systemkostenstellen-Schutz, Berechtigungen |
| `CostCenterFavoriteTest` | Favoriten hinzufügen, entfernen, umordnen und validieren |
| `UserGroupTest` | Gruppenverwaltung, Mitglieder- und Kostenstellenzuordnung |
| `AbsenceTest` | Krankheit, Sonderurlaub, Halbtag-Regeln, Überschneidungen |
| `AbsenceAdminManagementTest` | Admin-Filter, Review und Löschen von Abwesenheiten |
| `AdminReportTest` | Aggregierte Zeitbuchungen, fehlende Einträge, Abwesenheitsreport und CSV-Export |
| `BlackoutTest` | Blackout-CRUD, Check-Endpunkt, Freeze-Blockierung und automatische Betriebsferien-Wirkung in Urlaubskonto/Zeiterfassung |
| `TimeEntryTest` | Arbeitszeiterfassung, Feiertage, Sperren, Auto-Lock, Halbtags-Urlaub und Betriebsferien-Sperren |
| `TimeBookingTest` | Prozentbuchungen, 100-%-/50-%-Regeln, Systemkostenstellen-Schutz, Auto-Lock, Halbtags-Urlaub und Betriebsferien-Sperren |
| `TimeBookingAdminTest` | Admin-Zugriffe auf Buchungen und direkte Kostenstellenzuordnung |
| `TimeBookingTemplateTest` | Eigene Buchungsvorlagen, 100-%-Validierung, Besitzregeln, keine Systemkostenstellen |
| `TimeLockTest` | Monatsabschluss, Sperren und Entsperren |
| `CrossSystemTest` | Zusammenspiel zwischen Urlaub, Halbtags-Urlaub, Feiertagen, Krankheit, Sonderurlaub, Zeiterfassung und Systembuchungen |

### Unit-Tests

| Testdatei | Beschreibung |
|-----------|-------------|
| `Unit/VacationTest` | Berechnung von Arbeitstagen über Wochenenden, Halbtage und Jahresgrenzen hinweg |

### Frontend-Specs

| Spec-Datei | Beschreibung |
|-----------|-------------|
| `app.component.spec.ts` | Sprachinitialisierung und Sprachwechsel |
| `core/services/*.spec.ts` | Request-URLs, Payloads und Response-Mapping aller Core-Services |
| `features/calendar/calendar.component.spec.ts` | Laden der Kalenderdaten sowie Sichtbarkeitshinweise für Mitarbeiter und Admins |
| `features/dashboard/dashboard.component.spec.ts` | Laden der Startseiten-Kennzahlen sowie Admin-Karten für offene Anträge und aktuelle Abwesenheiten |
| `features/admin/requests/admin-requests.component.spec.ts` | Laden, Approve/Reject mit Kommentar sowie Fehler-Feedback in der Urlaubsantrags-Prüfung |
| `features/admin/cost-centers/admin-cost-centers.component.spec.ts` | Laden, Dialog-Refresh und Archivieren in der Kostenstellen-Verwaltung |
| `features/admin/cost-centers/cost-center-dialog.component.spec.ts` | Erstellen/Bearbeiten von Kostenstellen, optionales Beschreibungsfeld und Update-Payload ohne Code-Änderung |
| `features/admin/absences/admin-absences.component.spec.ts` | Laden und Filtern offener Fälle, Review/Delete sowie Dialog-Refresh in der Admin-Abwesenheitsverwaltung |
| `features/admin/absences/create-absence-dialog.component.spec.ts` | Direktes Anlegen durch Admin, Required-Guards und korrektes Payload-Mapping |
| `features/admin/user-groups/admin-user-groups.component.spec.ts` | Laden, Dialog-basierter Refresh und Löschen in der Benutzergruppen-Verwaltung |
| `features/admin/user-groups/user-group-dialogs.spec.ts` | Erstellen/Bearbeiten von Gruppen, Mitglieder-Selektion sowie aktive Kostenstellen-Zuordnung |
| `features/admin/users/admin-users.component.spec.ts` | Laden, Rollenänderung, Erstellung per Dialog und Löschen in der Benutzerverwaltung |
| `features/admin/users/create-user-dialog.component.spec.ts` | Passwortregeln für lokale/OAuth-Accounts, Generierung, erfolgreiches Anlegen und Fehler-Feedback |
| `features/admin/users/reset-password-dialog.component.spec.ts` | Mindestlänge, Invalid-Guard und Rückgabe des neuen Passworts |
| `features/admin/users/ledger-adjustment-dialog.component.spec.ts` | Ledger-Laden, Running-Balance, manuelle Einträge und Löschen mit Reload/Feedback |
| `features/admin/users/time-account-adjustment-dialog.component.spec.ts` | Arbeitszeitkonto-Laden, Add/Delete-Pfade, Guard für nicht numerische IDs und Minutenformatierung |
| `features/admin/holidays/admin-holidays.component.spec.ts` | Laden, Jahreswechsel, Edit-Pfad und Löschen in der Feiertagsverwaltung |
| `features/admin/holidays/holiday-dialog.component.spec.ts` | Erstellen/Bearbeiten von Feiertagen, Payload-Mapping und Fehlerpfad beim Speichern |
| `features/admin/holidays/holiday-date-dialog.component.spec.ts` | Bestätigen variabler Feiertagsdaten inklusive Invalid-Guard und Fehlerpfad |
| `features/admin/blackouts/admin-blackouts.component.spec.ts` | Laden, Create-/Edit-Dialogpfade und Löschen in der Blackout-Verwaltung |
| `features/admin/settings/admin-settings.component.spec.ts` | Laden, Mapping und Speichern der globalen Einstellungen |
| `features/login/login.component.spec.ts` | Login-Flow, Fehlerzustände, erzwungener Passwortwechsel |
| `features/absences/my-absences.component.spec.ts` | Laden, Dialog-Refresh und Storno in der persönlichen Abwesenheitsübersicht |
| `features/time-tracking/time-tracking.component.spec.ts` | Vorlagen anwenden, speichern, aktualisieren, löschen sowie Favoriten-Reihenfolge, Save-/Leerlauf-Fehlerpfade, Halbtags-Urlaub, Betriebsferien, persönliche Wochenziele und Arbeitszeitkonto im Wochengrid |
| `features/admin/reports/admin-reports.component.spec.ts` | Laden von Reports, Gruppierungswechsel und CSV-Export |
| `features/vacation/my-vacations.component.spec.ts` | Laden, Stornieren, Dialog-Refresh und Ledger-Jahreswechsel |

---

## Neue Tests schreiben

### Feature-Test

```php
<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NewFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_example(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/endpoint');

        $response->assertOk()
            ->assertJsonStructure(['data']);
    }
}
```

### Unit-Test

```php
<?php

declare(strict_types=1);

namespace Tests\Unit;

use Tests\TestCase;

class NewUnitTest extends TestCase
{
    public function test_example(): void
    {
        $this->assertEquals(2, 1 + 1);
    }
}
```

### Wichtige Konventionen

- Testmethoden beginnen mit `test_`
- Feature-Tests verwenden `actingAs()` für authentifizierte Requests
- Verwende `assertOk()`, `assertStatus()`, `assertJsonPath()` und `assertJsonStructure()` für Responses
- Verwende `assertDatabaseHas()` und `assertSoftDeleted()` für Datenbankprüfungen
- Frontend-Specs prüfen bevorzugt Request-Verträge, Signal-/State-Änderungen und Komponenten-Workflows statt fragiler Markup-Details
