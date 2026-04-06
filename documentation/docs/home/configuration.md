# Konfiguration

Alle Einstellungen von Hournest werden über die `.env`-Datei gesteuert. Im Repository liegt sie bei lokaler Entwicklung in `backend/.env`, im Release-Paket direkt als `.env` im Paket-Root. Diese Seite dokumentiert jede Variable im Detail.

!!! warning "Sicherheit"
    Die `.env`-Datei enthält sensible Daten und darf **niemals** ins Git-Repository committed werden. Eine Vorlage mit Platzhaltern liegt als `.env.example` im Wurzelverzeichnis.

---

## App-Einstellungen

| Variable      | Standardwert           | Beschreibung                                   |
|---------------|------------------------|-------------------------------------------------|
| `APP_NAME`    | `Hournest`             | Name der Anwendung                              |
| `APP_ENV`     | `local`                | Umgebung: `local`, `staging`, `production`      |
| `APP_KEY`     | *(leer)*               | Verschlüsselungskey. Wird bei klassischen Installationen von `php install.php` per `php artisan key:generate` in `.env` geschrieben; im Docker-Betrieb bei erstem Start in die persistente Runtime-`.env` erzeugt, falls er fehlt |
| `APP_DEBUG`   | `true`                 | Debug-Modus: `true` für Entwicklung, `false` für Produktion |
| `APP_ALLOW_SCHEMA_DOWNGRADE` | `false` | Notfall-Override für den Downgrade-Schutz. Sollte praktisch immer `false` bleiben |
| `APP_URL`     | `http://localhost:8000`| URL des Backends                                |

!!! danger "APP_DEBUG in Produktion"
    `APP_DEBUG` muss in Produktionsumgebungen **immer** auf `false` stehen. Andernfalls werden detaillierte Fehlermeldungen inklusive Stack-Traces an den Client gesendet.

!!! note "Schreibzugriff auf .env"
    Während der ersten Installation darf Hournest die `.env` gezielt ergänzen, um generierte Geheimnisse wie `APP_KEY` zu schreiben. Danach kann die Datei administrativ verwaltet und bei Bedarf schreibgeschützt betrieben werden.

---

## Frontend-URL

| Variable       | Standardwert            | Beschreibung                                   |
|----------------|-------------------------|-------------------------------------------------|
| `FRONTEND_URL` | `http://localhost:4200` | URL des Frontends, wird für CORS-Konfiguration und Redirects nach OIDC-Login verwendet |

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

## Authentifizierungsmodus

Über `AUTH_OAUTH_ENABLED` wird gesteuert, ob die Anmeldung über einen externen OIDC-Provider oder lokal per Email+Passwort erfolgt.

| Variable | Standard | Beschreibung |
|----------|----------|-------------|
| `AUTH_OAUTH_ENABLED` | `true` | `true` = OIDC-Login, `false` = lokales Email+Passwort-Login |

Im lokalen Modus erstellen Admins Nutzer manuell im Admin-Bereich. Neue Nutzer müssen ihr Passwort beim ersten Login ändern.

---

## OpenID Connect (OIDC)

Die OIDC-Integration ermöglicht Single Sign-On über einen beliebigen OpenID-Connect-Provider (z.B. Keycloak, Azure AD, Synology SSO Server). Die Konfiguration erfolgt über die OIDC-Variablen in der `.env`-Datei. Voraussetzung: `AUTH_OAUTH_ENABLED=true`.

| Variable            | Beispiel                                                    | Beschreibung                              |
|---------------------|-------------------------------------------------------------|-------------------------------------------|
| `OIDC_CLIENT_ID`    | `your-client-id`                                            | Client-ID aus der OIDC-Provider-Registrierung |
| `OIDC_CLIENT_SECRET`| `your-client-secret`                                        | Client-Secret aus der OIDC-Provider-Registrierung |
| `OIDC_WELLKNOWN_URL`| `https://provider/.well-known/openid-configuration`         | Well-Known-URL des OIDC-Providers         |
| `OIDC_REDIRECT_URI` | `${APP_URL}/api/auth/callback`                              | Callback-URL nach erfolgreicher Anmeldung |

### OIDC-Provider einrichten (Beispiel: Synology SSO Server)

1. OIDC-Provider konfigurieren (z.B. **SSO Server** im Synology Package Center)
2. Eine neue Anwendung/Client registrieren
3. **Redirect URI** eintragen: `https://your-domain.com/api/auth/callback`
4. **Client-ID** und **Client-Secret** kopieren und in die `.env` eintragen
5. Die **Well-Known URL** vom Provider übernehmen (z.B. Synology: `https://<NAS>:5001/webman/sso/.well-known/openid-configuration`)

