# Demo Mode

This page documents the technical demo mode of Hournest. It is intentionally aimed at developers and operators, not end users.

## Goal

Demo mode is a real backend operating mode. It powers a public or internal preview of Hournest with realistic, date-relative data while keeping sensitive write operations locked down.

The main goals are:

- presentable data relative to the current or a fixed reference date
- server-side protection for sensitive changes
- regular reset of the demo database
- reuse for E2E tests, later Docker setups, and richer test scenarios

## Architecture

Demo mode consists of four building blocks:

1. `backend/config/demo.php`
2. `backend/app/Http/Middleware/EnsureDemoActionAllowed.php`
3. `backend/app/Demo/DemoScenarioBuilder.php`
4. `php artisan hournest:demo:refresh`

In addition, `/api/auth/config` informs the frontend whether demo mode is active and whether password changes are allowed. The frontend then shows a global banner and hides blocked actions such as the password button.

## Important Environment Variables

Minimal demo setup:

```env
APP_ENV=demo
AUTH_OAUTH_ENABLED=false
DEMO_ENABLED=true
DEMO_REFERENCE_DATE=now
DEMO_DATASET_VARIANT=standard
DEMO_LOGIN_PASSWORD=public-demo-password
DEMO_NOTICE=Public demo preview
DEMO_ALLOW_PASSWORD_CHANGE=false
DEMO_ALLOW_USER_MANAGEMENT=false
DEMO_ALLOW_GLOBAL_SETTINGS_WRITE=false
DEMO_ALLOW_HOLIDAY_WRITE=false
DEMO_ALLOW_BLACKOUT_WRITE=false
```

Important safety variables:

```env
DEMO_REQUIRE_DEDICATED_DATABASE=true
DEMO_ALLOW_DEFAULT_PASSWORDS=false
DEMO_LOGIN_PASSWORD=public-demo-password
```

Important:

- `AUTH_OAUTH_ENABLED=false` is mandatory in demo mode.
- Demo mode and OAuth/OIDC must not run in parallel.
- The demo password is intentionally not secret and may be shown in the login UI.

## Safety Rails

### Mutating endpoints are protected server-side

Write actions such as password changes, user management, holidays, blackouts, global settings, time bookings, favorites, templates, and admin reviews are protected by demo middleware.

Important:

- protection lives in the backend and is not just a UI toggle
- even direct API requests receive `403` with `demo_blocked=true` in demo mode

### Demo startup fails with default passwords

When Hournest starts with `DEMO_ENABLED=true` in a real demo environment, the application refuses to start if it is still using `demo-password` as the demo login password.

Exception:

- these checks are intentionally relaxed in `local`, `testing`, and `e2e`
- for local experiments you can additionally set `DEMO_ALLOW_DEFAULT_PASSWORDS=true`

### A dedicated demo database is enforced

In strict demo environments, Hournest expects a separate database whose name or path contains `demo` or `e2e`.

Examples:

- `backend/database/demo.sqlite`
- `backend/database/e2e-demo.sqlite`
- `hournest_demo`

### OAuth is forbidden in demo mode

When `DEMO_ENABLED=true`, Hournest strictly requires `AUTH_OAUTH_ENABLED=false`.

Reasons:

- a public demo should not depend on an external identity provider
- login must stay reproducible and self-contained
- demo credentials are intentionally exposed in the UI and via `/api/auth/config`

### `hournest:demo:refresh` is intentionally restricted

By default, the command only runs with:

- `DEMO_ENABLED=true`
- `APP_ENV=demo`
- a dedicated demo database

A deliberate override is only possible via `--force-demo`.

## Demo Refresh

Basic flow:

```bash
cd backend
php artisan hournest:demo:refresh
```

With a fixed reference date:

```bash
php artisan hournest:demo:refresh --reference-date=2026-04-06
```

With a denser showcase dataset:

```bash
php artisan hournest:demo:refresh --dataset-variant=full
```

The refresh command internally runs `migrate:fresh` with the demo seeder. That is intentionally destructive and therefore protected by the safety rails above.

## Scheduler

If `DEMO_REFRESH_CRON` is set, the scheduler automatically registers periodic demo resets.

```env
DEMO_REFRESH_CRON=*/30 * * * *
```

Then a running:

```bash
php artisan schedule:work
```

is enough.

This pattern is intentionally designed so it can later be reused in a separate scheduler process, for example in Docker.

## Frontend Behavior

The frontend reads `/api/auth/config` and reacts to:

- `data.demo.enabled`
- `data.demo.notice`
- `data.demo.reference_date`
- `data.demo.password_change_allowed`
- `data.demo.login.shared_password`
- `data.demo.login.users`

Current behavior:

- global demo banner on public and authenticated pages
- password button is hidden when demo password changes are disabled
- login page openly shows the shared demo password and the available demo users
- login layout accounts for the banner offset so nothing overlaps

## Demo Data

The demo data comes from `DemoScenarioBuilder` and is relative to `DEMO_REFERENCE_DATE`.

There are two variants:

- `standard`: compact dataset with guaranteed minimum coverage across statuses, scopes, and core modules
- `full`: denser showcase dataset with additional vacation, absence, template, booking, and lock examples

### Coverage Guarantee

In the `standard` dataset, each of the following values appears at least once:

