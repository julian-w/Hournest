# Tests

Hournest is currently tested on three levels:

- **Backend:** PHPUnit/Laravel feature and unit tests for API endpoints, validation, calculations, and cross-system business rules
- **Frontend:** Angular specs for core services and first feature components
- **E2E:** Playwright scenarios for selected end-to-end flows across frontend and backend

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

Frontend coverage report:

```bash
cd frontend
npm run test:coverage
```

Headless frontend coverage report:

```bash
cd frontend
npm run test:coverage:ci
```

Playwright E2E:

```bash
cd frontend
npm run e2e
```

Combined local test run:

```bash
./scripts/test.sh
```

Local CI including optional E2E smoke test:

```bash
./scripts/ci.sh
RUN_E2E_SMOKE=true ./scripts/ci.sh
```

Backend coverage report:

```bash
cd backend
composer test:coverage
```

Backend HTML coverage report:

```bash
cd backend
composer test:coverage:html
```

Note:

- frontend coverage uses Karma/Istanbul
- backend coverage typically needs `Xdebug` or `PCOV`
- backend coverage scripts now live directly in `composer.json`
- `./scripts/test.sh` now runs backend tests, Angular unit tests, and the production frontend build by default
- `./scripts/ci.sh` can additionally run an optional Playwright smoke test (`unauthenticated.spec.ts`)
- percentages are a useful technical signal, but they should be read together with the [Feature Inventory](feature-inventory.md) and the [Test Matrix](test-matrix.md)

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
│   ├── BlackoutTest.php
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
    ├── admin/reports/admin-reports.component.spec.ts
    ├── login/login.component.spec.ts
    ├── time-tracking/time-tracking.component.spec.ts
    └── vacation/my-vacations.component.spec.ts
```

---

## Current Status

- Backend suite: **402 tests / 1172 assertions**
- Frontend: every service under `frontend/src/app/core/services` has a matching spec file
- Feature components with specs: Dashboard, Calendar, Login, My Vacations, My Absences, Time Tracking, Admin Absences, Vacation Request Review, Cost Center Administration, User Group Administration, User Management, Holiday Administration, Blackout Administration, and Settings
- Supporting overviews: [Feature Inventory](feature-inventory.md) and [Test Matrix](test-matrix.md)

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
| `WorkTimeAccountTest` | Working time account, opening balance, daily deltas, holidays, company holidays, vacation, illness, part-time schedules, precedence rules, and manual adjustments |
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
| `AdminReportTest` | Aggregated time bookings, missing entries, absence reporting, and CSV export |
| `BlackoutTest` | Blackout CRUD, check endpoint, freeze blocking, and automatic company-holiday effects in ledger/time tracking |
| `TimeEntryTest` | Time recording, holidays, locking, auto-lock, half-day vacation, and company-holiday locks |
| `TimeBookingTest` | Percentage booking, 100%/50% rules, system cost center protection, auto-lock, half-day vacation, and company-holiday locks |
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
| `features/calendar/calendar.component.spec.ts` | Loading calendar data plus visibility hints for employees and admins |
| `features/dashboard/dashboard.component.spec.ts` | Loading dashboard KPIs plus admin cards for open requests and current absences |
| `features/admin/requests/admin-requests.component.spec.ts` | Loading, approve/reject with comment, and error feedback in the vacation request review UI |
| `features/admin/cost-centers/admin-cost-centers.component.spec.ts` | Loading, dialog refresh, and archiving in the cost center administration UI |
| `features/admin/cost-centers/cost-center-dialog.component.spec.ts` | Creating/editing cost centers, optional description handling, and update payloads without code changes |
| `features/admin/absences/admin-absences.component.spec.ts` | Loading and filtering open cases, review/delete actions, and dialog refresh in the admin absence management UI |
| `features/admin/absences/create-absence-dialog.component.spec.ts` | Direct admin creation, required-field guards, and correct payload mapping |
| `features/admin/user-groups/admin-user-groups.component.spec.ts` | Loading, dialog-based refresh, and deletion in the user group administration UI |
| `features/admin/user-groups/user-group-dialogs.spec.ts` | Group create/edit flows, member selection, and active cost-center assignment |
| `features/admin/users/admin-users.component.spec.ts` | Loading, role updates, dialog-based creation, and deletion in the user management UI |
| `features/admin/users/create-user-dialog.component.spec.ts` | Password rules for local/OAuth accounts, generation, successful creation, and backend error feedback |
| `features/admin/users/reset-password-dialog.component.spec.ts` | Minimum-length validation, invalid-form guard, and returning the new password |
| `features/admin/users/ledger-adjustment-dialog.component.spec.ts` | Loading the ledger, running balance, manual entries, and delete/reload feedback |
| `features/admin/users/time-account-adjustment-dialog.component.spec.ts` | Loading the working time account, add/delete flows, non-numeric delete guard, and minute formatting |
| `features/admin/holidays/admin-holidays.component.spec.ts` | Loading, year switching, edit flow, and deletion in the holiday administration UI |
| `features/admin/holidays/holiday-dialog.component.spec.ts` | Creating/editing holidays, payload mapping, and the save error path |
| `features/admin/holidays/holiday-date-dialog.component.spec.ts` | Confirming variable holiday dates including invalid-form guard and error handling |
| `features/admin/blackouts/admin-blackouts.component.spec.ts` | Loading, create/edit dialog flows, and deletion in the blackout administration UI |
| `features/admin/settings/admin-settings.component.spec.ts` | Loading, mapping, and saving the global settings |
| `features/login/login.component.spec.ts` | Login flow, error states, forced password change |
| `features/absences/my-absences.component.spec.ts` | Loading, dialog refresh, and cancellation in the personal absences view |
| `features/time-tracking/time-tracking.component.spec.ts` | Applying, saving, updating, and deleting templates, plus favorite ordering, save/empty-day error paths, half-day vacation, company holidays, personal weekly targets, and the working time account in the weekly grid |
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
