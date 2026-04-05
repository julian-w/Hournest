# Deployment

This page describes deploying Hournest on a Synology NAS (primary use case) as well as on classic PHP hosting.

---

## NAS Deployment (e.g. Synology)

### Prerequisites

- NAS with web server support (e.g. Synology DSM 7.x)
- **Web Station** (install from the Package Center)
- **PHP 8.5** (installable via Web Station)
- **SSO Server** (from the Package Center, for OIDC)
- SSH access to the NAS (recommended)

---

### Step 1: Configure PHP

1. Open **Web Station** in DSM
2. Go to **Script Language Settings** > **PHP**
3. Create a new PHP profile or edit the existing one:
    - PHP version: **8.5**
    - Enable extensions: `sqlite3`, `mbstring`, `openssl`, `tokenizer`, `xml`, `curl`, `fileinfo`, `zip`, `pdo_sqlite`
4. Save the profile

---

### Step 2: Deploy the Backend

1. Copy the entire extracted release folder to the NAS (for example to `/volume1/web/hournest/`)
2. Create the `.env` file:

```bash
cd /volume1/web/hournest
cp .env.example .env
```

3. Configure `.env` for production:

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-nas-domain.com
FRONTEND_URL=https://your-nas-domain.com

DB_CONNECTION=sqlite
DB_DATABASE=/volume1/web/hournest/database/database.sqlite

OIDC_CLIENT_ID=your-actual-client-id
OIDC_CLIENT_SECRET=your-actual-client-secret
OIDC_WELLKNOWN_URL=https://your-nas-address:5001/webman/sso/.well-known/openid-configuration
OIDC_REDIRECT_URI=${APP_URL}/api/auth/callback

SANCTUM_STATEFUL_DOMAINS=your-nas-domain.com

SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=$2y$12$replace-with-bcrypt-hash

ADMIN_EMAILS=admin1@company.com,admin2@company.com
```

!!! danger "Security"
    Set `APP_DEBUG=false` and change the superadmin password!

4. Initialize the application:

```bash
cd /volume1/web/hournest
php install.php
```

5. Configure Web Station:
    - Create a new virtual host or service
    - **Document Root:** `/volume1/web/hournest/public`
    - **PHP profile:** The profile created in Step 1
    - Ensure URL rewriting works (`.htaccess` or nginx configuration)

---

### Step 3: Set Up SSO Server / OIDC

1. Open the **SSO Server** in DSM
2. Enable the OIDC service if not already done
3. Register a new application:
    - **Name:** Hournest
    - **Redirect URI:** `https://your-nas-domain.com/api/auth/callback`
4. Copy **Client ID** and **Client Secret** to the `.env` file
5. Verify the **Well-Known URL**: `https://your-nas-address:5001/webman/sso/.well-known/openid-configuration`

