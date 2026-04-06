# Hournest

> Team vacation management with growing time tracking support -- simple and clear.

> Deutsche Dokumentation: https://julian-w.github.io/Hournest/
>
> English documentation: https://julian-w.github.io/Hournest/en/

## Current Product Status

- **Stable and broadly implemented:** vacation management, vacation ledger, holidays, work schedules, user/admin management, local auth and OIDC
- **Implemented in a first substantial version:** time tracking, cost centers, favorites, absences, locks, core cross-system auto-booking, booking templates, admin reports, CSV export, and blackout/company-holiday handling
- **Still planned / not fully implemented yet:** shift planning and more advanced analytics

## Features (Phase 1 -- Vacation Management)

- **Dashboard:** Remaining vacation days, pending requests, next vacation, admin: team status
- **Team Calendar:** Monthly view with holidays, vacations color-coded by status
- **Vacation Requests:** Employees request vacation (from/to/comment), admins approve or reject
- **Vacation Account:** Annual ledger with entitlement, carryover, bonus days, taken days, running balance, and admin add/delete for manual entries
- **Working Time Account:** Yearly ledger with opening balance, daily deltas against target time, manual adjustments, carryover entries, and transparent running balance
- **Holidays:** Admin manages fixed and variable holidays with start/end year; fixed holidays are carried over automatically, variable holidays need yearly confirmation; vacation booking only possible when all holidays for a year are confirmed
- **Vacation Planning:** Vacation freeze and company holiday are implemented, including automatic ledger and time-booking effects for company holidays
- **Work Schedules:** Individual work schedule models per employee (e.g. part-time bridge schedules)
- **Remaining Vacation:** Automatic calculation, automatic carryover, configurable expiry
- **Maintenance:** `php artisan hournest:yearly-maintenance` -- books annual entitlements, carryover and expiry for all users (idempotent, schedulable)
- **Settings:** Configurable booking start for new year vacation (DD.MM format), carryover expiry
- **Authentication:** Two modes controlled by `AUTH_OAUTH_ENABLED`:
  - **OAuth mode (default):** OpenID Connect via any OIDC provider (e.g. Keycloak, Azure AD)
  - **Local mode:** Email + password login, admins create users with default password, forced password change on first login
- **Superadmin:** Emergency access without SSO (credentials in `.env`), always available
- **User Management:** Admin can create users (both modes -- pre-provisioning in OAuth), delete users (soft-delete), reset passwords (local mode), assign roles
- **Roles:** Employee (default), Admin (via email list or manual assignment), Superadmin
- **i18n:** German + English, switchable at runtime
- **API Documentation:** Auto-generated OpenAPI spec at `/docs/api`

## Planned Features (Phase 2 / Remaining Work)

- Additional notification channels (WhatsApp, etc.)
- Shift planning
- Advanced reports & analytics
- More advanced analytics beyond the current admin reports

## Features (Implemented Time Tracking Slice)

- **Time Recording:** Daily time entries with start, end, break; net working time calculated automatically
- **Cost Centers:** Admin-managed cost centers with code, name, description; 4 system cost centers (Vacation, Illness, Special Leave, Holiday)
- **Percentage Booking:** Employees distribute working time across cost centers by percentage (must total 100%)
- **User Groups:** Group users for bulk cost center assignment; direct assignment also supported
- **Favorites:** Employees can mark frequently used cost centers as favorites
- **Copy Previous Day/Week:** Earlier percentage distributions can be copied into the current week
- **Absence Management:** Report illness (employee → admin acknowledges), request special leave (employee → admin approves/rejects), admin can create directly
- **Half-day Absences & Vacation:** Support for full day, morning, or afternoon handling
- **Admin Reports:** Time booking summaries, missing-entry reports, and CSV export
- **Absence Reports:** Admin report with date range, employee, type, and status filters
- **Blackouts / Vacation Planning:** Vacation freezes plus company holidays with automatic vacation ledger and system-booking effects
- **System Bookings:** Vacation, illness, special leave, and holidays create automatic system cost center bookings
- **Weekly Target Hours:** Configurable per work schedule; actual vs. target comparison with weekly delta
- **Working Time Account:** Weekly view includes a transparent yearly time account ledger; admins can open and adjust the ledger per employee
- **Locking:** Auto-lock after configurable days (default 30), manual month lock by admin
- **10-Year Retention:** All data soft-deleted only, compliant with German retention requirements

