# Deployment

This page describes deployment of the **release package** on a Synology NAS or on classic PHP hosting.

Important: The target system does **not** need Node.js, Angular, Angular CLI, or MkDocs for the release package. The frontend is already included in `public/`.

---

## Target System: What Is Actually Required

In the standard case, the target system only needs:

- PHP 8.5+
- A web server with the **document root** pointing to `public/`
- The required PHP extensions
- A database:
  - SQLite via `pdo_sqlite` by default
  - alternatively MySQL/MariaDB via `pdo_mysql`
  - alternatively PostgreSQL via `pdo_pgsql`

For a release package that already contains `vendor/`, **Composer is not required** on the target system.

---

## NAS Deployment (e.g. Synology)

### Prerequisites

- NAS with web server support, for example Synology DSM 7.x
- **Web Station**
- **PHP 8.5**
- Optionally an OIDC provider, for example Synology SSO Server
- SSH access is helpful, but not required

---

### Step 1: Configure PHP

1. Open **Web Station**
2. Go to **Script Language Settings** > **PHP**
3. Create a new PHP profile or edit an existing one
4. Enable at least these extensions:
   - `mbstring`
   - `openssl`
   - `tokenizer`
   - `xml`
   - `curl`
   - `fileinfo`
   - plus the database driver you want to use:
     - `pdo_sqlite` for SQLite
     - `pdo_mysql` for MySQL/MariaDB
     - `pdo_pgsql` for PostgreSQL
5. Save the profile

---

### Step 2: Upload the Release Package

1. Extract the release archive locally
2. Copy the entire extracted folder to the NAS, for example to `/volume1/web/hournest/`
3. Set the **document root** in Web Station to `/volume1/web/hournest/public`

The release package already contains:

- the built frontend in `public/`
- the PHP dependencies in `vendor/`
- `install.php` for initialization

---

### Step 3: Create `.env`

```bash
cd /volume1/web/hournest
cp .env.example .env
```

Example for an SQLite setup:

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-nas-domain.com
FRONTEND_URL=https://your-nas-domain.com

DB_CONNECTION=sqlite
DB_DATABASE=/volume1/web/hournest/database/database.sqlite

AUTH_OAUTH_ENABLED=true
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_WELLKNOWN_URL=https://your-nas-address:5001/webman/sso/.well-known/openid-configuration
OIDC_REDIRECT_URI=${APP_URL}/api/auth/callback

SANCTUM_STATEFUL_DOMAINS=your-nas-domain.com

SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=$2y$12$replace-with-bcrypt-hash

ADMIN_EMAILS=admin1@company.com,admin2@company.com
```

!!! danger "Security"
    Set `APP_DEBUG=false` and change the superadmin password before going live.

---

### Step 4: Initialize the Application

```bash
cd /volume1/web/hournest
php install.php
```

Optionally with test data:

```bash
php install.php --seed
```

If you first need to generate a bcrypt hash for `SUPERADMIN_PASSWORD`, you can temporarily open `public/superadmin-password-helper.php` in the browser and delete the file afterwards.

---

### Step 5: Configure OIDC (optional)

Only required if you want to use SSO:

1. Configure the OIDC service or SSO server
2. Register a new application
3. Set the redirect URI to `https://your-nas-domain.com/api/auth/callback`
4. Copy client ID and client secret into `.env`
5. Use the provider's well-known URL

!!! note "HTTPS"
    In practice, OIDC almost always requires HTTPS.

---

### Step 6: Apply Updates

After updating the release package:

```bash
cd /volume1/web/hournest
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Classic PHP Hosting

Hournest can also run on shared hosting, a VPS, or other classic PHP hosting.

### Prerequisites

- PHP 8.5+
- Web server with **document root** pointing to `public/`
- Required PHP extensions including the matching database driver
- Optional SSH/SFTP access
- Optional OIDC provider for SSO

The following are also **not** required on the target system for the release package:

- Node.js
- Angular
- Angular CLI
- MkDocs
- Composer, as long as `vendor/` is already included

### Standard Deployment with the Release Package

1. Extract the release archive
2. Upload the entire extracted folder
3. Point the **document root** to `public/`
4. Copy `.env.example` to `.env` and configure it
5. Run `php install.php`
6. Delete `public/superadmin-password-helper.php` again if you used it

### Database Examples

SQLite:

```ini
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite
```

MySQL/MariaDB:

```ini
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=hournest
DB_USERNAME=hournest_user
DB_PASSWORD=secure_password
```

PostgreSQL:

```ini
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=hournest
DB_USERNAME=hournest_user
DB_PASSWORD=secure_password
```

---

## Building Your Own Package or Deploying Frontend Separately

This section is relevant **only for developers**.

If you are not using the finished release package, but build your own package or deploy frontend and backend separately, the build machine additionally needs Node.js, npm, and the other development tools.

Typical frontend build:

```bash
cd frontend
npm install
npx ng build --configuration=production
```

The build output is then located in `frontend/dist/frontend/browser/`.

---

## CI/CD & Releases

### Build Scripts

All scripts are located in `scripts/`:

| Script | Description |
|--------|-------------|
| `./scripts/build-all.sh` | Builds frontend + backend + documentation |
| `./scripts/build-frontend.sh` | Builds only the Angular frontend |
| `./scripts/build-backend.sh` | Builds only the Laravel backend |
| `./scripts/build-docs.sh` | Builds only the MkDocs documentation |
| `./scripts/test.sh` | Backend tests + frontend unit tests + frontend build check |
| `./scripts/ci.sh` | Full local CI pipeline |
| `./scripts/package.sh [version]` | Builds everything and creates the release archive |

### GitHub Actions

The GitHub Action `.github/workflows/release.yml` runs on tags and automatically creates a release package with:

1. Backend tests
2. Frontend tests and frontend build
3. MkDocs build
4. Release archive with the frontend bundled into `public/`
5. GitHub release artifacts

Additionally, `.github/workflows/docs.yml` publishes the documentation on pushes to `main`.

---

## Production Checklist

- [ ] `APP_ENV=production` is set
- [ ] `APP_DEBUG=false` is set
- [ ] Superadmin password changed
- [ ] Matching database driver enabled as a PHP extension
- [ ] `SANCTUM_STATEFUL_DOMAINS` configured correctly
- [ ] OIDC configured correctly if used
- [ ] `public/` is the actual document root
- [ ] Migrations have been run
- [ ] `storage/` and `bootstrap/cache/` are writable
