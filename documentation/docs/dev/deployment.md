# Deployment

Diese Seite beschreibt das Deployment von Hournest auf einer Synology NAS (primaerer Anwendungsfall) sowie auf klassischem PHP-Hosting.

---

## Synology NAS Deployment

### Voraussetzungen

- Synology NAS mit DSM 7.x
- **Web Station** (aus dem Package Center installieren)
- **PHP 8.2** (ueber Web Station installierbar)
- **SSO Server** (aus dem Package Center, fuer OIDC)
- SSH-Zugang zur NAS (empfohlen)

---

### Schritt 1: PHP konfigurieren

1. Oeffne **Web Station** im DSM
2. Gehe zu **Skriptsprache-Einstellungen** > **PHP**
3. Erstelle ein neues PHP-Profil oder bearbeite das bestehende:
    - PHP-Version: **8.2**
    - Extensions aktivieren: `sqlite3`, `mbstring`, `openssl`, `tokenizer`, `xml`, `curl`, `fileinfo`, `zip`, `pdo_sqlite`
4. Speichere das Profil

---

### Schritt 2: Backend deployen

1. Kopiere den gesamten `backend/`-Ordner auf die NAS (z.B. nach `/volume1/web/hournest/backend/`)
2. Erstelle die `.env`-Datei:

```bash
cd /volume1/web/hournest/backend
cp /pfad/zu/.env.example .env
```

3. Konfiguriere die `.env` fuer Produktion:

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-nas-domain.com
FRONTEND_URL=https://your-nas-domain.com

DB_CONNECTION=sqlite
DB_DATABASE=/volume1/web/hournest/backend/database/database.sqlite

OIDC_CLIENT_ID=your-actual-client-id
OIDC_CLIENT_SECRET=your-actual-client-secret
OIDC_WELLKNOWN_URL=https://your-nas-address:5001/webman/sso/.well-known/openid-configuration
OIDC_REDIRECT_URI=${APP_URL}/api/auth/callback

SANCTUM_STATEFUL_DOMAINS=your-nas-domain.com

SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=ein-sicheres-passwort

ADMIN_EMAILS=admin1@firma.de,admin2@firma.de
```

!!! danger "Sicherheit"
    Setze `APP_DEBUG=false` und aendere das Superadmin-Passwort!

4. Installiere Abhaengigkeiten und initialisiere:

```bash
cd /volume1/web/hournest/backend
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

5. Konfiguriere Web Station:
    - Erstelle einen neuen virtuellen Host oder Dienst
    - **Document Root:** `/volume1/web/hournest/backend/public`
    - **PHP-Profil:** Das in Schritt 1 erstellte Profil
    - Stelle sicher, dass URL-Rewriting funktioniert (`.htaccess` oder nginx-Konfiguration)

---

### Schritt 3: SSO Server / OIDC einrichten

1. Oeffne den **SSO Server** im DSM
2. Aktiviere den OIDC-Dienst falls noch nicht geschehen
3. Registriere eine neue Anwendung:
    - **Name:** Hournest
    - **Redirect URI:** `https://your-nas-domain.com/api/auth/callback`
4. Kopiere **Client-ID** und **Client-Secret** in die `.env`-Datei
5. Pruefe die **Well-Known URL**: `https://your-nas-address:5001/webman/sso/.well-known/openid-configuration`

