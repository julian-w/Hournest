# Installation

This page describes the **normal installation from the release package** on a server, web host, or NAS.

For end users or administrators: you do **not** need to clone the repository, build Angular, or run `composer install` when using the finished release package.

If you want to work on the project itself, use [Local Development](../dev/local-setup.md) instead.

---

## Quick Overview

The standard flow is:

1. Download the release package from the GitHub Releases page
2. Extract it and copy the full folder to the server
3. Point the document root to `public/`
4. Copy `.env.example` to `.env` and adjust it
5. Optionally run `php test.php`
6. Run `php install.php`

The release package already contains:

- the frontend in `public/`
- the PHP dependencies in `vendor/`
- the diagnostic check `test.php`
- the installer `install.php`

Release page:

```text
https://github.com/julian-w/Hournest/releases
```

---

## Target System Requirements

Only the following are required:

- PHP 8.5+
- Web server or PHP hosting with `public/` as document root
- required PHP extensions:
  - always: `mbstring`, `openssl`, `tokenizer`, `xml`, `curl`, `fileinfo`
  - plus depending on the database:
    - `pdo_sqlite`
    - `pdo_mysql`
    - or `pdo_pgsql`

Not required on the target system:

- Git
- Node.js
- npm
- Angular CLI
- MkDocs
- Composer, as long as `vendor/` is included in the release package

---

## 1. Extract and Upload the Release Package

1. Download the release archive from the GitHub Releases page
2. Extract it locally
3. Copy the entire extracted folder to the target server

Example:

```text
/var/www/hournest/
```

or on a Synology, for example:

```text
/volume1/web/hournest/
```

---

## 2. Point the Document Root to `public/`

The web server must point to the `public/` folder inside the package.

Example:

```text
/var/www/hournest/public/
```

Without this step, Laravel will not work correctly.

---

## 3. Create `.env`

Go into the uploaded folder and copy the template:

```bash
cp .env.example .env
```

Then adjust `.env`.

A simple SQLite example:

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://example.com
FRONTEND_URL=https://example.com

DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite

AUTH_OAUTH_ENABLED=true

SANCTUM_STATEFUL_DOMAINS=example.com

SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=
```

If MySQL or PostgreSQL is used, set the respective database credentials instead.

---

## 4. Set the Superadmin Password

A valid `SUPERADMIN_PASSWORD` hash is **required**.

If `SUPERADMIN_PASSWORD` in `.env` is empty or not a valid bcrypt hash, `php install.php` will intentionally stop and print:

- a temporary strong password
- a copyable bcrypt hash for your `.env`

Alternatively, you can generate the hash yourself. For that, you can temporarily open:

```text
public/superadmin-password-helper.php
```

in the browser and generate the hash. Afterwards, the file **can** be deleted again. This is recommended, but not strictly required.

---

## 5. Run the Installer

Optionally before that:

```bash
php test.php
```

`test.php` checks without modifying anything:

- PHP version
- required extensions
- `.env`
- `SUPERADMIN_PASSWORD`
- writable directories
- database connectivity when `.env` is already configured

Inside the package directory:

```bash
php install.php
```

Optionally with test data:

```bash
php install.php --seed
```

The installer:

- checks the PHP version and extensions
- checks whether `SUPERADMIN_PASSWORD` is configured securely
- intentionally stops if the superadmin hash is missing or invalid and prints a copyable replacement value
- only installs dependencies via Composer if `vendor/` is missing
- creates the SQLite database file when needed
- runs migrations
- builds Laravel caches

`test.php` can also remain on the server after installation and be run again later for diagnostics.

---

## 6. Open the Application

After that, Hournest can be opened directly via the configured URL.

---

## First Steps After Installation

Recommended flow right after the first successful installation:

1. Log in with the superadmin via **"Admin Login"**
2. Verify that the application is reachable and working
3. If needed, complete `ADMIN_EMAILS` and the OIDC settings in `.env`
4. If the superadmin hash was only set provisionally, replace `SUPERADMIN_PASSWORD` in `.env` with a new bcrypt hash
5. Delete `public/superadmin-password-helper.php` if desired and if it was used
6. Verify `APP_DEBUG=false`

### Change the Superadmin Password

The superadmin is an emergency account and is **not** managed through the normal user administration. Its password is controlled through the `.env` file.

Procedure:

1. Temporarily open `public/superadmin-password-helper.php` in the browser
2. Generate a bcrypt hash for the desired new password
3. Replace the value of `SUPERADMIN_PASSWORD=` in `.env`
4. Delete `public/superadmin-password-helper.php` afterwards if desired
5. Test the login again with the new password

Example:

```ini
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=$2y$12$your-generated-bcrypt-hash
```

---

## Local Development

If you want to develop Hournest locally, this is not the right guide. For that, use the developer page [Local Development](../dev/local-setup.md).
