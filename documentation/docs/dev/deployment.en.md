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

Important:

- schema-changing updates currently require CLI access or Docker in this classic path
- there is intentionally **no** automatic web updater yet for hosting without CLI
- if a release expects a newer database structure, migrations must be run explicitly
- downgrades to an older package are blocked on startup once the database contains migrations that are no longer present in the current code

So if you use classic hosting **without** CLI access, it is only really convenient for releases that do not require database migrations. For schema-changing updates, Docker or a host with CLI access is currently the safer path.

### Update Paths at a Glance

#### 1. Update with CLI access

This is the recommended path for classic hosting outside Docker.

Flow:

1. Upload or extract the new release package
2. Keep the existing `.env`
3. Run `php artisan migrate --force`
4. Rebuild the Laravel caches:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Advantages:

- schema-changing updates work cleanly
- the downgrade guard remains active
- no extra web helper scripts are needed

#### 2. Update with PHP/web access only, but without CLI

Hournest currently does **not** support this path for general schema-changing updates.

In concrete terms:

- there is currently no `update.php` and no web updater
- you may replace files, but you cannot safely run required migrations
- if an older package is deployed against a newer database, the downgrade guard intentionally blocks startup

So this operating mode currently only makes sense:

- for first-time installations using `install.php`
- for releases that do not require database migrations

If you must operate without CLI long-term, one of these paths is currently recommended:

- use Docker/Compose
- choose hosting with SSH/CLI access
- let the hoster perform updates for schema-changing releases

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

## Docker and Single-Container Runtime

For developers and later simple deployments, the repository now includes one shared container path:

- `Dockerfile`
- `compose.yaml`
- `docker/entrypoint.sh`
- `docker/demo.env.example`
- `docker/app.env.example`

The explicit goal is **not a separate demo image**, but one shared image with a runtime switch:

```env
HOURNEST_RUNTIME_MODE=demo
```

Supported values:

- `demo`: starts Hournest as a public or internal demo
- `app`: starts the same container as the normal application

### Start the demo quickly

```bash
cp docker/demo.env.example .env.docker
docker compose --env-file .env.docker up --build -d
```

The compose defaults intentionally start in demo mode on `http://localhost:8080`.

What the container does automatically in that case:

- sets `DEMO_ENABLED=true` in demo mode
- sets `AUTH_OAUTH_ENABLED=false` in demo mode
- defaults to SQLite at `/var/lib/hournest/database/demo.sqlite`
- runs `php artisan hournest:demo:refresh` on boot
- optionally starts the Laravel scheduler in the background

Useful commands afterwards:

```bash
docker compose --env-file .env.docker logs -f hournest
docker compose --env-file .env.docker ps
```

### Switch to normal app mode

```bash
cp docker/app.env.example .env.docker
docker compose --env-file .env.docker up --build -d
```

This keeps the exact same image but drops the enforced demo profile. That way the later production path already matches the demo container path.

On first boot in app mode:

- if `APP_KEY` is missing, it is generated automatically
- if `SUPERADMIN_PASSWORD` is missing, the container generates an initial password once and stores only its bcrypt hash in the persistent runtime `.env`
- the plaintext password is printed to the container log for that purpose

To inspect it:

```bash
docker compose --env-file .env.docker logs --tail=100 hournest
```

### Important runtime variables

These variables are evaluated by the container entrypoint:

```env
HOURNEST_RUNTIME_MODE=demo
HOURNEST_AUTO_MIGRATE=true
HOURNEST_ENABLE_SCHEDULER=true
HOURNEST_DEMO_REFRESH_ON_BOOT=true
```

Notes:

- `HOURNEST_RUNTIME_MODE=demo` and OAuth/OIDC are intentionally incompatible
- for real demo deployments, set `DEMO_LOGIN_PASSWORD` explicitly
- for normal operation you can still use SQLite, MySQL, or PostgreSQL
- `storage/` and `/var/lib/hournest` are persisted as volumes in compose
- on startup, the application also checks whether the database already contains migrations that are missing from the current image; if so, the container exits with a clear downgrade error message
- the container image includes an HTTP healthcheck against `/up`

### What lives inside the image and what stays outside

Only immutable application assets live inside the image:

- Laravel code
- built Angular files
- PHP dependencies

Persistent state stays outside the image in runtime volumes:

- `/var/lib/hournest/env/.env`
- `/var/lib/hournest/database/*.sqlite`
- `/var/www/html/storage`

Important:

- the entrypoint links `/var/www/html/.env` to `/var/lib/hournest/env/.env`
- on first boot, this runtime `.env` is created from `.env.example` if missing
- if `APP_KEY` is missing, it is generated automatically and written into that runtime `.env`
- if `SUPERADMIN_PASSWORD` is missing or invalid, the container generates a strong initial password once, stores only the bcrypt hash in the runtime `.env`, and prints the plaintext password to the container console

### Changing values later

After first boot, there are two clean options:

1. `docker exec -it <container> bash` and edit `/var/lib/hournest/env/.env`
2. use compose/orchestrator environment variables

The runtime `.env` is meant for persistent generated defaults. Explicit container environment variables override those values on startup.

### Updating in Docker

For the same container path, the usual flow is:

```bash
docker compose --env-file .env.docker pull
docker compose --env-file .env.docker up -d
```

Or, for locally built images:

```bash
docker compose --env-file .env.docker up --build -d
```

When `HOURNEST_RUNTIME_MODE=app` and `HOURNEST_AUTO_MIGRATE=true` are set, the entrypoint runs migrations automatically on startup.

Important:

- when downgrading to an older image, startup stops with a clear error in the container logs
- the database remains unchanged
- a deliberate emergency override would only be possible via `APP_ALLOW_SCHEMA_DOWNGRADE=true`

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