!!! note "HTTPS erforderlich"
    Die meisten OIDC-Provider erfordern HTTPS. Für die lokale Entwicklung kann ein selbstsigniertes Zertifikat oder ein Tunnel-Dienst verwendet werden.

---

## Superadmin (Notfallzugang)

Der Superadmin-Zugang funktioniert ohne SSO und wird direkt über Benutzername und Passwort authentifiziert. Er dient als Notfallzugang, immer verfügbar unabhängig vom Authentifizierungsmodus.

| Variable              | Standardwert  | Beschreibung                          |
|-----------------------|---------------|---------------------------------------|
| `SUPERADMIN_USERNAME` | `superadmin`  | Benutzername für den Superadmin-Login |
| `SUPERADMIN_PASSWORD` | bcrypt-Hash   | bcrypt-Hash für den Superadmin-Login, nicht das Klartext-Passwort |

!!! danger "Passwort ändern"
    Für `SUPERADMIN_PASSWORD` muss vor dem Produktiveinsatz ein eigener bcrypt-Hash gesetzt werden. Ein Klartext-Passwort oder Platzhalterwert ist nicht ausreichend.

!!! note "Installer-Verhalten"
    Wenn `SUPERADMIN_PASSWORD` leer ist oder kein gültiger bcrypt-Hash gesetzt wurde, bricht `php install.php` absichtlich ab und gibt ein temporäres Passwort sowie einen kopierbaren Hash für die `.env` aus.

---

## Admin-Emails

| Variable       | Beispiel               | Beschreibung                                           |
|----------------|------------------------|--------------------------------------------------------|
| `ADMIN_EMAILS` | `admin@hournest.local` | Komma-separierte Liste von Email-Adressen, die bei SSO-Login automatisch die Admin-Rolle erhalten |

Beispiel mit mehreren Admins:

```ini
ADMIN_EMAILS=anna@firma.de,peter@firma.de,maria@firma.de
```

Bei jedem SSO-Login wird geprüft, ob die Email-Adresse des Benutzers in dieser Liste enthalten ist. Falls ja, wird die Rolle auf **Admin** gesetzt, andernfalls auf **Employee**.

---

## Session und Sanctum

| Variable                    | Standardwert    | Beschreibung                                      |
|-----------------------------|-----------------|---------------------------------------------------|
| `SESSION_DRIVER`            | `file`          | Session-Treiber: `file`, `database`, `cookie`     |
| `SESSION_LIFETIME`          | `120`           | Session-Lebensdauer in Minuten                    |
| `SANCTUM_STATEFUL_DOMAINS`  | `localhost:4200` | Domains, die Sanctum-Cookies erhalten (für SPA-Auth) |

Für die Produktion muss `SANCTUM_STATEFUL_DOMAINS` auf die tatsächliche Frontend-Domain gesetzt werden:

```ini
SANCTUM_STATEFUL_DOMAINS=app.firma.de
```

---

## Urlaubseinstellungen

| Variable                        | Standardwert | Beschreibung                                    |
|---------------------------------|--------------|-------------------------------------------------|
| `DEFAULT_VACATION_DAYS_PER_YEAR`| `30`         | Standard-Urlaubstage pro Jahr für neue Benutzer |

Dieser Wert wird beim Anlegen neuer Benutzer als Standardwert verwendet. Admins können den Wert anschließend pro Benutzer individuell anpassen.

---

## Logging

| Variable      | Standardwert | Beschreibung                              |
|---------------|--------------|-------------------------------------------|
| `LOG_CHANNEL` | `stack`      | Logging-Kanal: `stack`, `single`, `daily` |
| `LOG_LEVEL`   | `debug`      | Log-Level: `debug`, `info`, `warning`, `error` |

!!! tip "Produktion"
    In der Produktion sollte `LOG_LEVEL` auf `warning` oder `error` gesetzt werden, um die Log-Dateien übersichtlich zu halten.

---

## Vollständige .env-Vorlage

```ini
# --- App ---
APP_NAME=Hournest
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

# --- Frontend URL (für CORS & Redirects) ---
FRONTEND_URL=http://localhost:4200

# --- Database ---
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/backend/database/database.sqlite

# --- Authentifizierungsmodus ---
AUTH_OAUTH_ENABLED=true

# --- OpenID Connect (OIDC) ---
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
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
SUPERADMIN_PASSWORD=

# --- Admin Emails (comma-separated) ---
ADMIN_EMAILS=admin@hournest.local

# --- Logging ---
LOG_CHANNEL=stack
LOG_LEVEL=debug
```
