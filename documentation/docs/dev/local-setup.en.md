# Local Development

This page describes how to set up Hournest for **local development**.

If you only want to copy Hournest to a server or NAS and run it there, use [Installation](../home/installation.md) or the more detailed [Deployment](deployment.md) page instead.

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

```bash
cp ../.env.example .env
```

!!! warning "Important"
    The `.env` file contains sensitive data and must **never** be committed to the Git repository.

Important settings for local development:

```ini
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:4200
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/backend/database/database.sqlite
```

All variables are documented in detail on the [Configuration](../home/configuration.md) page.

### 3. Generate Application Key

```bash
php artisan key:generate
```

### 4. Create and Migrate the Database

```bash
touch database/database.sqlite
php artisan migrate
```

### 5. Optional Seeder

```bash
php artisan db:seed
```

### 6. Start the Backend

```bash
php artisan serve
```

The backend is then available at `http://localhost:8000`.

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

The frontend is then available at `http://localhost:4200`.

---

## Mock Mode

```bash
cd frontend
npx ng serve --configuration=mock
```

Alternative:

```text
http://localhost:4200?mock=true
```

See [Mock Mode](mock-mode.md) for more details.

---

## Login in Local Development

### With SSO (OIDC)

1. Configure OIDC in `.env`
2. Open `http://localhost:4200`
3. Use "Sign in with SSO"

### With Superadmin

1. Set `SUPERADMIN_USERNAME` and `SUPERADMIN_PASSWORD` in `.env`
2. Store `SUPERADMIN_PASSWORD` as a bcrypt hash
3. Optionally open `backend/public/superadmin-password-helper.php` briefly in the browser, generate a hash, and delete the file afterwards

---

## Scripts

### Development

| Script | Description |
|--------|-------------|
| `./scripts/dev.sh` | Starts backend + frontend in parallel |
| `./scripts/dev-mock.sh` | Starts frontend in mock mode |
| `./scripts/dev-docs.sh` | Starts MkDocs dev server on port 8001 |

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

---

## Tests

```bash
cd backend
php artisan test

./scripts/test.sh
./scripts/ci.sh
RUN_E2E_SMOKE=true ./scripts/ci.sh
```

---

## Build Documentation

```bash
./scripts/build-docs.sh
./scripts/dev-docs.sh
```

Python 3 and pip must be installed for this.
