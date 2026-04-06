# Deployment

Diese Seite beschreibt das Deployment des **Release-Pakets** auf einer Synology NAS oder auf klassischem PHP-Hosting.

Wichtig: Auf dem Zielsystem werden für das Release-Paket **kein** Node.js, **kein** Angular, **keine** Angular CLI und **kein** MkDocs benötigt. Das Frontend ist bereits in `public/` enthalten.

---

## Zielsystem: Was wirklich benötigt wird

Für den Standardfall reichen auf dem Zielsystem:

- PHP 8.5+
- Ein Webserver mit **Document Root** auf `public/`
- Die erforderlichen PHP-Extensions
- Eine Datenbank:
  - standardmäßig SQLite über `pdo_sqlite`
  - alternativ MySQL/MariaDB über `pdo_mysql`
  - alternativ PostgreSQL über `pdo_pgsql`

Für ein Release-Paket mit bereits enthaltenem `vendor/` ist **kein Composer** auf dem Zielsystem erforderlich.

---

## NAS Deployment (z.B. Synology)

### Voraussetzungen

- NAS mit Webserver-Unterstützung, z.B. Synology DSM 7.x
- **Web Station**
- **PHP 8.5**
- Optional ein OIDC-Provider, z.B. Synology SSO Server
- SSH-Zugang zur NAS ist hilfreich, aber nicht zwingend

---

### Schritt 1: PHP konfigurieren

1. Öffne **Web Station**
2. Gehe zu **Skriptsprache-Einstellungen** > **PHP**
3. Erstelle ein neues PHP-Profil oder bearbeite ein bestehendes
4. Aktiviere mindestens diese Extensions:
   - `mbstring`
   - `openssl`
   - `tokenizer`
   - `xml`
   - `curl`
   - `fileinfo`
   - plus den Datenbanktreiber deiner Wahl:
     - `pdo_sqlite` für SQLite
     - `pdo_mysql` für MySQL/MariaDB
     - `pdo_pgsql` für PostgreSQL
5. Speichere das Profil

---

### Schritt 2: Release-Paket hochladen

1. Entpacke das Release-Archiv lokal
2. Kopiere den gesamten entpackten Ordner auf die NAS, z.B. nach `/volume1/web/hournest/`
3. Setze in Web Station den **Document Root** auf `/volume1/web/hournest/public`

Das Release-Paket enthält bereits:

- das gebaute Frontend in `public/`
- die PHP-Abhängigkeiten in `vendor/`
- `install.php` für die Initialisierung

---

### Schritt 3: `.env` anlegen

```bash
cd /volume1/web/hournest
cp .env.example .env
```

Beispiel für ein SQLite-Setup:

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

ADMIN_EMAILS=admin1@firma.de,admin2@firma.de
```

!!! danger "Sicherheit"
    Setze `APP_DEBUG=false` und ändere das Superadmin-Passwort vor dem Produktiveinsatz.

---

### Schritt 4: Anwendung initialisieren

```bash
cd /volume1/web/hournest
php install.php
```

Optional mit Testdaten:

```bash
php install.php --seed
```

Falls du für `SUPERADMIN_PASSWORD` erst einen bcrypt-Hash erzeugen musst, kannst du temporär `public/superadmin-password-helper.php` im Browser öffnen und die Datei danach wieder löschen.

---

### Schritt 5: OIDC einrichten (optional)

Nur erforderlich, wenn du SSO verwenden möchtest:

1. OIDC-Dienst oder SSO Server konfigurieren
2. Neue Anwendung registrieren
3. Redirect URI setzen: `https://your-nas-domain.com/api/auth/callback`
4. Client-ID und Client-Secret in `.env` eintragen
5. Well-Known-URL des Providers übernehmen

!!! note "HTTPS"
    Für OIDC ist in der Praxis fast immer HTTPS erforderlich.

---

### Schritt 6: Updates einspielen

Nach einem Update des Release-Pakets:

