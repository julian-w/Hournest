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

- Backend-Suite: **341 Tests / 935 Assertions**
- Frontend: alle Services unter `frontend/src/app/core/services` haben Spec-Dateien
- Feature-Komponenten mit Specs: Login, Mein Urlaub und Zeiterfassung

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
| `VacationTest` | Antragstellung, Validierung, Team-/Eigenansichten, Stornierung |
| `AdminTest` | Admin-Review von Urlaubsanträgen und Benutzerverwaltung |
| `VacationLedgerTest` | Urlaubskonto, Bonus-, Carryover-, Expired- und Adjustment-Einträge |
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
| `TimeEntryTest` | Arbeitszeiterfassung, Feiertage, Sperren, Auto-Lock |
| `TimeBookingTest` | Prozentbuchungen, 100-%-/50-%-Regeln, Systemkostenstellen-Schutz, Auto-Lock |
| `TimeBookingAdminTest` | Admin-Zugriffe auf Buchungen und direkte Kostenstellenzuordnung |
| `TimeBookingTemplateTest` | Eigene Buchungsvorlagen, 100-%-Validierung, Besitzregeln, keine Systemkostenstellen |
| `TimeLockTest` | Monatsabschluss, Sperren und Entsperren |
| `CrossSystemTest` | Zusammenspiel zwischen Urlaub, Feiertagen, Krankheit, Sonderurlaub, Zeiterfassung und Systembuchungen |

### Unit-Tests

| Testdatei | Beschreibung |
|-----------|-------------|
| `Unit/VacationTest` | Berechnung von Arbeitstagen über Wochenenden und Jahresgrenzen hinweg |

### Frontend-Specs

| Spec-Datei | Beschreibung |
|-----------|-------------|
| `app.component.spec.ts` | Sprachinitialisierung und Sprachwechsel |
| `core/services/*.spec.ts` | Request-URLs, Payloads und Response-Mapping aller Core-Services |
| `features/login/login.component.spec.ts` | Login-Flow, Fehlerzustände, erzwungener Passwortwechsel |
| `features/time-tracking/time-tracking.component.spec.ts` | Vorlagen anwenden, speichern, aktualisieren und löschen |
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
