# Hournest -- Team-Urlaubsverwaltung

Hournest ist eine interne Webanwendung zur **Team-Urlaubsverwaltung** fuer kleine Unternehmen (unter 20 Mitarbeiter). Die Anwendung bietet ein zentrales Dashboard, einen Teamkalender, Urlaubsantraege mit Genehmigungsworkflow sowie ein vollstaendiges Urlaubskonto mit Jahreslog.

!!! info "Aktueller Stand"
    Hournest befindet sich in **Phase 1** (Urlaubsverwaltung). Weitere Funktionen wie Zeiterfassung, Einsatzplanung und Reports sind fuer Phase 2 geplant.

---

## Hauptfunktionen

### Dashboard
- Verbleibende Urlaubstage im aktuellen Jahr
- Offene eigene Anfragen (Status: Pending)
- Naechster geplanter Urlaub
- Admin-Sicht: zu bearbeitende Anfragen, Team-Status (wer ist heute/diese Woche abwesend)

### Teamkalender
- Monatsansicht mit Navigation (vor/zurueck, Heute-Button)
- Farbliche Unterscheidung: Wochenenden (grau), Feiertage (markiert), Urlaube nach Status
- Mitarbeiter sehen eigene Urlaube, Admins sehen alle

### Urlaubsantraege
- Antrag stellen mit Von-/Bis-Datum und optionalem Kommentar
- Validierung: kein Urlaub in der Vergangenheit, keine Ueberlappung
- Stornierung offener Antraege durch Mitarbeiter
- Genehmigung/Ablehnung durch Admins

### Urlaubskonto (Jahreslog)
- Vollstaendige Buchungsuebersicht pro Jahr: Anspruch, Uebertrag, Sonderurlaub, genommene Tage, Verfall
- Automatischer Resturlaub-Uebertrag mit konfigurierbarem Verfallsdatum
- Sonderurlaub-Buchungen nur durch Admin

### Feiertage
- Verwaltung fixer und variabler Feiertage durch Admins
- Feiertage werden bei der Urlaubstage-Berechnung automatisch abgezogen
- Ausnahme-Flag fuer Mitarbeiter, bei denen Feiertage als Arbeitstage zaehlen

### Arbeitszeitmodelle
- Individuelle Arbeitstage-Perioden pro Mitarbeiter (z.B. Brueckenteilzeit: nur Mi+Do)
- Globale Standard-Arbeitstage (konfigurierbar)
- Wochenend-Arbeiter-Flag fuer Sonderfaelle

### Rollen und Authentifizierung
- **Employee** -- Standardrolle bei erstem Login via SSO
- **Admin** -- automatisch bei SSO-Login, wenn Email in ADMIN_EMAILS-Liste steht
- **Superadmin** -- Notfallzugang mit lokalen Credentials (Username/Passwort in `.env`)
- OpenID Connect Login ueber Synology SSO Server

### Weitere Funktionen
- Zweisprachig: Deutsch und Englisch (umschaltbar zur Laufzeit)
- Auto-generierte API-Dokumentation (OpenAPI/Scramble) unter `/docs/api`
- Mock-Modus fuer Frontend-Entwicklung ohne Backend

---

## Tech Stack

| Bereich    | Technologie                                  |
|------------|----------------------------------------------|
| Frontend   | Angular 18+, Angular Material, SCSS, ngx-translate |
| Backend    | Laravel 11+, PHP 8.2+                        |
| Datenbank  | SQLite (Entwicklung), MySQL/PostgreSQL (Produktion) |
| Auth       | Synology SSO Server (OpenID Connect), Laravel Sanctum |
| API-Doku   | Scramble (auto-generierte OpenAPI-Spec)       |

---

## Projektstruktur

```
hournest/
├── frontend/              # Angular 18 SPA
│   ├── src/app/
│   │   ├── core/          # Services, Guards, Interceptors, Models, Mock
│   │   ├── features/      # Feature-Module (Dashboard, Kalender, Urlaub, Admin)
│   │   └── shared/        # Gemeinsame Komponenten
│   └── ...
├── backend/               # Laravel 11 API
│   ├── app/
│   │   ├── Enums/         # UserRole, VacationStatus, HolidayType, LedgerEntryType
│   │   ├── Http/          # Controllers, Middleware, Requests, Resources
│   │   └── Models/        # User, Vacation, Holiday, WorkSchedule, VacationLedgerEntry, Setting
│   ├── database/          # Migrations, Factories, Seeders
│   └── routes/api.php     # API-Routen
├── documentation/         # MkDocs-Dokumentation (dieses Dokument)
├── .env.example           # Umgebungsvariablen-Vorlage
├── CLAUDE.md              # Konventionen fuer Claude Code
└── CONCEPT.md             # Fachkonzept
```

---

## Weiterfuehrende Links

- **[Voraussetzungen](home/prerequisites.md)** -- Was wird benoetigt?
- **[Installation](home/installation.md)** -- Schritt-fuer-Schritt-Anleitung
- **[Konfiguration](home/configuration.md)** -- Alle Umgebungsvariablen erklaert
- **[Endanwender-Handbuch](user/index.md)** -- Anleitung fuer Benutzer und Admins
- **[Entwickler-Dokumentation](dev/index.md)** -- Architektur, API, Tests, Deployment
