# Hournest -- Team-Urlaubsverwaltung

Hournest ist eine interne Webanwendung für **Urlaubsverwaltung** mit bereits ausgebautem Bereich für **Zeiterfassung und Kostenstellenbuchung**. Die Anwendung richtet sich an kleine Unternehmen (unter 20 Mitarbeiter).

!!! info "Aktueller Stand"
    Die Urlaubsverwaltung ist stabil umgesetzt. Große Teile der Zeiterfassung, Abwesenheiten, Kostenstellen, Sperrlogik, Blackouts inklusive Betriebsferien-Automatik, Admin-Reports sowie das neue Arbeitszeitkonto sind ebenfalls bereits implementiert. Weitere Auswertungen und spätere Ausbaustufen bleiben geplant.

---

## Hauptfunktionen

### Dashboard
- Verbleibende Urlaubstage im aktuellen Jahr
- Offene eigene Anfragen (Status: Pending)
- Nächster geplanter Urlaub
- Admin-Sicht: zu bearbeitende Anfragen, Team-Status (wer ist heute/diese Woche abwesend)

### Teamkalender
- Monatsansicht mit Navigation (vor/zurück, Heute-Button)
- Farbliche Unterscheidung: Wochenenden (grau), Feiertage (markiert), Urlaube nach Status
- Mitarbeiter sehen eigene Urlaube plus Urlaube aus gemeinsamen Benutzergruppen, Admins sehen alle

### Urlaubsanträge
- Antrag stellen mit Von-/Bis-Datum und optionalem Kommentar
- Validierung: kein Urlaub in der Vergangenheit, keine Überlappung
- Stornierung offener Anträge durch Mitarbeiter
- Genehmigung/Ablehnung durch Admins

### Urlaubskonto (Jahreslog)
- Vollständige Buchungsübersicht pro Jahr: Anspruch, Übertrag, Sonderurlaub, genommene Tage, Verfall
- Automatischer Resturlaub-Übertrag mit konfigurierbarem Verfallsdatum
- Sonderurlaub-Buchungen nur durch Admin
- Laufender Saldo in der Tabelle für bessere Nachvollziehbarkeit

### Arbeitszeitkonto
- Jahreslog mit Eröffnungssaldo, täglichen Delta-Buchungen und manuellen Korrekturen
- Sollzeit auf Basis individueller Arbeitszeitmodelle, Feiertage, Urlaub, Abwesenheiten und Betriebsferien
- Admins können manuelle Korrekturen und Carryover-Einträge pro Mitarbeiter verwalten

### Feiertage
- Verwaltung fixer und variabler Feiertage durch Admins
- Feiertage werden bei der Urlaubstage-Berechnung automatisch abgezogen
- Ausnahme-Flag für Mitarbeiter, bei denen Feiertage als Arbeitstage zählen

### Arbeitszeitmodelle
- Individuelle Arbeitstage-Perioden pro Mitarbeiter (z.B. Brückenteilzeit: nur Mi+Do)
- Globale Standard-Arbeitstage (konfigurierbar)
- Wochenend-Arbeiter-Flag für Sonderfälle

### Rollen und Authentifizierung
- **Employee** -- Standardrolle bei erstem Login via SSO
- **Admin** -- automatisch bei SSO-Login, wenn Email in ADMIN_EMAILS-Liste steht
- **Superadmin** -- Notfallzugang mit lokalen Credentials (Username/Passwort in `.env`)
- Authentifizierung: OpenID Connect (OIDC) oder lokale Email+Passwort-Anmeldung

### Weitere Funktionen
- Zweisprachig: Deutsch und Englisch (umschaltbar zur Laufzeit)
- Auto-generierte API-Dokumentation (OpenAPI/Scramble) unter `/docs/api`
- Mock-Modus für Frontend-Entwicklung ohne Backend
- Backend-Testabdeckung mit 385 Tests / 1098 Assertions

---

## Tech Stack

| Bereich    | Technologie                                  |
|------------|----------------------------------------------|
| Frontend   | Angular 18+, Angular Material, SCSS, ngx-translate |
| Backend    | Laravel 11+, PHP 8.4+                        |
| Datenbank  | SQLite (Entwicklung), MySQL/PostgreSQL (Produktion) |
| Auth       | OIDC (beliebiger Provider) oder lokales Login, Laravel Sanctum |
| API-Doku   | Scramble (auto-generierte OpenAPI-Spec)       |

---

## Projektstruktur

```
hournest/
├── frontend/              # Angular 18 SPA
│   ├── src/app/
│   │   ├── core/          # Services, Guards, Interceptors, Models, Mock
│   │   ├── features/      # Feature-Module (Dashboard, Kalender, Urlaub, Admin)
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
├── CLAUDE.md              # Konventionen für Claude Code
└── CONCEPT.md             # Fachkonzept
```

---

## Weiterführende Links

- **[Voraussetzungen](home/prerequisites.md)** -- Was wird benötigt?
- **[Installation](home/installation.md)** -- Schritt-für-Schritt-Anleitung
- **[Konfiguration](home/configuration.md)** -- Alle Umgebungsvariablen erklärt
- **[Endanwender-Handbuch](user/index.md)** -- Anleitung für Benutzer und Admins
- **[Entwickler-Dokumentation](dev/index.md)** -- Architektur, API, Tests, Deployment

## Hinweise zum Funktionsstand

- **Bereits umgesetzt:** Urlaub, Urlaubskonto, Arbeitszeitkonto, Feiertage, Arbeitszeitmodelle, Rollen, OIDC, lokale Anmeldung, Zeiterfassung-Kernfunktionen, Kostenstellen, Favoriten, Abwesenheiten, Locks, Admin-Reports
- **Teilweise umgesetzt:** weiterführende Komfortfunktionen und spätere Analytics-Ausbaustufen
- **Noch geplant:** Schichtplanung und weiterführende Reports/Analytics
