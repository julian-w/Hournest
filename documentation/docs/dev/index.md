# Architektur

Diese Seite beschreibt die technische Architektur von Hournest für Entwickler, die am Projekt mitarbeiten.

---

## Übersicht

Hournest ist als **Monorepo** mit zwei Hauptkomponenten aufgebaut:

- **Backend** (`/backend`) -- Laravel 11 REST-API
- **Frontend** (`/frontend`) -- Angular 18 Single Page Application (SPA)

Das Frontend kommuniziert ausschließlich über HTTP-API-Aufrufe mit dem Backend. Es gibt keine serverseitige View-Generierung.

---

## Kommunikation Frontend-Backend

```
Browser (Angular SPA)
    |
    | HTTP (JSON)
    |
Laravel API (/api/*)
    |
    | Eloquent ORM
    |
SQLite / MySQL / PostgreSQL
```

- Alle API-Endpoints liegen unter `/api/*`
- JSON ist das einzige Austauschformat
- Authentifizierung erfolgt über Session-Cookies (Laravel Sanctum im SPA-Modus)
- CORS ist so konfiguriert, dass das Frontend (z.B. `localhost:4200`) auf die API zugreifen kann

---

## Authentifizierungsfluss

Der Standard-Login läuft über OpenID Connect (OIDC) mit einem externen OIDC-Provider:

```
1. Angular leitet weiter zu:     GET /api/auth/redirect
2. Laravel leitet weiter zu:     OIDC-Provider
3. Benutzer meldet sich an auf:  OIDC-Provider
4. OIDC-Provider leitet zurück: GET /api/auth/callback
5. Laravel erstellt/aktualisiert Benutzer und Session
6. Laravel leitet weiter zu:     FRONTEND_URL (z.B. http://localhost:4200)
7. Angular prüft Authentifizierung: GET /api/user
```

Der **Superadmin-Login** umgeht den OIDC-Fluss:

```
1. Angular sendet:               POST /api/auth/login (username + password)
2. Laravel prüft Credentials gegen .env-Werte
3. Laravel erstellt Session und gibt Benutzer zurück
```

---

## Rollensystem

| Rolle        | Wert         | Zuweisung                                  | Berechtigungen |
|--------------|--------------|---------------------------------------------|----------------|
| Employee     | `employee`   | Automatisch bei SSO-Login                   | Eigene Urlaube, Kalender über eigene und gemeinsame Gruppen, Dashboard |
| Admin        | `admin`      | SSO-Login mit Email in `ADMIN_EMAILS`       | Alles von Employee + alle Urlaube, Benutzerverwaltung, Feiertage, Einstellungen |
| Superadmin   | `superadmin` | Login mit lokalen Credentials               | Gleiche Berechtigungen wie Admin             |

Die Admin-Prüfung erfolgt im Backend über die Middleware `EnsureAdmin`, die sowohl `admin` als auch `superadmin` akzeptiert.

---

## Datenbankschema

### users

| Spalte               | Typ        | Beschreibung                          |
|----------------------|------------|---------------------------------------|
| id                   | bigint (PK)| Auto-Increment                        |
| email                | string     | Eindeutige Email-Adresse              |
| display_name         | string     | Anzeigename                           |
| role                 | string     | employee / admin / superadmin         |
| vacation_days_per_year| integer   | Jährlicher Urlaubsanspruch           |
| oidc_id              | string     | Eindeutige ID vom OIDC-Provider (null bei lokalen Nutzern) |
| holidays_exempt      | boolean    | Feiertage zählen als Arbeitstage     |
| weekend_worker       | boolean    | Wochenenden zählen als Arbeitstage   |
| remember_token       | string     | Laravel Remember-Token                |
| created_at           | timestamp  |                                       |
| updated_at           | timestamp  |                                       |
| deleted_at           | timestamp  | Soft Delete                           |

### vacations

