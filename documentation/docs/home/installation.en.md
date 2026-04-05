# Installation

This guide describes how to set up Hournest for local development.

---

## Clone the Repository

```bash
git clone <repository-url> hournest
cd hournest
```

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
composer install
```

### 2. Configure Environment Variables

Copy the template and adjust the values:

```bash
cp ../.env.example .env
```

!!! warning "Important"
    The `.env` file contains sensitive data (OIDC credentials, superadmin password) and must **never** be committed to the Git repository.

The most important settings for local development:

```ini
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:4200
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/backend/database/database.sqlite
```

All variables are described in detail on the [Configuration](configuration.md) page.

### 3. Generate Application Key

```bash
php artisan key:generate
```

### 4. Create and Migrate Database

For SQLite, the database file must be created first:

```bash
touch database/database.sqlite
php artisan migrate
```

### 5. Optional Seeder

If test data is needed:

```bash
php artisan db:seed
```

### 6. Start the Backend

```bash
php artisan serve
```

The backend is now available at `http://localhost:8000`.

!!! tip "API Documentation"
    After starting, the auto-generated API documentation is available at `http://localhost:8000/docs/api`.

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
ng serve
```

The frontend is now available at `http://localhost:4200`.

---

## Mock Mode (without Backend)

Mock mode enables frontend development entirely without a running backend. All API calls are replaced by realistic test data.

### Start via Build Configuration

```bash
cd frontend
ng serve --configuration=mock
```

### Start via URL Parameter

Alternatively, mock mode can be activated with a normal `ng serve` via URL parameter:

```
http://localhost:4200?mock=true
```

!!! info "Mock Mode Details"
    In mock mode, a toolbar appears at the bottom of the screen that allows switching between the Employee, Admin, and Superadmin roles. More details at [Mock Mode](../dev/mock-mode.md).

---

## First Start and Login

### With SSO (OIDC)

1. OIDC must be correctly configured in `.env` (see [Configuration](configuration.md))
2. Open `http://localhost:4200` in the browser
3. Click "Sign in with SSO"
4. After successful authentication, the user is automatically created

### With Superadmin (without SSO)

1. Set superadmin credentials in `.env` (`SUPERADMIN_USERNAME`, `SUPERADMIN_PASSWORD`)
2. `SUPERADMIN_PASSWORD` must be a bcrypt hash, not plaintext
3. Optionally open `public/superadmin-password-helper.php` once in the browser, copy the generated hash, and delete the file afterwards
4. Open `http://localhost:4200` in the browser
5. Click "Admin Login" below the SSO button
6. Enter username and the plaintext password you generated

!!! note "Role Assignment"
    - New users automatically receive the **Employee** role
    - Users whose email is in `ADMIN_EMAILS` automatically receive the **Admin** role
    - The superadmin account is automatically created on first login

---

## Using Scripts

Pre-built scripts are available in the `scripts/` folder. They work on Windows (Git Bash) and Linux.

### Development

| Script | Description |
|--------|-------------|
| `./scripts/dev.sh` | Starts backend + frontend in parallel |
| `./scripts/dev-mock.sh` | Starts frontend in mock mode (no backend needed) |
| `./scripts/dev-docs.sh` | Starts MkDocs dev server on port 8001 |

### Build

| Script | Description |
|--------|-------------|
| `./scripts/build-all.sh` | Builds frontend + backend + documentation |
| `./scripts/build-frontend.sh` | Builds Angular only (production) |
| `./scripts/build-backend.sh` | Builds Laravel only (production, cached) |
| `./scripts/build-docs.sh` | Builds MkDocs documentation only |

### Test & CI

| Script | Description |
|--------|-------------|
| `./scripts/test.sh` | Backend tests + frontend unit tests + frontend build check |
| `./scripts/ci.sh` | Full CI pipeline locally (tests + all builds + artifact check) |
| `./scripts/package.sh [version]` | Builds everything and creates a release archive (ZIP/TAR) |

!!! tip "Quick start with scripts"
    Instead of setting up backend and frontend manually:
    ```bash
    cd backend && cp ../.env.example .env && composer install && php artisan key:generate && touch database/database.sqlite && php artisan migrate --seed && cd ..
    cd frontend && npm install && cd ..
    ./scripts/dev.sh
    ```

---

## Running Tests

```bash
# Backend tests only
cd backend
php artisan test

# Backend tests + frontend unit tests + frontend build check
./scripts/test.sh

# Full CI pipeline (same as GitHub Actions)
./scripts/ci.sh

# Full CI pipeline including Playwright smoke test
RUN_E2E_SMOKE=true ./scripts/ci.sh
```

The tests use an SQLite `:memory:` database and do not require separate configuration.

---

## Building Documentation

```bash
# Build documentation (output to documentation/site/)
./scripts/build-docs.sh

# Dev server with live reload
./scripts/dev-docs.sh              # http://localhost:8001
```

!!! note "Documentation prerequisites"
    Python 3 and pip must be installed. Dependencies (`mkdocs-material`, `mkdocs-static-i18n`) are installed automatically.