- Vacation status: `approved`, `pending`, `rejected`
- Vacation scope: `full_day`, `morning`, `afternoon`
- Absence status: `pending`, `approved`, `rejected`, `acknowledged`, `admin_created`
- Absence type: `illness`, `special_leave`
- Absence scope: `full_day`, `morning`, `afternoon`
- Ledger types: `entitlement`, `carryover`, `bonus`, `taken`, `expired`, `adjustment`
- Blackout types: `freeze`, `company_holiday`
- Holiday types: `fixed`, `variable`

This minimum coverage is also enforced by backend tests.

### Personas and Profiles

| Person | Role / profile | Key demo traits |
|---|---|---|
| Anna Admin | Admin | global visibility, reviews records, own half-day vacation, leadership data in the `full` dataset |
| Max Mustermann | Employee | approved and pending vacation, carryover, work-time adjustments, approved morning absence |
| Sarah Schmidt | Employee | rejected vacation, acknowledged illness, support bookings |
| Tom Weber | Employee | `holidays_exempt`, longer approved vacation, admin-created illness, temporary work schedule |
| Lisa Braun | Employee | `weekend_worker`, pending special leave, weekend time tracking |
| Mona Keller | Employee | part-time schedule, afternoon half-day vacation, rejected special leave, own template |

### Feature Catalog

| Area | What gets generated | Where to find it in the app |
|---|---|---|
| Users & roles | 1 admin, 5 employees with different profiles | Login, admin user management, selectors |
| Work schedules | part-time setup for Mona, temporary 4-day schedule for Tom | Admin user area / work schedules |
| Holidays | German fixed and variable holidays for previous, current, and next year | Calendar, holiday management |
| Vacation ledger | entitlement, carryover, bonus, taken, expired, adjustment | Vacation account / admin ledger |
| Work time account | manual positive and negative corrections | Working time account |
| Vacations | approved, pending, rejected, full-day and half-day | Employee views, team calendar, admin review |
| Absences | illness and special leave across all relevant statuses and scopes | Absence views, admin review, reports |
| Blackouts | freeze plus company holiday | Vacation planning / blackouts |
| Cost centers | direct assignments, group assignments, favorites | Time tracking, admin cost centers, groups |
| Templates | multiple time-booking templates | Time booking templates |
| Time tracking | regular workdays, part-time, support, weekend work | Daily/weekly time tracking, reports |
| Time locks | at least one locked month, two in the `full` dataset | Admin locking |

### Scenario Lookup

| Scenario | Person | Seed example | Visible in |
|---|---|---|
| Approved full-day vacation | Max, Tom | past and future vacation blocks | Calendar, vacation account |
| Pending vacation | Max | future request with comment `Summer trip` | Employee view, admin review queue |
| Rejected vacation | Sarah | rejection due to team coverage | Employee view, admin review |
| Morning half-day vacation | Anna | `Family appointment` | Calendar, vacation account |
| Afternoon half-day vacation | Mona | `Moving appointment` | Calendar, vacation account |
| Acknowledged illness | Sarah | `Flu symptoms` | Absence module, admin review |
| Admin-created illness | Tom | `Medical appointment confirmed by HR` | Absence module |
| Pending special leave | Lisa | `Family ceremony` | Absence module, review queue |
| Rejected special leave | Mona | `Requested bridge day` | Absence module |
| Approved morning special leave | Max | `Parent-teacher conference` | Absence module |
| Company holiday | everyone | Dec 24 to Dec 31 | Calendar, ledger, system bookings |
| Freeze | everyone | `Quarter-end delivery freeze` | Vacation planning |
| Weekend work | Lisa | weekend time entry | Time tracking, reports |
| Part-time | Mona | 3-day week plus matching time entry | Work schedule, time tracking |
| Holiday-exempt employee | Tom | `holidays_exempt=true` | User profile, calculations |

### Overview Graphic

```text
Demo dataset (standard)

Anna  | admin, review flow, half-day vacation (morning)
Max   | approved vacation, pending vacation, carryover, approved morning absence
Sarah | rejected vacation, acknowledged illness, support bookings
Tom   | holidays exempt, long approved vacation, admin-created illness, temporary schedule
Lisa  | weekend worker, pending special leave, weekend time entry
Mona  | part-time schedule, half-day vacation (afternoon), rejected special leave

Extra density in "full"

- more vacations in review and history
- more absences across personas
- additional templates for admin and weekend support
- additional workdays and bookings across several users
- second locked month for locking demos
```

### Synchronization Rule

`DemoScenarioBuilder`, this documentation page, and `DemoRefreshCommandTest` are maintained as one shared package.

That means:

- every change to generated personas, scenarios, statuses, or dataset variants must update the docs in the same change
- the tables and overview graphic here describe the real generator, not an aspirational target
- the coverage tests must assert the same guarantees so generator, docs, and tests do not drift apart asynchronously

## Test Coverage

Important tests around demo mode:

- `backend/tests/Feature/DemoModeTest.php`
- `backend/tests/Feature/DemoRefreshCommandTest.php`
- `backend/tests/Unit/DemoSafetyTest.php`
- `frontend/src/app/app.component.spec.ts`
- `frontend/e2e/demo-banner.spec.ts`

In addition, `DemoRefreshCommandTest` verifies that the standard dataset really creates every documented status, scope, and type at least once.

## Operating Rules

For a real public demo, you should at minimum enforce these rules:

- `APP_ENV=demo`
- `AUTH_OAUTH_ENABLED=false`
- dedicated demo database
- one shared and intentionally public demo password
- keep the demo banner enabled
- run scheduler or external cron for periodic resets
