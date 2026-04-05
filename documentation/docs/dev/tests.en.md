# Tests

Hournest is currently tested on two levels:

- **Backend:** PHPUnit/Laravel feature and unit tests for API endpoints, validation, calculations, and cross-system business rules
- **Frontend:** Angular specs for core services and first feature components

---

## Running Tests

Backend:

```bash
cd backend
php artisan test
```

Or directly with PHPUnit:

```bash
cd backend
./vendor/bin/phpunit
```

Type-check frontend specs:

```bash
cd frontend
npx tsc -p tsconfig.spec.json --noEmit
```

Run frontend specs in a browser:

```bash
cd frontend
npm test
```

### Filtering Test Output

```bash
# Run a specific test
php artisan test --filter=test_user_can_request_vacation

# Run a specific test class
php artisan test --filter=VacationTest

# Only feature tests
php artisan test tests/Feature

# Only unit tests
php artisan test tests/Unit
```

---

## Database for Tests

Backend tests use an **SQLite :memory: database**. It is created automatically before each test and discarded afterwards. No separate database configuration is required.

Configuration is handled with the `RefreshDatabase` trait:

```php
class VacationTest extends TestCase
{
    use RefreshDatabase;
}
```

---

## Test Structure

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

## Current Status

- Backend suite: **357 tests / 996 assertions**
- Frontend: every service under `frontend/src/app/core/services` has a matching spec file
- Feature components with specs: Login, My Vacations, and Time Tracking

---

## Coverage Focus

### Authentication

| Test file | Description |
|-----------|-------------|
| `AuthTest` | Local login, logout, password changes, must-change-password flow |
| `AuthOidcTest` | OIDC redirect/callback, pre-provisioning, role assignment, fallbacks |

### Vacation & Vacation Ledger

| Test file | Description |
|-----------|-------------|
| `VacationTest` | Requesting, validation, team/self views, cancellation, and half-day vacation |
| `AdminTest` | Admin review of vacation requests and user management |
| `VacationLedgerTest` | Vacation ledger, bonus, carryover, expired, and adjustment entries |
| `YearlyMaintenanceTest` | Yearly entitlement, carryover, expiry, dry-run, idempotency |
| `WorkScheduleTest` | Individual work days and their effect on calculations |
| `HolidayTest` | Holiday management and filtering |
| `SettingTest` | Global settings such as carryover expiry and default work days |

### Time Tracking, Cost Centers, and Absences

| Test file | Description |
|-----------|-------------|
| `CostCenterTest` | CRUD for cost centers, system cost center protection, permissions |
| `CostCenterFavoriteTest` | Adding, removing, reordering, and validating favorites |
| `UserGroupTest` | Group management, member assignment, cost center assignment |
| `AbsenceTest` | Illness, special leave, half-day rules, overlap validation |
| `AbsenceAdminManagementTest` | Admin filters, review, and deletion of absences |
| `AdminReportTest` | Aggregated time bookings, missing entries, and CSV export |
| `TimeEntryTest` | Time recording, holidays, locking, auto-lock, and vacation locking |
| `TimeBookingTest` | Percentage booking, 100%/50% rules, system cost center protection, auto-lock, and half-day vacation |
| `TimeBookingAdminTest` | Admin access to bookings and direct user cost center assignment |
| `TimeBookingTemplateTest` | Own booking templates, 100% validation, ownership rules, no system cost centers |
| `TimeLockTest` | Month closing, lock/unlock |
| `CrossSystemTest` | Interactions between vacations, half-day vacations, holidays, illness, special leave, time entries, and system bookings |

### Unit Tests

| Test file | Description |
|-----------|-------------|
| `Unit/VacationTest` | Workday calculation across weekends, half days, and year boundaries |

### Frontend Specs

| Spec file | Description |
|-----------|-------------|
| `app.component.spec.ts` | Language initialization and switching |
| `core/services/*.spec.ts` | Request URLs, payloads, and response mapping for all core services |
| `features/login/login.component.spec.ts` | Login flow, error states, forced password change |
| `features/time-tracking/time-tracking.component.spec.ts` | Applying, saving, updating, and deleting templates, plus half-day vacation behavior in the weekly grid |
| `features/admin/reports/admin-reports.component.spec.ts` | Loading reports, switching grouping, and CSV export |
| `features/vacation/my-vacations.component.spec.ts` | Loading, cancelling, dialog refresh, ledger year switching |

---

## Writing New Tests

### Feature Test

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

### Unit Test

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

### Important Conventions

- Test methods start with `test_`
- Feature tests use `actingAs()` for authenticated requests
- Use `assertOk()`, `assertStatus()`, `assertJsonPath()`, and `assertJsonStructure()` for responses
- Use `assertDatabaseHas()` and `assertSoftDeleted()` for database assertions
- Frontend specs should prefer request contracts, signal/state changes, and component workflows over brittle markup assertions
