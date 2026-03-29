# Hournest

> Team-Urlaubsverwaltung, Zeittracking & Einsatzplanung -- einfach und übersichtlich.

## Features (Phase 1 -- Urlaubsverwaltung)

- **Dashboard:** Resturlaub, offene Anfragen, nächster Urlaub, Admin: Team-Status
- **Team-Kalender:** Monatsansicht mit Feiertagen, Urlaube farblich nach Status
- **Urlaubsanträge:** Mitarbeiter beantragen Urlaub (Von/Bis/Kommentar), Admins genehmigen oder lehnen ab
- **Urlaubskonto:** Jahreslog mit Anspruch, Übertrag, Sonderurlaub, genommenen Tagen; Admin kann Einträge hinzufügen und löschen
- **Feiertage:** Admin pflegt fixe und variable Feiertage mit Start-/Endjahr; fixe Feiertage werden jährlich automatisch übernommen, variable Feiertage müssen pro Jahr bestätigt werden; Urlaubsbuchung erst möglich wenn alle Feiertage eines Jahres bestätigt sind
- **Urlaubsplanung:** Zwei Modi -- Urlaubssperre (kein Urlaub erlaubt, keine Tage abgezogen) und Betriebsferien (Zwangsurlaub, Tage werden automatisch abgezogen); Einträge können erstellt, bearbeitet und gelöscht werden
- **Arbeitstage:** Individuelle Arbeitszeitmodelle pro Mitarbeiter (z.B. Brückenteilzeit)
- **Resturlaub:** Automatische Berechnung, automatischer Übertrag, konfigurierbarer Verfall
- **Einstellungen:** Konfigurierbarer Buchungsstart für Urlaub im neuen Jahr (DD.MM-Format), Übertrag-Verfall
- **SSO Login:** Authentifizierung über Synology SSO Server (OIDC)
- **Superadmin:** Notfall-Zugang ohne SSO (Credentials in `.env`)
- **Rollen:** Employee (Standard), Admin (per Email-Liste), Superadmin
- **i18n:** Deutsch + Englisch umschaltbar
- **API-Dokumentation:** Auto-generierte OpenAPI-Spec unter `/docs/api`

## Geplante Features (Phase 2)

- Gruppen-Sichtbarkeit im Kalender
- Weitere Benachrichtigungskanäle (WhatsApp etc.)
- Zeiterfassung / Stundenbuchung
- Einsatz- & Schichtplanung
- Auswertungen & Reports

## Tech Stack

| Bereich   | Technologie                          |
|-----------|--------------------------------------|
| Frontend  | Angular 18, Angular Material, SCSS   |
| Backend   | Laravel, PHP 8.2+                    |
| Datenbank | SQLite (Dev), MySQL/PostgreSQL (Prod)|
| Auth      | Synology SSO Server (OIDC), Sanctum  |
| Docs      | MkDocs Material (DE + EN)            |
| CI/CD     | GitHub Actions                       |

## Projektstruktur

```
hournest/
├── frontend/          # Angular 18 SPA
├── backend/           # Laravel API
├── documentation/     # MkDocs Material (DE + EN)
├── scripts/           # Build-, Dev- und CI-Skripte
├── .github/workflows/ # GitHub Actions (Release bei Tag)
├── CLAUDE.md          # Konventionen für Claude Code
├── CONCEPT.md         # Gesamtkonzept & Fachlichkeit
├── .env.example       # Umgebungsvariablen-Vorlage
└── README.md
```

## Schnellstart

### Voraussetzungen

- PHP 8.2+ mit Extensions: sqlite3, mbstring, openssl, tokenizer, xml, curl, fileinfo
- Composer
- Node.js 18+ & npm
- Python 3 + pip (für Dokumentation)

### Alles auf einmal starten (Backend + Frontend)

```bash
./scripts/dev.sh
```

Startet Backend auf http://localhost:8000 und Frontend auf http://localhost:4200 parallel. `Ctrl+C` stoppt beides.

### Oder einzeln

```bash
# Backend
cd backend
cp ../.env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve                # http://localhost:8000

# Frontend
cd frontend
npm install
ng serve                         # http://localhost:4200
```

## Skripte

Alle Skripte liegen in `scripts/` und funktionieren unter Windows (Git Bash) und Linux.

### Entwicklung

