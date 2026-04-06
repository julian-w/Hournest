# Lokale Entwicklung

Diese Seite beschreibt die Einrichtung von Hournest für die **lokale Entwicklung**.

Wenn du Hournest nur auf einen Server oder eine NAS kopieren und dort betreiben willst, nutze stattdessen die Seite [Installation](../home/installation.md) oder die ausführlichere Seite [Deployment](deployment.md).

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

```bash
cp ../.env.example .env
```

!!! warning "Wichtig"
    Die `.env`-Datei enthält sensible Daten und darf **niemals** ins Git-Repository committed werden.

Wichtige Einstellungen für die lokale Entwicklung:

```ini
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:4200
DB_CONNECTION=sqlite
DB_DATABASE=/absoluter/pfad/zu/backend/database/database.sqlite
```

Alle Variablen werden im Detail auf der Seite [Konfiguration](../home/configuration.md) beschrieben.

### 3. Application Key generieren

```bash
php artisan key:generate
```

### 4. Datenbank erstellen und migrieren

```bash
touch database/database.sqlite
php artisan migrate
```

### 5. Optionaler Seeder

```bash
php artisan db:seed
```

### 6. Backend starten

```bash
php artisan serve
```

Das Backend ist nun unter `http://localhost:8000` erreichbar.

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

## Mock-Modus

```bash
cd frontend
npx ng serve --configuration=mock
```

Alternativ:

```text
http://localhost:4200?mock=true
```

Weitere Details unter [Mock-Modus](mock-mode.md).

---

## Login in der lokalen Entwicklung

### Mit SSO (OIDC)

1. OIDC in `.env` konfigurieren
2. `http://localhost:4200` öffnen
3. "Sign in with SSO" verwenden

### Mit Superadmin

1. `SUPERADMIN_USERNAME` und `SUPERADMIN_PASSWORD` in `.env` setzen
2. `SUPERADMIN_PASSWORD` als bcrypt-Hash hinterlegen
3. Optional `backend/public/superadmin-password-helper.php` kurz im Browser öffnen, Hash erzeugen und Datei danach wieder löschen

---

## Skripte

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

---

## Tests

```bash
cd backend
php artisan test

./scripts/test.sh
./scripts/ci.sh
RUN_E2E_SMOKE=true ./scripts/ci.sh
```

---

## Dokumentation bauen

```bash
./scripts/build-docs.sh
./scripts/dev-docs.sh
```

Python 3 und pip müssen dafür installiert sein.
