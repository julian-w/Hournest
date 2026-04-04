# Backend

The backend is a Laravel 11 REST API that provides all business logic and data management.

---

## Project Structure

```
backend/
├── app/
│   ├── Enums/                    # PHP enums
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
│   │   ├── Requests/             # Form Requests (validation)
│   │   └── Resources/            # API Resources (JSON transformation)
│   └── Models/
│       ├── User.php
│       ├── Vacation.php
│       ├── Holiday.php
│       ├── WorkSchedule.php
│       ├── VacationLedgerEntry.php
│       └── Setting.php
├── database/
│   ├── factories/                # Test factories
│   ├── migrations/               # Database migrations
│   └── seeders/                  # Database seeders
├── routes/
│   └── api.php                   # All API routes
├── config/                       # Laravel configuration
└── tests/
    ├── Feature/                  # Feature tests (HTTP-based)
    └── Unit/                     # Unit tests
```

---

## Models and Relationships

### User

- `hasMany(Vacation)` -- own vacation requests
- `hasMany(Vacation, 'reviewed_by')` -- approved/rejected requests
- `hasMany(WorkSchedule)` -- individual work schedules
- `hasMany(VacationLedgerEntry)` -- vacation account bookings
- Uses **SoftDeletes** and **HasFactory**
- Important methods:
    - `isAdmin()` -- checks if role is admin or superadmin
    - `getActiveWorkSchedule(Carbon $date)` -- returns active work schedule for a date
    - `isWorkDay(Carbon $date)` -- checks if a date is a working day (considers work schedule, holidays, flags)
    - `remainingVacationDays(int $year)` -- calculates remaining vacation from ledger

### Vacation

- `belongsTo(User)` -- the requesting employee
- `belongsTo(User, 'reviewed_by')` -- the approving/rejecting admin
- `hasMany(VacationLedgerEntry)` -- associated account bookings
- Uses **SoftDeletes** and **HasFactory**
- Important methods:
    - `countWorkdays(int $year)` -- counts working days in vacation period (considers individual work schedule)

### Holiday

- No relationships
- Fields: `name`, `date`, `type`

### WorkSchedule

- `belongsTo(User)`
- Fields: `user_id`, `start_date`, `end_date`, `work_days` (JSON array)

### VacationLedgerEntry

- `belongsTo(User)`
- `belongsTo(Vacation)` -- optional, only for type "taken"
- Fields: `user_id`, `year`, `type`, `days`, `comment`, `vacation_id`

### Setting

- Key-value store
- Static methods: `Setting::get(key, default)`, `Setting::set(key, value)`

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

- `redirect()` -- redirects to OIDC provider
- `callback()` -- processes OIDC callback, creates/updates user, sets session
- `login()` -- superadmin login with username/password
- `logout()` -- terminates session

### VacationController

- `index()` -- all approved vacations (for calendar)
- `mine()` -- own vacations of the authenticated user
- `store()` -- create new vacation request (with overlap check)
- `destroy()` -- cancel open request (only pending, only own)

### AdminController

- `pendingVacations()` -- all pending requests
- `reviewVacation()` -- approve/reject request (automatically creates ledger entry on approval)
- `users()` -- list all users
- `updateUser()` -- change user settings

### HolidayController

- `index()` -- list holidays (with optional year filter)
- `store()` -- create holiday (admin)
- `update()` -- edit holiday (admin)
- `destroy()` -- delete holiday (admin)

### SettingController

- `index()` -- list all settings
- `update()` -- update settings (admin)

### WorkScheduleController

- `index()` -- list work schedules for a user
- `store()` -- create new work schedule
- `update()` -- edit work schedule
- `destroy()` -- delete work schedule

### VacationLedgerController

- `index()` -- own vacation account bookings (with year filter)
- `adminIndex()` -- vacation account bookings for a specific user (admin)
- `store()` -- create new booking (admin)

---

## Middleware

### EnsureAdmin

The `EnsureAdmin` middleware protects all admin routes. It checks whether the authenticated user has the role `admin` or `superadmin`. Otherwise, a 403 error is returned.

---

## Form Requests and Validation

All incoming data is validated via Form Requests:

- **StoreVacationRequest** -- start_date (required, date, after_or_equal:today), end_date (required, date, after_or_equal:start_date)
- **ReviewVacationRequest** -- status (required, in:approved,rejected), comment (optional, string)
- **UpdateUserRequest** -- role (optional, in:employee,admin), vacation_days_per_year (optional, integer, min:0)
- **StoreHolidayRequest** -- name (required, string), date (required, date), type (required, in:fixed,variable)
- **UpdateHolidayRequest** -- analogous to StoreHolidayRequest
- **UpdateSettingsRequest** -- settings (required, array)
- **StoreWorkScheduleRequest** -- start_date (required, date), end_date (optional, date), work_days (required, array)
- **StoreVacationLedgerEntryRequest** -- year (optional, integer), type (required), days (required, numeric), comment (optional, string)

---

## Business Logic

### Work Day Calculation

The `User::isWorkDay(Carbon $date)` method checks for a given date:

1. Is there an active work schedule? If so, use its work days
2. If not, use the global default work days from settings
3. Is the day included in the work days array?
4. Special case: `weekend_worker` flag overrides weekend check
5. Is the day a holiday? (Unless `holidays_exempt` is set)

### Remaining Vacation Calculation

The `User::remainingVacationDays(int $year)` method:

1. Sum all ledger entries for the given year
2. If no entries exist: fallback to `vacation_days_per_year - approved working days`

### Vacation Approval

When approving a request (`AdminController::reviewVacation()`):

1. Set status to `approved`
2. Count working days in the vacation period (via `Vacation::countWorkdays()`)
3. Automatically create a ledger entry of type `taken`

---

## Seeder

The database seeder creates test data for local development. It can be run with `php artisan db:seed`.

---

## Current Note

Some frontend areas are already prepared further than the stable backend features documented here. This especially affects **blackouts/company holidays** and additional convenience features in the time-booking area. If a feature is described as planned in `CONCEPT.md`, the current implementation status should still be verified against actual Laravel routes and controllers in `backend/routes/api.php` and `backend/app/Http/Controllers`.
