# Installation

Diese Anleitung beschreibt die Einrichtung von Hournest fuer die lokale Entwicklung.

---

## Repository klonen

```bash
git clone <repository-url> hournest
cd hournest
```

---

## Backend einrichten

### 1. Abhaengigkeiten installieren

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
    Die `.env`-Datei enthaelt sensible Daten (OIDC-Credentials, Superadmin-Passwort) und darf **niemals** ins Git-Repository committed werden.

Die wichtigsten Einstellungen fuer die lokale Entwicklung:

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

Fuer SQLite muss zuerst die Datenbankdatei erstellt werden:

```bash
touch database/database.sqlite
php artisan migrate
```

### 5. Optionaler Seeder

Falls Testdaten benoetigt werden:

```bash
php artisan db:seed
```

### 6. Backend starten

```bash
php artisan serve
```

Das Backend ist nun unter `http://localhost:8000` erreichbar.

!!! tip "API-Dokumentation"
    Nach dem Start ist die auto-generierte API-Dokumentation unter `http://localhost:8000/docs/api` verfuegbar.

---

## Frontend einrichten

### 1. Abhaengigkeiten installieren

```bash
cd frontend
npm install
```

### 2. Entwicklungsserver starten

```bash
ng serve
```

Das Frontend ist nun unter `http://localhost:4200` erreichbar.

---

## Mock-Modus (ohne Backend)

Der Mock-Modus ermoeglicht die Frontend-Entwicklung vollstaendig ohne laufendes Backend. Alle API-Aufrufe werden durch realistische Testdaten ersetzt.

### Starten ueber Build-Konfiguration

```bash
cd frontend
ng serve --configuration=mock
```

### Starten ueber URL-Parameter

Alternativ kann der Mock-Modus bei einem normalen `ng serve` per URL-Parameter aktiviert werden:

```
http://localhost:4200?mock=true
```

!!! info "Mock-Modus-Details"
    Im Mock-Modus erscheint eine Toolbar am unteren Bildschirmrand, mit der zwischen den Rollen Employee, Admin und Superadmin gewechselt werden kann. Weitere Details unter [Mock-Modus](../dev/mock-mode.md).

---

## Erster Start und Login

### Mit SSO (Synology)

1. OIDC muss korrekt in der `.env` konfiguriert sein (siehe [Konfiguration](configuration.md))
2. Im Browser `http://localhost:4200` oeffnen
3. Auf "Sign in with SSO" klicken
4. Nach erfolgreicher Anmeldung wird der Benutzer automatisch angelegt

### Mit Superadmin (ohne SSO)

1. Superadmin-Credentials in der `.env` setzen (`SUPERADMIN_USERNAME`, `SUPERADMIN_PASSWORD`)
2. Im Browser `http://localhost:4200` oeffnen
3. Unter dem SSO-Button auf "Admin Login" klicken
4. Benutzername und Passwort eingeben

!!! note "Rollenzuweisung"
    - Neue Benutzer erhalten automatisch die Rolle **Employee**
    - Benutzer, deren Email in `ADMIN_EMAILS` steht, erhalten automatisch die Rolle **Admin**
    - Der Superadmin-Account wird beim ersten Login automatisch erstellt

---

## Skripte verwenden

Im Ordner `scripts/` liegen vorgefertigte Skripte, die unter Windows (Git Bash) und Linux funktionieren.

### Entwicklung

| Skript | Beschreibung |
|--------|-------------|
| `./scripts/dev.sh` | Startet Backend + Frontend parallel |
| `./scripts/dev-mock.sh` | Startet Frontend im Mock-Modus (ohne Backend) |
| `./scripts/dev-docs.sh` | Startet MkDocs Dev-Server auf Port 8001 |

### Build

| Skript | Beschreibung |
|--------|-------------|
| `./scripts/build-all.sh` | Baut Frontend + Backend + Dokumentation |
| `./scripts/build-frontend.sh` | Baut nur Angular (Production) |
| `./scripts/build-backend.sh` | Baut nur Laravel (Production, cached) |
| `./scripts/build-docs.sh` | Baut nur MkDocs-Dokumentation |

### Test & CI

| Skript | Beschreibung |
|--------|-------------|
| `./scripts/test.sh` | Backend-Tests + Frontend-Build-Check |
| `./scripts/ci.sh` | Vollstaendige CI-Pipeline lokal (Tests + alle Builds + Artefakt-Check) |
| `./scripts/package.sh [version]` | Baut alles und erstellt ein Release-Archiv (ZIP/TAR) |

!!! tip "Schnellstart mit Skripten"
    Statt Backend und Frontend einzeln einzurichten, reicht:
    ```bash
    cd backend && cp ../.env.example .env && composer install && php artisan key:generate && touch database/database.sqlite && php artisan migrate --seed && cd ..
    cd frontend && npm install && cd ..
    ./scripts/dev.sh
    ```

---

## Tests ausfuehren

```bash
# Nur Backend-Tests
cd backend
php artisan test

# Backend-Tests + Frontend-Build-Check
./scripts/test.sh

# Vollstaendige CI-Pipeline (wie GitHub Actions)
./scripts/ci.sh
```

Die Tests verwenden eine SQLite `:memory:`-Datenbank und benoetigen keine separate Konfiguration.

---

## Dokumentation bauen

```bash
# Dokumentation bauen (Output in documentation/site/)
./scripts/build-docs.sh

# Dev-Server mit Live-Reload
./scripts/dev-docs.sh              # http://localhost:8001
```

!!! note "Voraussetzungen fuer die Dokumentation"
    Python 3 und pip muessen installiert sein. Die Abhaengigkeiten (`mkdocs-material`, `mkdocs-static-i18n`) werden automatisch installiert.
