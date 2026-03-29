# Tests

The Hournest backend is tested with PHPUnit. The tests cover API endpoints and business logic.

---

## Running Tests

```bash
cd backend
php artisan test
```

Or directly with PHPUnit:

```bash
cd backend
./vendor/bin/phpunit
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

Tests use an **SQLite :memory: database**. It is automatically created before each test and discarded afterwards. No separate database configuration is needed.

Configuration is done via the `RefreshDatabase` trait, which is used in every feature test class:

```php
class VacationTest extends TestCase
{
    use RefreshDatabase;
    // ...
}
```

---

## Test Structure

```
backend/tests/
├── TestCase.php          # Base test class
├── Feature/
│   ├── AuthTest.php      # Authentication tests
│   ├── VacationTest.php  # Vacation request tests
│   └── AdminTest.php     # Admin function tests
└── Unit/
    └── VacationTest.php  # Unit tests for vacation calculation
```

---

## Test Overview

### Feature/AuthTest (3 Tests)

| Test                                         | Description                                            |
|----------------------------------------------|--------------------------------------------------------|
| `test_unauthenticated_user_cannot_access_api`| Unauthenticated users receive 401                      |
| `test_authenticated_user_can_get_own_info`   | Authenticated users can retrieve their own info        |
| `test_logout_invalidates_session`            | Logout correctly terminates the session                |

### Feature/VacationTest (10 Tests)

| Test                                              | Description                                            |
|---------------------------------------------------|--------------------------------------------------------|
| `test_user_can_view_approved_team_vacations`      | Only approved vacations are shown                      |
| `test_user_can_view_own_vacations`                | User sees only their own vacations                     |
| `test_user_can_request_vacation`                  | Vacation request is correctly created (status: pending)|
| `test_user_cannot_request_vacation_in_the_past`   | Past vacation dates are rejected (422)                 |
| `test_user_cannot_request_vacation_with_end_before_start` | End before start is rejected (422)             |
| `test_user_cannot_request_overlapping_vacation`   | Overlap with approved vacation is rejected             |
| `test_user_can_cancel_pending_vacation`           | Pending requests can be cancelled (soft delete)        |
| `test_user_cannot_cancel_approved_vacation`       | Approved requests cannot be cancelled                  |
| `test_user_cannot_cancel_other_users_vacation`    | Other users' requests cannot be cancelled (403)        |
| `test_remaining_vacation_days_are_calculated`     | Remaining vacation is correctly calculated             |

### Feature/AdminTest (10 Tests)

| Test                                                | Description                                            |
|-----------------------------------------------------|--------------------------------------------------------|
| `test_admin_can_view_pending_vacations`             | Admin sees all pending requests                        |
| `test_admin_can_approve_vacation`                   | Admin can approve vacation                             |
| `test_admin_can_reject_vacation_with_comment`       | Admin can reject vacation with comment                 |
| `test_admin_cannot_review_already_reviewed_vacation` | Already reviewed requests cannot be reviewed again    |
| `test_admin_can_view_all_users`                     | Admin sees all users                                   |
| `test_admin_can_update_user_role`                   | Admin can change user role                             |
| `test_admin_can_update_user_vacation_days`          | Admin can change vacation days per year                |
| `test_employee_cannot_access_admin_routes`          | Employees receive 403 on admin routes                  |
| `test_invalid_role_is_rejected`                     | Invalid roles are rejected with 422                    |
| `test_invalid_vacation_days_rejected`               | Negative vacation days are rejected with 422           |

### Unit/VacationTest (5 Tests)

| Test                                          | Description                                            |
|-----------------------------------------------|--------------------------------------------------------|
| `test_count_workdays_excludes_weekends`       | Mon-Fri = 5 work days                                  |
| `test_count_workdays_full_two_weeks`          | 2 weeks Mon-Fri = 10 work days                         |
| `test_count_workdays_single_day`              | One day (Monday) = 1 work day                          |
| `test_count_workdays_weekend_only_returns_zero`| Sat-Sun = 0 work days                                 |
| `test_count_workdays_filtered_by_year`        | Cross-year vacation: only days in specified year count  |

---

## Factories

Laravel factories are used for test data generation:

### UserFactory

Creates users with random data. Available states:

- `admin()` -- Creates a user with the admin role

```php
$user = User::factory()->create();           // Employee
$admin = User::factory()->admin()->create(); // Admin
```

### VacationFactory

Creates vacation requests with random data. Available states:

- `approved()` -- Creates an approved vacation

```php
$vacation = Vacation::factory()->create();             // Pending
$approved = Vacation::factory()->approved()->create();  // Approved
```

---

## Writing New Tests

### Feature Test (API Endpoint)

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
        $result = 1 + 1;

        $this->assertEquals(2, $result);
    }
}
```

### Important Conventions

- Test methods start with `test_` (snake_case)
- Feature tests use `actingAs()` for authenticated requests
- Use `assertOk()`, `assertStatus()`, `assertJsonPath()`, `assertJsonStructure()` for response assertions
- Use `assertDatabaseHas()` and `assertSoftDeleted()` for database assertions