### Important Implementation Notes

- Vacation auto-booking is implemented for **full-day and half-day vacation**
- Half-day absences and half-day vacation are both implemented
- Vacation freezes are now enforced on the backend for vacation requests
- Company holidays now create automatic vacation effects in ledger and time booking

## Tech Stack

| Area      | Technology                           |
|-----------|--------------------------------------|
| Frontend  | Angular 18, Angular Material, SCSS   |
| Backend   | Laravel 13, PHP 8.5+                 |
| Database  | SQLite (dev), MySQL/PostgreSQL (prod) |
| Auth      | OIDC (any provider) or local email+password, Sanctum |
| Docs      | MkDocs Material (DE + EN)            |
| CI/CD     | GitHub Actions                       |

## Project Structure

```
hournest/
├── frontend/          # Angular 18 SPA
├── backend/           # Laravel API
├── documentation/     # MkDocs Material (DE + EN)
├── scripts/           # Build, dev and CI scripts
├── .github/workflows/ # GitHub Actions (release + docs deploy)
├── CLAUDE.md          # Conventions for Claude Code
├── CONCEPT.md         # Full concept & domain logic
├── .env.example       # Environment variable template
└── README.md
```

## Quick Start

### End User / Admin Installation Requirements

If you want to **run** Hournest from the finished release package on a server, NAS, or PHP webspace, the target system needs:

- PHP 8.5+
- a web server with `public/` as document root
- a database:
  - SQLite with `pdo_sqlite`, or
  - MySQL/MariaDB with `pdo_mysql`, or
  - PostgreSQL with `pdo_pgsql`
- the general PHP extensions `mbstring`, `openssl`, `tokenizer`, `xml`, `curl`, and `fileinfo`

You do **not** need Node.js, npm, Angular CLI, or MkDocs on the target system.
You also do **not** need Composer there as long as the release package already contains `vendor/`.

Download the finished package from the GitHub Releases page:

`https://github.com/julian-w/Hournest/releases`

### Local Development Prerequisites

- PHP 8.5+ with extensions: `mbstring`, `openssl`, `tokenizer`, `xml`, `curl`, `fileinfo`, `pdo_sqlite`
- Composer
- Node.js 18+ & npm
- Python 3 + pip (only if you want to build the MkDocs documentation locally)

### Target Server / Release Package

For the extracted release package on the target server you only need:

- PHP 8.5+
- A web server with `public/` as document root
- A database plus matching driver extension: `pdo_sqlite`, `pdo_mysql`, or `pdo_pgsql`

You do **not** need Node.js, Angular CLI, MkDocs, or Composer on the target server as long as the bundled release package already contains `vendor/`.

### Start Everything (Backend + Frontend)

```bash
./scripts/dev.sh
```

Starts backend on http://localhost:8000 and frontend on http://localhost:4200 in parallel. `Ctrl+C` stops both.

### Or Individually

```bash
# Backend
cd backend
cp ../.env.example .env
composer install
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve                # http://localhost:8000

# Frontend
cd frontend
npm install
npx ng serve --proxy-config proxy.conf.json   # http://localhost:4200
```

### Authentication Setup

**Local mode (no external SSO needed):**
```env
AUTH_OAUTH_ENABLED=false
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=$2y$12$...   # bcrypt hash
```
Log in with the superadmin credentials, then create users in the admin panel.

**OAuth mode (OIDC provider):**
```env
AUTH_OAUTH_ENABLED=true
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_WELLKNOWN_URL=https://your-oidc-provider/.well-known/openid-configuration
```

## Demo Mode

Hournest includes a real backend demo mode with:

- date-relative demo seed data
- switchable dataset variants (`standard` and `full`)
- one intentionally public shared demo password shown in the login UI
- configurable server-side write protection for sensitive actions
- a refresh command plus scheduler integration for periodic resets
- frontend banner/config integration via `/api/auth/config`

The detailed setup, safety rails, test coverage, and operating rules are documented in the developer documentation:

- `documentation/docs/dev/demo-mode.md`
- `documentation/docs/dev/demo-mode.en.md`

Important for real demo deployments:

- use `APP_ENV=demo`
- use `AUTH_OAUTH_ENABLED=false`
- use a dedicated demo database
- set one shared demo password via `DEMO_LOGIN_PASSWORD`
- keep `DEMO_ALLOW_DEFAULT_PASSWORDS=false`

## Scripts

All scripts are in `scripts/` and work on Windows (Git Bash) and Linux.

### Development

| Script | Description |
|--------|-------------|
| `./scripts/dev.sh` | Start backend + frontend in parallel |
| `./scripts/dev-mock.sh` | Start frontend in mock mode (no backend needed) |
| `./scripts/dev-docs.sh` | Start MkDocs dev server on http://localhost:8001 |

### Build

| Script | Description |
|--------|-------------|
| `./scripts/build-all.sh` | Build frontend + backend + documentation |
| `./scripts/build-frontend.sh` | Build Angular only (production) |
| `./scripts/build-backend.sh` | Build Laravel only (production, cached) |
| `./scripts/build-docs.sh` | Build MkDocs documentation only |

### Test & CI

| Script | Description |
|--------|-------------|
| `./scripts/test.sh` | Run backend tests + frontend unit tests + frontend build check |
| `./scripts/ci.sh` | Full CI pipeline locally (tests + all builds + artifact check) |
| `./scripts/package.sh [version]` | Build everything and create a release archive (ZIP/TAR) |

### Installation & Deployment

| Script | Description |
|--------|-------------|
| `php install.php` | Installer for the release package on the target server |
| `php install.php --seed` | Same as above, with test data |
| `php test.php` | Optional environment check for PHP, extensions, `.env`, superadmin hash, and database connectivity |
| `./scripts/install.sh` | Shell-based installer for repo-based/manual setups |

The release package includes root-level `install.php` and `test.php` so deployment and diagnostics do not depend on Bash being available on the target server.
The release package already includes the built frontend in `public/`, the PHP dependencies in `vendor/`, and `public/superadmin-password-helper.php` as a temporary setup helper for generating a bcrypt hash for `SUPERADMIN_PASSWORD`.

## Mock Mode (Frontend without Backend)

For testing the frontend without a running backend:

```bash
# Option 1: Via script
./scripts/dev-mock.sh

# Option 2: Manually
cd frontend && npx ng serve --configuration=mock

# Option 3: URL parameter with normal start
npx ng serve --proxy-config proxy.conf.json    # then http://localhost:4200?mock=true
```

In mock mode:
- Floating toolbar at bottom right to switch between **Employee**, **Admin** and **Superadmin**
- Realistic test data: 6 users, 8 vacations, 9 holidays, vacation account entries
- All API endpoints are simulated in-memory
- Changes are lost on reload

## Documentation

Documentation is bilingual (German + English) with MkDocs Material.

Published documentation:
- German: `https://julian-w.github.io/Hournest/`
- English: `https://julian-w.github.io/Hournest/en/`

```bash
# Build documentation
./scripts/build-docs.sh

# Start dev server (live reload)
./scripts/dev-docs.sh              # http://localhost:8001
```

Built documentation is in `documentation/site/` (covered by .gitignore).

## Tests

```bash
# Backend tests only
cd backend && php artisan test     # PHPUnit, SQLite :memory:

# Test everything (backend + frontend unit tests + frontend build)
./scripts/test.sh

# Test everything plus Playwright smoke bundle
RUN_E2E_SMOKE=true ./scripts/test.sh

# Full CI pipeline locally
./scripts/ci.sh

# Full CI pipeline plus Playwright smoke test
RUN_E2E_SMOKE=true ./scripts/ci.sh
```

Current verified status:
- Backend suite plus Angular unit tests are part of the default local test script
- Playwright E2E tests are available separately; the smoke bundle now boots a deterministic local backend with seeded `superadmin` and `e2e.employee@hournest.local` users and covers unauthenticated, authenticated, admin, vacation-review, and time-tracking save flows when enabled via `RUN_E2E_SMOKE=true`

## API Documentation