!!! note "HTTPS"
    Der SSO Server erfordert HTTPS. Stelle sicher, dass deine NAS ein gueltiges SSL-Zertifikat hat (z.B. ueber Let's Encrypt in der DSM-Systemsteuerung).

---

### Schritt 4: Frontend bauen und deployen

1. Baue das Frontend auf deinem Entwicklungsrechner:

```bash
cd frontend
npm install
ng build --configuration production
```

2. Der Build-Output liegt in `frontend/dist/frontend/browser/` (oder aehnlich)
3. Kopiere den Inhalt des Build-Output-Ordners auf die NAS

**Option A: Gleicher Host wie das Backend**

Kopiere die Frontend-Dateien in den `public/`-Ordner des Backends oder richte einen separaten Document Root ein.

**Option B: Separater virtueller Host**

Erstelle in Web Station einen separaten virtuellen Host fuer das Frontend mit dem Build-Output als Document Root. Stelle sicher, dass alle Routen auf `index.html` umgeleitet werden (SPA-Routing).

---

### Schritt 5: Datenbank-Migration

Nach jedem Update:

```bash
cd /volume1/web/hournest/backend
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

---

## Klassisches PHP-Hosting

Hournest kann auch auf klassischem PHP-Hosting (Shared Hosting, VPS, etc.) betrieben werden.

### Voraussetzungen

- PHP 8.2+ mit den erforderlichen Extensions
- Composer
- SSH-Zugang (empfohlen)
- MySQL oder PostgreSQL (alternativ SQLite)
- Subdomain oder separater Pfad fuer das Frontend

### Backend-Deployment

1. Lade den `backend/`-Ordner per SSH/SFTP hoch
2. Setze den **Document Root** auf `backend/public/`
3. Erstelle und konfiguriere die `.env`-Datei
4. Fuehre `composer install --no-dev --optimize-autoloader` aus
5. Fuehre `php artisan key:generate`, `php artisan migrate --force` aus
6. Cache erstellen: `php artisan config:cache && php artisan route:cache`

### Frontend-Deployment

1. Baue das Frontend lokal: `ng build --configuration production`
2. Lade den Build-Output auf den Server
3. Konfiguriere URL-Rewriting fuer SPA-Routing (alle Routen -> `index.html`)

### Datenbank

Fuer Produktions-Hosting wird MySQL oder PostgreSQL empfohlen:

```ini
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=hournest
DB_USERNAME=hournest_user
DB_PASSWORD=sicheres_passwort
```

---

## CI/CD & Releases

### Build-Skripte

Alle Skripte liegen in `scripts/` und funktionieren unter Windows (Git Bash) und Linux:

| Skript | Beschreibung |
|--------|-------------|
| `./scripts/build-all.sh` | Baut Frontend + Backend + Dokumentation |
| `./scripts/build-frontend.sh` | Baut nur Angular (Production) |
| `./scripts/build-backend.sh` | Baut nur Laravel (Production, cached) |
| `./scripts/build-docs.sh` | Baut nur MkDocs-Dokumentation |
| `./scripts/test.sh` | Backend-Tests + Frontend-Build-Check |
| `./scripts/ci.sh` | Vollstaendige CI-Pipeline lokal |
| `./scripts/package.sh [version]` | Baut alles und erstellt Release-Archiv |

### CI lokal ausfuehren

Vor dem Taggen eines Releases sollte die Pipeline lokal geprueft werden:

```bash
# Vollstaendige Pipeline (Tests + alle Builds + Artefakt-Check)
./scripts/ci.sh

# Release-Archiv erstellen
./scripts/package.sh v0.1.0
# -> Erstellt dist/hournest-v0.1.0.zip und .tar.gz
```

### GitHub Actions

Die GitHub Action `.github/workflows/release.yml` wird **nur bei Tags** ausgeloest:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Die Action fuehrt automatisch aus:

1. Backend-Tests (PHPUnit)
2. Frontend Production Build (Angular)
3. Dokumentation Build (MkDocs)
4. Release-Archiv erstellen (ZIP + TAR.GZ)
5. GitHub Release erstellen

Tags mit `-rc`, `-beta` oder `-alpha` werden als Pre-Release markiert.

### GitHub Action lokal testen

Mit [act](https://github.com/nektos/act) kann die Action lokal ausgefuehrt werden (benoetigt Docker):

```bash
# act installieren
winget install nektos.act         # Windows
brew install act                  # macOS/Linux

# Release-Workflow simulieren
act push --tag v0.1.0
```

!!! tip "Empfehlung"
    Fuer den Alltag reicht `./scripts/ci.sh`. `act` ist nur noetig, wenn man die GitHub Action selbst debuggen will.

---

## Checkliste fuer Produktion

!!! warning "Vor dem Go-Live"
    Pruefe folgende Punkte vor dem Produktiveinsatz:

- [ ] `APP_DEBUG=false` gesetzt
- [ ] `APP_ENV=production` gesetzt
- [ ] Superadmin-Passwort geaendert (nicht `changeme`)
- [ ] OIDC-Credentials konfiguriert
- [ ] `SANCTUM_STATEFUL_DOMAINS` auf die korrekte Frontend-Domain gesetzt
- [ ] `ADMIN_EMAILS` mit den richtigen Admin-Email-Adressen befuellt
- [ ] SSL/HTTPS aktiviert
- [ ] Datenbank-Migrationen ausgefuehrt
- [ ] `config:cache` und `route:cache` ausgefuehrt
- [ ] Feiertage fuer das aktuelle Jahr eingetragen
- [ ] Datenbankdatei-Berechtigungen (bei SQLite) korrekt gesetzt
- [ ] Log-Verzeichnis (`storage/logs/`) beschreibbar
