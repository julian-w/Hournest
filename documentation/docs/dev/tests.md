# Tests

Das Backend von Hournest wird mit PHPUnit getestet. Die Tests decken die API-Endpoints und die Geschaeftslogik ab.

---

## Tests ausfuehren

```bash
cd backend
php artisan test
```

Oder direkt mit PHPUnit:

```bash
cd backend
./vendor/bin/phpunit
```

### Test-Ausgabe filtern

```bash
# Nur einen bestimmten Test ausfuehren
php artisan test --filter=test_user_can_request_vacation

# Nur eine bestimmte Test-Klasse
php artisan test --filter=VacationTest

# Nur Feature-Tests
php artisan test tests/Feature

# Nur Unit-Tests
php artisan test tests/Unit
```

---

## Datenbank fuer Tests

Die Tests verwenden eine **SQLite :memory:-Datenbank**. Diese wird vor jedem Test automatisch erstellt und nach dem Test verworfen. Keine separate Datenbankkonfiguration noetig.

Die Konfiguration erfolgt ueber das Trait `RefreshDatabase`, das in jeder Feature-Test-Klasse verwendet wird:

```php
class VacationTest extends TestCase
{
    use RefreshDatabase;
    // ...
}
```

---

## Teststruktur

```
backend/tests/
├── TestCase.php          # Basis-Testklasse
├── Feature/
│   ├── AuthTest.php      # Authentifizierungs-Tests
│   ├── VacationTest.php  # Urlaubsantrag-Tests
│   └── AdminTest.php     # Admin-Funktions-Tests
└── Unit/
    └── VacationTest.php  # Unit-Tests fuer Urlaubsberechnung
```

---

## Test-Uebersicht

### Feature/AuthTest (3 Tests)

| Test                                         | Beschreibung                                           |
|----------------------------------------------|--------------------------------------------------------|
| `test_unauthenticated_user_cannot_access_api`| Nicht-authentifizierte Benutzer erhalten 401            |
| `test_authenticated_user_can_get_own_info`   | Authentifizierte Benutzer koennen eigene Infos abrufen |
| `test_logout_invalidates_session`            | Logout beendet die Session korrekt                     |

### Feature/VacationTest (10 Tests)

| Test                                              | Beschreibung                                           |
|---------------------------------------------------|--------------------------------------------------------|
| `test_user_can_view_approved_team_vacations`      | Nur genehmigte Urlaube werden angezeigt                |
| `test_user_can_view_own_vacations`                | Benutzer sieht nur eigene Urlaube                      |
| `test_user_can_request_vacation`                  | Urlaubsantrag wird korrekt erstellt (Status: pending)  |
| `test_user_cannot_request_vacation_in_the_past`   | Urlaub in der Vergangenheit wird abgelehnt (422)       |
| `test_user_cannot_request_vacation_with_end_before_start` | End vor Start wird abgelehnt (422)             |
| `test_user_cannot_request_overlapping_vacation`   | Ueberlappung mit genehmigtem Urlaub wird abgelehnt    |
| `test_user_can_cancel_pending_vacation`           | Offene Antraege koennen storniert werden (Soft Delete) |
| `test_user_cannot_cancel_approved_vacation`       | Genehmigte Antraege koennen nicht storniert werden     |
| `test_user_cannot_cancel_other_users_vacation`    | Fremde Antraege koennen nicht storniert werden (403)   |
| `test_remaining_vacation_days_are_calculated`     | Resturlaub wird korrekt berechnet                      |

### Feature/AdminTest (10 Tests)

| Test                                                | Beschreibung                                           |
|-----------------------------------------------------|--------------------------------------------------------|
| `test_admin_can_view_pending_vacations`             | Admin sieht alle offenen Antraege                      |
| `test_admin_can_approve_vacation`                   | Admin kann Urlaub genehmigen                           |
| `test_admin_can_reject_vacation_with_comment`       | Admin kann Urlaub mit Kommentar ablehnen               |
| `test_admin_cannot_review_already_reviewed_vacation` | Bereits bearbeitete Antraege koennen nicht erneut bearbeitet werden |
| `test_admin_can_view_all_users`                     | Admin sieht alle Benutzer                              |
| `test_admin_can_update_user_role`                   | Admin kann Benutzer-Rolle aendern                      |
| `test_admin_can_update_user_vacation_days`          | Admin kann Urlaubstage pro Jahr aendern                |
| `test_employee_cannot_access_admin_routes`          | Employees erhalten 403 auf Admin-Routen                |
| `test_invalid_role_is_rejected`                     | Ungueltige Rollen werden mit 422 abgelehnt             |
| `test_invalid_vacation_days_rejected`               | Negative Urlaubstage werden mit 422 abgelehnt          |

### Unit/VacationTest (5 Tests)

| Test                                          | Beschreibung                                           |
|-----------------------------------------------|--------------------------------------------------------|
| `test_count_workdays_excludes_weekends`       | Mo-Fr = 5 Arbeitstage                                  |
| `test_count_workdays_full_two_weeks`          | 2 Wochen Mo-Fr = 10 Arbeitstage                        |
| `test_count_workdays_single_day`              | Ein Tag (Montag) = 1 Arbeitstag                        |
| `test_count_workdays_weekend_only_returns_zero`| Sa-So = 0 Arbeitstage                                 |
| `test_count_workdays_filtered_by_year`        | Jahresuebergreifender Urlaub: nur Tage im angegebenen Jahr zaehlen |

---

## Factories

Fuer die Test-Datengeneration werden Laravel Factories verwendet:

### UserFactory

Erstellt Benutzer mit zufaelligen Daten. Verfuegbare States:

- `admin()` -- Erstellt einen Benutzer mit der Rolle Admin

```php
$user = User::factory()->create();           // Employee
$admin = User::factory()->admin()->create(); // Admin
```

### VacationFactory

Erstellt Urlaubsantraege mit zufaelligen Daten. Verfuegbare States:

- `approved()` -- Erstellt einen genehmigten Urlaub

```php
$vacation = Vacation::factory()->create();             // Pending
$approved = Vacation::factory()->approved()->create();  // Approved
```

---

## Neue Tests schreiben

### Feature-Test (API-Endpoint)

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
        $result = 1 + 1;

        $this->assertEquals(2, $result);
    }
}
```

### Wichtige Konventionen

- Testmethoden beginnen mit `test_` (Snake Case)
- Feature-Tests verwenden `actingAs()` fuer authentifizierte Requests
- Verwende `assertOk()`, `assertStatus()`, `assertJsonPath()`, `assertJsonStructure()` fuer Response-Pruefungen
- Verwende `assertDatabaseHas()` und `assertSoftDeleted()` fuer Datenbankpruefungen