When the backend is running:
```
http://localhost:8000/docs/api       # Interactive Swagger UI
http://localhost:8000/docs/api.json  # OpenAPI JSON spec
```

## CI/CD & Releases

### Test Locally Before Release

```bash
# Run full pipeline locally
./scripts/ci.sh

# Build release archive locally
./scripts/package.sh v0.1.0
```

### Create GitHub Release

The GitHub Action (`.github/workflows/release.yml`) is triggered on tags:

```bash
git tag v0.1.0
git push origin v0.1.0
```

This automatically creates:
- Backend tests + production build
- Frontend unit tests + production build
- MkDocs build
- Workflow artifact (ZIP + TAR.GZ) on the Actions run
- GitHub Release with ZIP + TAR.GZ assets

Tags with `-rc`, `-beta` or `-alpha` are marked as pre-release.

### Deploy Documentation

The documentation workflow (`.github/workflows/docs.yml`) deploys MkDocs to GitHub Pages on pushes to `main`.

Required repository setting:
- GitHub Pages source: `GitHub Actions`

### GitHub Setup Checklist

Before relying on the GitHub runners, check:
- GitHub-hosted runners are enabled for the repository
- GitHub Pages source is set to `GitHub Actions`
- Releases are allowed for the repository
- No extra secrets are required for the current workflows

What you get after pushing a tag like `v0.1.0`:
- a successful Actions run with downloadable workflow artifacts
- a GitHub Release containing the ZIP and TAR.GZ package
- a deployment package that can be unpacked on a PHP webspace with `public/` as document root and the frontend already bundled

What you get after pushing to `main`:
- updated MkDocs documentation on GitHub Pages

### Test GitHub Action Locally (optional)

With [act](https://github.com/nektos/act) you can run the GitHub Action locally:

```bash
# Install act
winget install nektos.act         # Windows
brew install act                  # macOS/Linux

# Simulate release workflow locally
act push --tag v0.1.0
```

## Deployment

### With Installation Script (recommended)

```bash
# Optional preflight check:
php test.php

# Unpack release archive on server, then:
php install.php

# Or with test data:
php install.php --seed
```

The script automatically:
- Checks PHP version and extensions
- Creates `.env` from `.env.example` if it is missing, then asks you to edit it and rerun the installer
- Refuses to continue until `SUPERADMIN_PASSWORD` is set to a valid bcrypt hash
- Prints a temporary password plus a copyable bcrypt hash if the superadmin password is missing or invalid
- Runs migrations
- Builds caches
- Leaves the extracted folder ready so you can point the web root to `public/`

`php test.php` is optional, but useful before and after installation. It checks PHP, required extensions, `.env`, the superadmin bcrypt hash, writable directories, and database connectivity when configured.

### First Steps After Installation

Recommended initial setup after the first successful install:

1. Log in with the superadmin via **Admin Login**
2. Verify the application is reachable
3. Complete OIDC and `ADMIN_EMAILS` settings in `.env` if needed
4. Replace `SUPERADMIN_PASSWORD` in `.env` with your own bcrypt hash if you used the installer-generated temporary value
5. Delete `public/superadmin-password-helper.php` afterwards if you want to remove the helper
6. Verify that `APP_DEBUG=false`

The superadmin password is managed through `.env`, not through the normal user administration.

### Manual

1. Unpack release archive or build locally with `./scripts/package.sh`
2. Upload the full extracted release directory to the server
3. Set `public/` as document root
4. Configure `.env`, optionally run `php test.php`, set a valid bcrypt hash for `SUPERADMIN_PASSWORD`, then run `php install.php`
5. Delete `public/superadmin-password-helper.php` after setup if you want to remove the helper
6. If using OAuth: configure OIDC provider, register app, set redirect URL

On the target server, the release package does not require Node.js, Angular CLI, MkDocs, or Composer as long as `vendor/` is present.

### Web Server

**Apache:** `.htaccess` is included in `public/` -- `mod_rewrite` must be enabled.

**Nginx:** Configure SPA routing for frontend + PHP-FPM for backend. Use the deployment documentation for an example setup.

See the documentation under "Deployment" for detailed instructions.

## License

MIT License -- see [LICENSE](LICENSE)
