# Konfiguration

Alle Einstellungen von Hournest werden ueber die `.env`-Datei im `backend/`-Verzeichnis gesteuert. Diese Seite dokumentiert jede Variable im Detail.

!!! warning "Sicherheit"
    Die `.env`-Datei enthaelt sensible Daten und darf **niemals** ins Git-Repository committed werden. Eine Vorlage mit Platzhaltern liegt als `.env.example` im Wurzelverzeichnis.

---

## App-Einstellungen

| Variable      | Standardwert           | Beschreibung                                   |
|---------------|------------------------|-------------------------------------------------|
| `APP_NAME`    | `Hournest`             | Name der Anwendung                              |
| `APP_ENV`     | `local`                | Umgebung: `local`, `staging`, `production`      |
| `APP_KEY`     | *(leer)*               | Verschluesselungskey, wird mit `php artisan key:generate` erzeugt |
| `APP_DEBUG`   | `true`                 | Debug-Modus: `true` fuer Entwicklung, `false` fuer Produktion |
| `APP_URL`     | `http://localhost:8000`| URL des Backends                                |

!!! danger "APP_DEBUG in Produktion"
    `APP_DEBUG` muss in Produktionsumgebungen **immer** auf `false` stehen. Andernfalls werden detaillierte Fehlermeldungen inklusive Stack-Traces an den Client gesendet.

---

## Frontend-URL

| Variable       | Standardwert            | Beschreibung                                   |
|----------------|-------------------------|-------------------------------------------------|
| `FRONTEND_URL` | `http://localhost:4200` | URL des Frontends, wird fuer CORS-Konfiguration und Redirects nach OIDC-Login verwendet |

---

## Datenbank

| Variable        | Standardwert | Beschreibung                                      |
|-----------------|--------------|---------------------------------------------------|
| `DB_CONNECTION` | `sqlite`     | Datenbanktreiber: `sqlite`, `mysql`, `pgsql`      |
| `DB_DATABASE`   | *(Pfad)*     | Absoluter Pfad zur SQLite-Datei                   |

### SQLite (Entwicklung)

```ini
DB_CONNECTION=sqlite
DB_DATABASE=/absoluter/pfad/zu/backend/database/database.sqlite
```

### MySQL (Produktion)

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hournest
DB_USERNAME=hournest_user
DB_PASSWORD=geheimes_passwort
```

### PostgreSQL (Produktion)

```ini
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=hournest
DB_USERNAME=hournest_user
DB_PASSWORD=geheimes_passwort
```

---

## OpenID Connect (Synology SSO Server)

Die OIDC-Integration ermoeglicht Single Sign-On ueber den Synology SSO Server. Die Konfiguration erfolgt ueber die OIDC-Variablen in der `.env`-Datei.

| Variable            | Beispiel                                                    | Beschreibung                              |
|---------------------|-------------------------------------------------------------|-------------------------------------------|
| `OIDC_CLIENT_ID`    | `your-client-id-from-synology`                              | Client-ID aus der SSO-Server-App-Registrierung |
| `OIDC_CLIENT_SECRET`| `your-client-secret-from-synology`                          | Client-Secret aus der SSO-Server-App-Registrierung |
| `OIDC_WELLKNOWN_URL`| `https://nas:5001/webman/sso/.well-known/openid-configuration` | Well-Known-URL des SSO Servers            |
| `OIDC_REDIRECT_URI` | `${APP_URL}/api/auth/callback`                              | Callback-URL nach erfolgreicher Anmeldung |

### OIDC auf dem Synology SSO Server einrichten

1. **SSO Server** im Synology Package Center installieren und oeffnen
2. Unter "Anwendungen" eine neue Anwendung registrieren
3. **Redirect URI** eintragen: `https://your-domain.com/api/auth/callback`
4. **Client-ID** und **Client-Secret** kopieren und in die `.env` eintragen
5. Die **Well-Known URL** hat typischerweise das Format: `https://<NAS-Adresse>:5001/webman/sso/.well-known/openid-configuration`

!!! note "HTTPS erforderlich"
    Der Synology SSO Server erfordert HTTPS. Fuer die lokale Entwicklung kann ein selbstsigniertes Zertifikat oder ein Tunnel-Dienst verwendet werden.

---

## Superadmin (Notfallzugang)

Der Superadmin-Zugang funktioniert ohne SSO und wird direkt ueber Benutzername und Passwort authentifiziert. Er dient als Notfallzugang, falls der SSO Server nicht verfuegbar ist.

| Variable              | Standardwert  | Beschreibung                          |
|-----------------------|---------------|---------------------------------------|
| `SUPERADMIN_USERNAME` | `superadmin`  | Benutzername fuer den Superadmin-Login |
| `SUPERADMIN_PASSWORD` | `changeme`    | Passwort fuer den Superadmin-Login    |

!!! danger "Passwort aendern"
    Das Standard-Passwort `changeme` muss vor dem Produktiveinsatz **unbedingt** geaendert werden.

---

## Admin-Emails

| Variable       | Beispiel               | Beschreibung                                           |
|----------------|------------------------|--------------------------------------------------------|
| `ADMIN_EMAILS` | `admin@hournest.local` | Komma-separierte Liste von Email-Adressen, die bei SSO-Login automatisch die Admin-Rolle erhalten |

Beispiel mit mehreren Admins:

```ini
ADMIN_EMAILS=anna@firma.de,peter@firma.de,maria@firma.de
```

Bei jedem SSO-Login wird geprueft, ob die Email-Adresse des Benutzers in dieser Liste enthalten ist. Falls ja, wird die Rolle auf **Admin** gesetzt, andernfalls auf **Employee**.

---

## Session und Sanctum

| Variable                    | Standardwert    | Beschreibung                                      |
|-----------------------------|-----------------|---------------------------------------------------|
| `SESSION_DRIVER`            | `file`          | Session-Treiber: `file`, `database`, `cookie`     |
| `SESSION_LIFETIME`          | `120`           | Session-Lebensdauer in Minuten                    |
| `SANCTUM_STATEFUL_DOMAINS`  | `localhost:4200` | Domains, die Sanctum-Cookies erhalten (fuer SPA-Auth) |

Fuer die Produktion muss `SANCTUM_STATEFUL_DOMAINS` auf die tatsaechliche Frontend-Domain gesetzt werden:

```ini
SANCTUM_STATEFUL_DOMAINS=app.firma.de
```

---

## Urlaubseinstellungen

| Variable                        | Standardwert | Beschreibung                                    |
|---------------------------------|--------------|-------------------------------------------------|
| `DEFAULT_VACATION_DAYS_PER_YEAR`| `30`         | Standard-Urlaubstage pro Jahr fuer neue Benutzer |

Dieser Wert wird beim Anlegen neuer Benutzer als Standardwert verwendet. Admins koennen den Wert anschliessend pro Benutzer individuell anpassen.

---

## Logging

| Variable      | Standardwert | Beschreibung                              |
|---------------|--------------|-------------------------------------------|
| `LOG_CHANNEL` | `stack`      | Logging-Kanal: `stack`, `single`, `daily` |
| `LOG_LEVEL`   | `debug`      | Log-Level: `debug`, `info`, `warning`, `error` |

!!! tip "Produktion"
    In der Produktion sollte `LOG_LEVEL` auf `warning` oder `error` gesetzt werden, um die Log-Dateien uebersichtlich zu halten.

---

## Vollstaendige .env-Vorlage

```ini
# --- App ---
APP_NAME=Hournest
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

# --- Frontend URL (fuer CORS & Redirects) ---
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

# --- Urlaubseinstellungen ---
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