!!! note "HTTPS"
    The SSO Server requires HTTPS. Make sure your NAS has a valid SSL certificate (e.g., via Let's Encrypt in the DSM Control Panel).

---

### Step 4: Provide the Frontend

In the release package, the frontend is already bundled into `public/`.

If you package locally yourself or want to deploy it separately:

1. Build the frontend on your development machine:

```bash
cd frontend
npm install
ng build --configuration production
```

2. The build output is in `frontend/dist/frontend/browser/` (or similar)
3. Copy the contents of the build output folder to the NAS

**Option A: Same host as the backend**

Copy the frontend files to the package root's `public/` folder or set up a separate document root.

**Option B: Separate virtual host**

Create a separate virtual host in Web Station for the frontend with the build output as document root. Make sure all routes are redirected to `index.html` (SPA routing).

---

### Step 5: Database Migration

After each update:

```bash
cd /volume1/web/hournest
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

---

## Classic PHP Hosting

Hournest can also be operated on classic PHP hosting (shared hosting, VPS, etc.).

### Prerequisites

- PHP 8.5+ with required extensions
- Composer
- SSH access (recommended)
- MySQL or PostgreSQL (alternatively SQLite)
- Subdomain or separate path for the frontend

### Backend Deployment

1. Upload the entire extracted release folder via SSH/SFTP
2. Set the **Document Root** to `public/`
3. Create and configure the `.env` file
4. Run `php install.php`
5. Delete `public/superadmin-password-helper.php` afterwards if you used it

### Frontend Deployment

1. Build the frontend locally: `ng build --configuration production`
2. Upload the build output to the server
3. Configure URL rewriting for SPA routing (all routes -> `index.html`)

### Database

For production hosting, MySQL or PostgreSQL is recommended:

```ini
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=hournest
DB_USERNAME=hournest_user
DB_PASSWORD=secure_password
```

---

## CI/CD & Releases

### Build Scripts

All scripts are in `scripts/` and work on Windows (Git Bash) and Linux:

| Script | Description |
|--------|-------------|
| `./scripts/build-all.sh` | Builds frontend + backend + documentation |
| `./scripts/build-frontend.sh` | Builds Angular only (production) |
| `./scripts/build-backend.sh` | Builds Laravel only (production, cached) |
| `./scripts/build-docs.sh` | Builds MkDocs documentation only |
| `./scripts/test.sh` | Backend tests + frontend unit tests + frontend build check |
| `./scripts/ci.sh` | Full CI pipeline locally |
| `./scripts/package.sh [version]` | Builds everything and creates release archive |

### Running CI Locally

Before tagging a release, verify the pipeline locally:

```bash
# Full pipeline (tests + all builds + artifact check)
./scripts/ci.sh

# Create release archive
./scripts/package.sh v0.1.0
# -> Creates dist/hournest-v0.1.0.zip and .tar.gz
```

### GitHub Actions

The GitHub Action `.github/workflows/release.yml` is **only triggered on tags**:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The action automatically:

1. Runs backend tests (PHPUnit)
2. Runs frontend unit tests and builds the frontend (Angular production)
3. Builds documentation (MkDocs)
4. Creates a release archive (ZIP + TAR.GZ) with the frontend bundled into `public/`
5. Uploads workflow artifacts
6. Creates GitHub Release

Additionally, `.github/workflows/docs.yml` deploys the documentation to GitHub Pages on pushes to `main`.

Required repository setting:
- GitHub Pages source must be set to `GitHub Actions`

### GitHub Runner Checklist

Before relying on the workflows in production:

- GitHub-hosted runners must be enabled for the repository
- GitHub Pages must use `GitHub Actions` as its source
- Releases must be allowed for the repository
- No additional secrets are required for the current setup

Result of `git push origin v0.1.0`:

- backend, frontend, and documentation are built
- ZIP and TAR.GZ are uploaded as workflow artifacts
- the same archives are attached to the GitHub Release
- the release package can be uploaded directly to classic PHP hosting or a NAS

Result of a push to `main`:

- the MkDocs documentation is published to GitHub Pages

Tags with `-rc`, `-beta`, or `-alpha` are marked as pre-release.

### Testing GitHub Actions Locally

Use [act](https://github.com/nektos/act) to run the action locally (requires Docker):

```bash
# Install act
winget install nektos.act         # Windows
brew install act                  # macOS/Linux

# Simulate release workflow
act push --tag v0.1.0
```

!!! tip "Recommendation"
    For daily use, `./scripts/ci.sh` is sufficient. `act` is only needed when debugging the GitHub Action itself.

---

## Production Checklist

!!! warning "Before Going Live"
    Check the following points before going to production:

- [ ] `APP_DEBUG=false` is set
- [ ] `APP_ENV=production` is set
- [ ] Superadmin password changed (not `changeme`)
- [ ] OIDC credentials configured
- [ ] `SANCTUM_STATEFUL_DOMAINS` set to the correct frontend domain
- [ ] `ADMIN_EMAILS` filled with the correct admin email addresses
- [ ] SSL/HTTPS enabled
- [ ] Database migrations executed
- [ ] `config:cache` and `route:cache` executed
- [ ] Holidays entered for the current year
- [ ] Database file permissions (for SQLite) correctly set
- [ ] Log directory (`storage/logs/`) is writable
