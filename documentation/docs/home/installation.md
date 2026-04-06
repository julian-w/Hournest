# Installation für die Entwicklung

Diese Seite beschreibt die Einrichtung von Hournest für die **lokale Entwicklung**.

!!! info "Nur deployen?"
    Wenn du Hournest nur auf einen Server oder eine NAS kopieren und dort betreiben willst, nutze stattdessen die Seite [Deployment](../dev/deployment.md). Das Release-Paket enthält bereits das Frontend in `public/` und die PHP-Abhängigkeiten in `vendor/`.

---

## Repository klonen

```bash
git clone <repository-url> hournest
cd hournest
```

---

## Backend einrichten

### 1. Abhängigkeiten installieren

```bash
cd backend
composer install
```

### 2. Umgebungsvariablen konfigurieren

Kopiere die Vorlage und passe die Werte an:

```bash
cp ../.env.example .env
```

!!! warning "Wichtig"
    Die `.env`-Datei enthält sensible Daten und darf **niemals** ins Git-Repository committed werden.

Die wichtigsten Einstellungen für die lokale Entwicklung:

```ini
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:4200
DB_CONNECTION=sqlite
DB_DATABASE=/absoluter/pfad/zu/backend/database/database.sqlite
```

Alle Variablen werden im Detail auf der Seite [Konfiguration](configuration.md) beschrieben.

### 3. Application Key generieren

```bash
php artisan key:generate
```

### 4. Datenbank erstellen und migrieren

Für SQLite muss zuerst die Datenbankdatei erstellt werden:

```bash
touch database/database.sqlite
php artisan migrate
```

### 5. Optionaler Seeder

Falls Testdaten benötigt werden:

```bash
php artisan db:seed
```

### 6. Backend starten

```bash
php artisan serve
```

Das Backend ist nun unter `http://localhost:8000` erreichbar.

!!! tip "API-Dokumentation"
    Nach dem Start ist die auto-generierte API-Dokumentation unter `http://localhost:8000/docs/api` verfügbar.

---

## Frontend einrichten

### 1. Abhängigkeiten installieren

```bash
cd frontend
npm install
```

### 2. Entwicklungsserver starten

Eine globale Angular CLI ist nicht nötig. Nutze die lokale Projekt-CLI:

```bash
npx ng serve --proxy-config proxy.conf.json
```

Das Frontend ist nun unter `http://localhost:4200` erreichbar.

---

## Mock-Modus (ohne Backend)

Der Mock-Modus ermöglicht Frontend-Entwicklung ohne laufendes Backend. Alle API-Aufrufe werden durch realistische Testdaten ersetzt.

### Starten über Build-Konfiguration

```bash
cd frontend
npx ng serve --configuration=mock
```

### Starten über URL-Parameter

Alternativ kann der Mock-Modus bei einem normalen Start per URL-Parameter aktiviert werden:

```
http://localhost:4200?mock=true
```

!!! info "Mock-Modus-Details"
    Im Mock-Modus erscheint eine Toolbar am unteren Bildschirmrand. Weitere Details unter [Mock-Modus](../dev/mock-mode.md).

---

## Erster Start und Login

### Mit SSO (OIDC)

1. OIDC muss korrekt in der `.env` konfiguriert sein
2. Im Browser `http://localhost:4200` öffnen
3. Auf "Sign in with SSO" klicken
4. Nach erfolgreicher Anmeldung wird der Benutzer automatisch angelegt

### Mit Superadmin (ohne SSO)

1. Superadmin-Credentials in der `.env` setzen (`SUPERADMIN_USERNAME`, `SUPERADMIN_PASSWORD`)
2. `SUPERADMIN_PASSWORD` muss ein bcrypt-Hash sein, nicht das Klartext-Passwort
3. Optional einmal `backend/public/superadmin-password-helper.php` im Browser öffnen, Hash erzeugen und danach die Datei wieder löschen
4. Im Browser `http://localhost:4200` öffnen
5. Unter dem SSO-Button auf "Admin Login" klicken
6. Benutzername und Klartext-Passwort eingeben

!!! note "Rollenzuweisung"
    - Neue Benutzer erhalten automatisch die Rolle **Employee**
    - Benutzer, deren Email in `ADMIN_EMAILS` steht, erhalten automatisch die Rolle **Admin**
    - Der Superadmin-Account wird beim ersten Login automatisch erstellt

---

## Skripte verwenden

Im Ordner `scripts/` liegen vorgefertigte Skripte für die lokale Entwicklung, Tests und Builds.

### Entwicklung

| Skript | Beschreibung |
|--------|--------------|
| `./scripts/dev.sh` | Startet Backend + Frontend parallel |
| `./scripts/dev-mock.sh` | Startet Frontend im Mock-Modus |
| `./scripts/dev-docs.sh` | Startet MkDocs Dev-Server auf Port 8001 |

### Build

| Skript | Beschreibung |
|--------|--------------|
| `./scripts/build-all.sh` | Baut Frontend + Backend + Dokumentation |
| `./scripts/build-frontend.sh` | Baut nur das Angular-Frontend |
| `./scripts/build-backend.sh` | Baut nur das Laravel-Backend |
| `./scripts/build-docs.sh` | Baut nur die MkDocs-Dokumentation |

### Test & CI

| Skript | Beschreibung |
|--------|--------------|
| `./scripts/test.sh` | Backend-Tests + Frontend-Unit-Tests + Frontend-Build-Check |
| `./scripts/ci.sh` | Vollständige CI-Pipeline lokal |
| `./scripts/package.sh [version]` | Baut alles und erstellt ein Release-Archiv |

!!! tip "Schnellstart mit Skripten"
    Für die lokale Entwicklung reicht in der Regel:
    ```bash
    cd backend && cp ../.env.example .env && composer install && php artisan key:generate && touch database/database.sqlite && php artisan migrate --seed && cd ..
    ./scripts/dev.sh
    ```

---

## Tests ausführen

```bash
# Nur Backend-Tests
cd backend
php artisan test

# Backend-Tests + Frontend-Unit-Tests + Frontend-Build-Check
./scripts/test.sh

# Vollständige CI-Pipeline (wie GitHub Actions)
./scripts/ci.sh

# Vollständige CI-Pipeline inkl. Playwright-Smoke-Test
RUN_E2E_SMOKE=true ./scripts/ci.sh
```

Die Tests verwenden eine SQLite-In-Memory-Datenbank und benötigen keine separate Datenbank-Installation.

---

## Dokumentation bauen

```bash
# Dokumentation bauen (Output in documentation/site/)
./scripts/build-docs.sh

# Dev-Server mit Live-Reload
./scripts/dev-docs.sh              # http://localhost:8001
```

!!! note "Voraussetzungen für die Dokumentation"
    Python 3 und pip müssen installiert sein. Die Abhängigkeiten werden über `documentation/requirements.txt` installiert.
