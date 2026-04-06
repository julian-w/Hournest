# Installation for Development

This page describes how to set up Hournest for **local development**.

!!! info "Only deploying?"
    If you only want to copy Hournest to a server or NAS and run it there, use [Deployment](../dev/deployment.md) instead. The release package already contains the frontend in `public/` and the PHP dependencies in `vendor/`.

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
    The `.env` file contains sensitive data and must **never** be committed to the Git repository.

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

### 4. Create and Migrate the Database

For SQLite, create the database file first:

```bash
touch database/database.sqlite
php artisan migrate
```

### 5. Optional Seeder

If you need test data:

```bash
php artisan db:seed
```

### 6. Start the Backend

```bash
php artisan serve
```

The backend is now available at `http://localhost:8000`.

!!! tip "API Documentation"
    After startup, the auto-generated API documentation is available at `http://localhost:8000/docs/api`.

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start the Development Server

A global Angular CLI is not required. Use the local project CLI:

```bash
npx ng serve --proxy-config proxy.conf.json
```

The frontend is now available at `http://localhost:4200`.

---

## Mock Mode (without Backend)

Mock mode allows frontend development without a running backend. All API calls are replaced with realistic test data.

### Start via Build Configuration

```bash
cd frontend
npx ng serve --configuration=mock
```

### Start via URL Parameter

Alternatively, mock mode can be activated with a URL parameter during a normal start:

```
http://localhost:4200?mock=true
```

!!! info "Mock Mode Details"
    In mock mode, a toolbar appears at the bottom of the screen. More details are available in [Mock Mode](../dev/mock-mode.md).

---

## First Start and Login

### With SSO (OIDC)

1. OIDC must be configured correctly in `.env`
2. Open `http://localhost:4200` in the browser
3. Click "Sign in with SSO"
4. After successful authentication, the user is created automatically

### With Superadmin (without SSO)

1. Set superadmin credentials in `.env` (`SUPERADMIN_USERNAME`, `SUPERADMIN_PASSWORD`)
2. `SUPERADMIN_PASSWORD` must be a bcrypt hash, not plaintext
3. Optionally open `backend/public/superadmin-password-helper.php` once in the browser, generate a hash, and delete the file afterwards
4. Open `http://localhost:4200` in the browser
5. Click "Admin Login" below the SSO button
6. Enter username and the plaintext password

!!! note "Role Assignment"
    - New users automatically receive the **Employee** role
    - Users whose email is listed in `ADMIN_EMAILS` automatically receive the **Admin** role
    - The superadmin account is created automatically on first login

---

## Using Scripts

The `scripts/` directory contains prepared scripts for local development, testing, and builds.

### Development

| Script | Description |
|--------|-------------|
| `./scripts/dev.sh` | Starts backend + frontend in parallel |
| `./scripts/dev-mock.sh` | Starts the frontend in mock mode |
| `./scripts/dev-docs.sh` | Starts the MkDocs dev server on port 8001 |

### Build

| Script | Description |
|--------|-------------|
| `./scripts/build-all.sh` | Builds frontend + backend + documentation |
| `./scripts/build-frontend.sh` | Builds only the Angular frontend |
| `./scripts/build-backend.sh` | Builds only the Laravel backend |
| `./scripts/build-docs.sh` | Builds only the MkDocs documentation |

### Test & CI

| Script | Description |
|--------|-------------|
| `./scripts/test.sh` | Backend tests + frontend unit tests + frontend build check |
| `./scripts/ci.sh` | Full local CI pipeline |
| `./scripts/package.sh [version]` | Builds everything and creates a release archive |

!!! tip "Quick start with scripts"
    For local development, this is usually enough:
    ```bash
    cd backend && cp ../.env.example .env && composer install && php artisan key:generate && touch database/database.sqlite && php artisan migrate --seed && cd ..
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

The tests use an SQLite in-memory database and do not require a separate database installation.

---

## Building Documentation

```bash
# Build documentation (output in documentation/site/)
./scripts/build-docs.sh

# Dev server with live reload
./scripts/dev-docs.sh              # http://localhost:8001
```

!!! note "Documentation prerequisites"
    Python 3 and pip must be installed. Dependencies are installed from `documentation/requirements.txt`.