| Spalte      | Typ        | Beschreibung                          |
|-------------|------------|---------------------------------------|
| id          | bigint (PK)| Auto-Increment                        |
| user_id     | bigint (FK)| Verweis auf users.id                  |
| start_date  | date       | Erster Urlaubstag                     |
| end_date    | date       | Letzter Urlaubstag                    |
| status      | string     | pending / approved / rejected         |
| comment     | text       | Kommentar (optional)                  |
| reviewed_by | bigint (FK)| Verweis auf users.id (Genehmiger)     |
| reviewed_at | timestamp  | Zeitpunkt der Genehmigung/Ablehnung  |
| created_at  | timestamp  |                                       |
| updated_at  | timestamp  |                                       |
| deleted_at  | timestamp  | Soft Delete                           |

### holidays

| Spalte      | Typ        | Beschreibung                          |
|-------------|------------|---------------------------------------|
| id          | bigint (PK)| Auto-Increment                        |
| name        | string     | Name des Feiertags                    |
| date        | date       | Datum des Feiertags                   |
| type        | string     | fixed / variable                      |
| created_at  | timestamp  |                                       |
| updated_at  | timestamp  |                                       |

### work_schedules

| Spalte      | Typ        | Beschreibung                          |
|-------------|------------|---------------------------------------|
| id          | bigint (PK)| Auto-Increment                        |
| user_id     | bigint (FK)| Verweis auf users.id                  |
| start_date  | date       | Beginn der Periode                    |
| end_date    | date       | Ende der Periode (nullable)           |
| work_days   | json       | Array der Arbeitstage [1,2,3,4,5]    |
| created_at  | timestamp  |                                       |
| updated_at  | timestamp  |                                       |

### vacation_ledger_entries

| Spalte      | Typ         | Beschreibung                          |
|-------------|-------------|---------------------------------------|
| id          | bigint (PK) | Auto-Increment                        |
| user_id     | bigint (FK) | Verweis auf users.id                  |
| year        | integer     | Buchungsjahr                          |
| type        | string      | entitlement / carryover / bonus / taken / expired / adjustment |
| days        | decimal(5,1)| Tage (positiv oder negativ)           |
| comment     | text        | Buchungskommentar (optional)          |
| vacation_id | bigint (FK) | Verweis auf vacations.id (optional)   |
| created_at  | timestamp   |                                       |
| updated_at  | timestamp   |                                       |

### settings

| Spalte      | Typ        | Beschreibung                          |
|-------------|------------|---------------------------------------|
| id          | bigint (PK)| Auto-Increment                        |
| key         | string     | Eindeutiger Schlüssel                |
| value       | text       | Wert (als String gespeichert)         |
| created_at  | timestamp  |                                       |
| updated_at  | timestamp  |                                       |

### sessions

| Spalte         | Typ        | Beschreibung                       |
|----------------|------------|------------------------------------|
| id             | string (PK)| Session-ID                         |
| user_id        | bigint (FK)| Verweis auf users.id (nullable)    |
| ip_address     | string(45) | IP-Adresse des Clients             |
| user_agent     | text       | Browser User-Agent                 |
| payload        | longtext   | Session-Daten                      |
| last_activity  | integer    | Zeitstempel der letzten Aktivität |

---

## Tech Stack im Detail

| Komponente        | Technologie            | Version  |
|-------------------|------------------------|----------|
| Backend-Framework | Laravel                | 11+      |
| PHP               | PHP                    | 8.2+     |
| Frontend-Framework| Angular                | 18+      |
| UI-Bibliothek     | Angular Material       | 18+      |
| CSS-Präprozessor | SCSS                   |          |
| i18n (Frontend)   | ngx-translate          |          |
| Auth (Backend)    | Laravel Sanctum        |          |
| Auth (OIDC)       | Laravel Socialite      |          |
| API-Doku          | Scramble               |          |
| Tests             | PHPUnit                |          |
| Datenbank         | SQLite / MySQL / PostgreSQL |     |