```bash
cd /volume1/web/hournest
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Klassisches PHP-Hosting

Hournest kann auch auf Shared Hosting, VPS oder anderem klassischem PHP-Hosting betrieben werden.

### Voraussetzungen

- PHP 8.5+
- Webserver mit **Document Root** auf `public/`
- Erforderliche PHP-Extensions inklusive passendem Datenbanktreiber
- Optional SSH/SFTP-Zugang
- Optional OIDC-Provider für SSO

Für das Release-Paket auf dem Zielsystem gilt auch hier:

- kein Node.js
- kein Angular
- keine Angular CLI
- kein MkDocs
- kein Composer, solange `vendor/` bereits enthalten ist

### Standard-Deployment mit Release-Paket

1. Release-Archiv entpacken
2. Gesamten entpackten Ordner hochladen
3. **Document Root** auf `public/` setzen
4. `.env.example` nach `.env` kopieren und konfigurieren
5. `php install.php` ausführen
6. Falls verwendet, `public/superadmin-password-helper.php` wieder löschen

### Datenbankbeispiele

SQLite:

```ini
DB_CONNECTION=sqlite
DB_DATABASE=/absoluter/pfad/zur/database.sqlite
```

MySQL/MariaDB:

```ini
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=hournest
DB_USERNAME=hournest_user
DB_PASSWORD=sicheres_passwort
```

PostgreSQL:

```ini
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=hournest
DB_USERNAME=hournest_user
DB_PASSWORD=sicheres_passwort
```

---

## Eigenes Paket bauen oder Frontend getrennt deployen

Dieser Abschnitt ist **nur für Entwickler** relevant.

Wenn du nicht das fertige Release-Paket verwendest, sondern selbst paketierst oder Frontend und Backend getrennt auslieferst, brauchst du auf dem Build-Rechner zusätzlich Node.js, npm und die restlichen Entwicklungswerkzeuge.

Typischer Frontend-Build:

```bash
cd frontend
npm install
npx ng build --configuration=production
```

Der Build-Output liegt danach in `frontend/dist/frontend/browser/`.

---

## CI/CD & Releases

### Build-Skripte

Alle Skripte liegen in `scripts/`:

| Skript | Beschreibung |
|--------|--------------|
| `./scripts/build-all.sh` | Baut Frontend + Backend + Dokumentation |
| `./scripts/build-frontend.sh` | Baut nur das Angular-Frontend |
| `./scripts/build-backend.sh` | Baut nur das Laravel-Backend |
| `./scripts/build-docs.sh` | Baut nur die MkDocs-Dokumentation |
| `./scripts/test.sh` | Backend-Tests + Frontend-Unit-Tests + Frontend-Build-Check |
| `./scripts/ci.sh` | Vollständige CI-Pipeline lokal |
| `./scripts/package.sh [version]` | Baut alles und erstellt das Release-Archiv |

### GitHub Actions

Die GitHub Action `.github/workflows/release.yml` wird bei Tags ausgelöst und erstellt automatisch ein Release-Paket mit:

1. Backend-Tests
2. Frontend-Tests und Frontend-Build
3. MkDocs-Build
4. Release-Archiv mit gebündeltem Frontend in `public/`
5. GitHub-Release-Artefakten

Zusätzlich veröffentlicht `.github/workflows/docs.yml` die Dokumentation bei Pushes auf `main`.

---

## Checkliste für Produktion

- [ ] `APP_ENV=production` gesetzt
- [ ] `APP_DEBUG=false` gesetzt
- [ ] Superadmin-Passwort geändert
- [ ] Passender Datenbanktreiber als PHP-Extension aktiviert
- [ ] `SANCTUM_STATEFUL_DOMAINS` korrekt gesetzt
- [ ] OIDC korrekt konfiguriert, falls verwendet
- [ ] `public/` ist der echte Document Root
- [ ] Migrationen wurden ausgeführt
- [ ] `storage/` und `bootstrap/cache/` sind beschreibbar