| Skript | Beschreibung |
|--------|-------------|
| `./scripts/dev.sh` | Startet Backend + Frontend parallel |
| `./scripts/dev-mock.sh` | Startet Frontend im Mock-Modus (ohne Backend) |
| `./scripts/dev-docs.sh` | Startet MkDocs Dev-Server auf http://localhost:8001 |

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
| `./scripts/test.sh` | Führt Backend-Tests + Frontend-Build-Check aus |
| `./scripts/ci.sh` | Vollständige CI-Pipeline lokal (Tests + alle Builds + Artefakt-Check) |
| `./scripts/package.sh [version]` | Baut alles und erstellt ein Release-Archiv (ZIP/TAR) |

### Installation & Deployment

| Skript | Beschreibung |
|--------|-------------|
| `./scripts/install.sh` | Erstinstallation auf dem Zielserver (interaktiv) |
| `./scripts/install.sh --seed` | Wie oben, aber mit Testdaten |

Das Installationsscript prüft PHP-Extensions, erstellt `.env`, führt Migrationen durch, setzt Caches und gibt Webserver-Konfiguration (Apache/Nginx) aus.

## Mock-Modus (Frontend ohne Backend)

Zum Testen des Frontends ohne laufendes Backend:

```bash
# Option 1: Über Script
./scripts/dev-mock.sh

# Option 2: Manuell
cd frontend && ng serve --configuration=mock

# Option 3: URL-Parameter bei normalem Start
ng serve    # dann http://localhost:4200?mock=true
```

Im Mock-Modus:
- Floating Toolbar unten rechts zum Umschalten zwischen **Employee**, **Admin** und **Superadmin**
- Realistische Testdaten: 6 Benutzer, 8 Urlaube, 9 Feiertage, Urlaubskonto-Einträge
- Alle API-Endpoints werden in-memory simuliert
- Änderungen gehen beim Neuladen verloren

## Dokumentation

Die Dokumentation ist zweisprachig (Deutsch + Englisch) mit MkDocs Material.

```bash
# Dokumentation bauen
./scripts/build-docs.sh

# Dev-Server starten (Live-Reload)
./scripts/dev-docs.sh              # http://localhost:8001
```

Die gebaute Dokumentation liegt in `documentation/site/` (von .gitignore erfasst).

## Tests

```bash
# Nur Backend-Tests
cd backend && php artisan test     # 28 Tests, SQLite :memory:

# Alles testen (Backend + Frontend-Build)
./scripts/test.sh

# Vollständige CI-Pipeline lokal
./scripts/ci.sh
```

## API-Dokumentation

Wenn das Backend läuft:
```
http://localhost:8000/docs/api       # Interaktive Swagger UI
http://localhost:8000/docs/api.json  # OpenAPI JSON-Spec
```

## CI/CD & Releases

### Lokal testen vor dem Release

```bash
# Vollständige Pipeline lokal ausführen
./scripts/ci.sh

# Release-Archiv lokal bauen
./scripts/package.sh v0.1.0
```

### GitHub Release erstellen

Die GitHub Action (`.github/workflows/release.yml`) wird nur bei Tags ausgelöst:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Das erstellt automatisch:
- Backend-Tests + Production Build
- Frontend Production Build
- MkDocs Build
- Release-Archiv (ZIP + TAR.GZ) als GitHub Release

Tags mit `-rc`, `-beta` oder `-alpha` werden als Pre-Release markiert.

### GitHub Action lokal testen (optional)

Mit [act](https://github.com/nektos/act) kann man die GitHub Action lokal ausführen:

```bash
# act installieren
winget install nektos.act         # Windows
brew install act                  # macOS/Linux

# Release-Workflow lokal simulieren
act push --tag v0.1.0
```

## Deployment

### Mit Installationsscript (empfohlen)

```bash
# Release-Archiv auf Server entpacken, dann:
./scripts/install.sh

# Oder mit Testdaten:
./scripts/install.sh --seed
```

Das Script prüft automatisch:
- PHP-Version und Extensions
- Erstellt `.env` (interaktiv)
- Führt Migrationen durch
- Baut Caches
- Gibt Webserver-Konfiguration für **Apache** und **Nginx** aus

### Manuell

1. Release-Archiv entpacken oder `./scripts/package.sh` lokal bauen
2. `backend/` auf den Server, `backend/public/` als Document Root
3. `frontend/` als statische Dateien bereitstellen
4. `.env` konfigurieren, `php artisan migrate --force`
5. SSO Server: OIDC aktivieren, App registrieren, Redirect-URL eintragen

### Webserver

**Apache:** `.htaccess` ist in `backend/public/` enthalten -- `mod_rewrite` muss aktiviert sein.

**Nginx:** SPA-Routing für Frontend + PHP-FPM für Backend konfigurieren. Details gibt `./scripts/install.sh` aus.

Detaillierte Anleitung in der Dokumentation unter "Deployment".

## Lizenz

MIT License -- siehe [LICENSE](LICENSE)
