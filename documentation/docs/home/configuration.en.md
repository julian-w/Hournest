# Configuration

All Hournest settings are managed via the `.env` file in the `backend/` directory. This page documents every variable in detail.

!!! warning "Security"
    The `.env` file contains sensitive data and must **never** be committed to the Git repository. A template with placeholders is available as `.env.example` in the project root.

---

## App Settings

| Variable      | Default                | Description                                    |
|---------------|------------------------|------------------------------------------------|
| `APP_NAME`    | `Hournest`             | Application name                               |
| `APP_ENV`     | `local`                | Environment: `local`, `staging`, `production`  |
| `APP_KEY`     | *(empty)*              | Encryption key, generated with `php artisan key:generate` |
| `APP_DEBUG`   | `true`                 | Debug mode: `true` for development, `false` for production |
| `APP_URL`     | `http://localhost:8000`| Backend URL                                    |

!!! danger "APP_DEBUG in Production"
    `APP_DEBUG` must **always** be set to `false` in production environments. Otherwise, detailed error messages including stack traces will be sent to the client.

---

## Frontend URL

| Variable       | Default                 | Description                                    |
|----------------|-------------------------|------------------------------------------------|
| `FRONTEND_URL` | `http://localhost:4200` | Frontend URL, used for CORS configuration and redirects after OIDC login |

---

## Database

| Variable        | Default  | Description                                       |
|-----------------|----------|---------------------------------------------------|
| `DB_CONNECTION` | `sqlite` | Database driver: `sqlite`, `mysql`, `pgsql`       |
| `DB_DATABASE`   | *(path)* | Absolute path to the SQLite file                  |

### SQLite (Development)

```ini
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/backend/database/database.sqlite
```

### MySQL (Production)

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hournest
DB_USERNAME=hournest_user
DB_PASSWORD=secret_password
```

### PostgreSQL (Production)

```ini
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=hournest
DB_USERNAME=hournest_user
DB_PASSWORD=secret_password
```

---

## OpenID Connect (Synology SSO Server)

The OIDC integration enables Single Sign-On via the Synology SSO Server. Configuration is done through the OIDC variables in the `.env` file.

| Variable            | Example                                                     | Description                               |
|---------------------|-------------------------------------------------------------|-------------------------------------------|
| `OIDC_CLIENT_ID`    | `your-client-id-from-synology`                              | Client ID from SSO Server app registration |
| `OIDC_CLIENT_SECRET`| `your-client-secret-from-synology`                          | Client secret from SSO Server app registration |
| `OIDC_WELLKNOWN_URL`| `https://nas:5001/webman/sso/.well-known/openid-configuration` | Well-Known URL of the SSO Server          |
| `OIDC_REDIRECT_URI` | `${APP_URL}/api/auth/callback`                              | Callback URL after successful authentication |

### Setting up OIDC on Synology SSO Server

1. Install and open the **SSO Server** from the Synology Package Center
2. Register a new application under "Applications"
3. Enter the **Redirect URI**: `https://your-domain.com/api/auth/callback`
4. Copy the **Client ID** and **Client Secret** and add them to `.env`
5. The **Well-Known URL** typically has the format: `https://<NAS-address>:5001/webman/sso/.well-known/openid-configuration`

!!! note "HTTPS Required"
    The Synology SSO Server requires HTTPS. For local development, a self-signed certificate or a tunnel service can be used.

---

## Superadmin (Emergency Access)

The superadmin access works without SSO and is authenticated directly via username and password. It serves as emergency access when the SSO server is unavailable.

| Variable              | Default       | Description                           |
|-----------------------|---------------|---------------------------------------|
| `SUPERADMIN_USERNAME` | `superadmin`  | Username for superadmin login         |
| `SUPERADMIN_PASSWORD` | `changeme`    | Password for superadmin login         |

!!! danger "Change Password"
    The default password `changeme` must be changed **before** going to production.

---

## Admin Emails

| Variable       | Example                | Description                                            |
|----------------|------------------------|--------------------------------------------------------|
| `ADMIN_EMAILS` | `admin@hournest.local` | Comma-separated list of email addresses that automatically receive the admin role on SSO login |

Example with multiple admins:

```ini
ADMIN_EMAILS=anna@company.com,peter@company.com,maria@company.com
```

On every SSO login, the system checks whether the user's email address is in this list. If so, the role is set to **Admin**, otherwise to **Employee**.

---

## Session and Sanctum

| Variable                    | Default         | Description                                       |
|-----------------------------|-----------------|---------------------------------------------------|
| `SESSION_DRIVER`            | `file`          | Session driver: `file`, `database`, `cookie`      |
| `SESSION_LIFETIME`          | `120`           | Session lifetime in minutes                       |
| `SANCTUM_STATEFUL_DOMAINS`  | `localhost:4200` | Domains that receive Sanctum cookies (for SPA auth) |

For production, `SANCTUM_STATEFUL_DOMAINS` must be set to the actual frontend domain:

```ini
SANCTUM_STATEFUL_DOMAINS=app.company.com
```

---

## Vacation Settings

| Variable                        | Default | Description                                     |
|---------------------------------|---------|-------------------------------------------------|
| `DEFAULT_VACATION_DAYS_PER_YEAR`| `30`    | Default vacation days per year for new users     |

This value is used as the default when creating new users. Admins can adjust the value individually per user afterwards.

---

## Logging

| Variable      | Default  | Description                               |
|---------------|----------|-------------------------------------------|
| `LOG_CHANNEL` | `stack`  | Logging channel: `stack`, `single`, `daily` |
| `LOG_LEVEL`   | `debug`  | Log level: `debug`, `info`, `warning`, `error` |

!!! tip "Production"
    In production, `LOG_LEVEL` should be set to `warning` or `error` to keep log files manageable.

---

## Complete .env Template

```ini
# --- App ---
APP_NAME=Hournest
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

# --- Frontend URL (for CORS & Redirects) ---
FRONTEND_URL=http://localhost:4200

# --- Database ---
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/backend/database/database.sqlite

# --- Synology SSO Server (OIDC) ---
OIDC_CLIENT_ID=your-client-id-from-synology
OIDC_CLIENT_SECRET=your-client-secret-from-synology
OIDC_WELLKNOWN_URL=https://your-nas-address:5001/webman/sso/.well-known/openid-configuration
OIDC_REDIRECT_URI=${APP_URL}/api/auth/callback

# --- Session / Sanctum ---
SESSION_DRIVER=file
SESSION_LIFETIME=120
SANCTUM_STATEFUL_DOMAINS=localhost:4200

# --- Vacation Settings ---
DEFAULT_VACATION_DAYS_PER_YEAR=30

# --- Superadmin (Emergency Access) ---
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=changeme

# --- Admin Emails (comma-separated) ---
ADMIN_EMAILS=admin@hournest.local

# --- Logging ---
LOG_CHANNEL=stack
LOG_LEVEL=debug
```
