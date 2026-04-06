# Playwright E2E

Diese E2E-Tests verwenden Playwright und starten Frontend und Backend lokal automatisch.
Das Backend wird fuer E2E standardmaessig mit lokaler Anmeldung, festem Superadmin und eigener SQLite-Datei frisch vorbereitet.

## Voraussetzungen

- Backend-Abhaengigkeiten sind installiert (`composer install`)
- Frontend-Abhaengigkeiten sind installiert

Ohne weitere Variablen nutzt die Suite diese eingebauten Defaults:

```text
E2E_USERNAME=superadmin
E2E_PASSWORD=e2e-password
E2E_ROLE=superadmin
```

Zusaetzlich wird fuer mitarbeiternahe Smoke-Flows ein fester lokaler Nutzer mitgesaet:

```text
e2e.employee@hournest.local / e2e-password
```

Beispiel:

```powershell
$env:E2E_USERNAME='superadmin'
$env:E2E_PASSWORD='replace-me'
$env:E2E_ROLE='superadmin'
```

Optional:

```powershell
$env:E2E_BASE_URL='http://127.0.0.1:4200'
$env:E2E_API_URL='http://127.0.0.1:8000'
$env:E2E_WORKERS='1'
$env:E2E_REUSE_EXISTING_SERVER='true'
```

## Ausfuehren

```bash
cd frontend
npm run e2e
```

Kleiner Standard-Smoke:

```bash
npm run e2e:smoke
```

Weitere Varianten:

```bash
npm run e2e:headed
npm run e2e:ui
npm run e2e:report
```

## Aktueller Umfang

- `unauthenticated.spec.ts`: Redirect auf Login ohne Session
- `authenticated.spec.ts`: Dashboard und Zeiterfassung mit gueltiger Session
- `admin.spec.ts`: Admin-Requests mit Admin- oder Superadmin-Session
- `vacation-review.spec.ts`: lokaler Mitarbeiter beantragt Urlaub direkt in der UI, Admin prueft in der UI, Mitarbeiter sieht den genehmigten Status
- `vacation-cancel.spec.ts`: lokaler Mitarbeiter storniert einen offenen Urlaubsantrag in der UI
- `vacation-request-ui.spec.ts`: lokaler Mitarbeiter beantragt Urlaub direkt ueber den UI-Dialog
- `absence-cancel.spec.ts`: lokaler Mitarbeiter storniert einen offenen Sonderurlaubsantrag in der UI
- `absence-review.spec.ts`: lokaler Mitarbeiter beantragt Sonderurlaub, Admin prueft in der UI, Mitarbeiter sieht den Status
- `absence-request-ui.spec.ts`: lokaler Mitarbeiter beantragt Sonderurlaub direkt ueber den UI-Dialog
- `calendar-visibility.spec.ts`: Mitarbeiter sieht im Kalender nur freigegebene Gruppen-Urlaube, nicht aber fachfremde Personen
- `time-tracking-favorites.spec.ts`: Favorisierte Kostenstellen erscheinen zuerst in der Wochenbuchung
- `time-tracking-half-day-vacation.spec.ts`: lokaler Mitarbeiter beantragt halbtags Urlaub, Admin genehmigt, und die Zeiterfassungs-UI reduziert den Tag auf 50 Prozent
- `time-tracking-save.spec.ts`: lokaler Mitarbeiter speichert Wochenbuchungen in der Zeiterfassungs-UI fuer einen vorhandenen Arbeitstag
- `time-tracking-save-error.spec.ts`: lokaler Mitarbeiter sieht einen echten Fehlerpfad, wenn das Speichern der Wochenbuchungen serverseitig scheitert
- `time-tracking-company-holiday.spec.ts`: eine administrativ gesetzte Company-Holiday-Sperre erscheint in der Wochenansicht sofort als gesperrter Tag
- `time-tracking-template.spec.ts`: lokaler Mitarbeiter speichert eine Vorlage und wendet sie auf einen anderen Tag an
- `time-tracking-copy-prev-day.spec.ts`: lokaler Mitarbeiter uebernimmt die letzte gebuchte Tagesverteilung in den ausgewaehlten Tag
- `vacation-reject.spec.ts`: lokaler Mitarbeiter beantragt Urlaub per API, Admin lehnt in der UI ab, Mitarbeiter sieht den abgelehnten Status
- `blackout-freeze-ui.spec.ts`: Admin legt eine Vacation-Freeze direkt in der UI an, und der Mitarbeiter-Dialog blockiert den Antrag schon vor dem Absenden
- `vacation-blackout-race.spec.ts`: ein Blackout entsteht erst waehrend ein Mitarbeiter den Urlaubsdialog offen hat, und der Backend-Fehler wird trotzdem mit Grund sauber angezeigt

## Wichtiger Hinweis zum Review-Flow

`vacation-review.spec.ts` benoetigt:

- Admin- oder Superadmin-Credentials
- deaktiviertes OAuth (`AUTH_OAUTH_ENABLED=false`), damit lokal erzeugte E2E-Mitarbeiter sich anmelden koennen

Wenn lokaler Login nicht verfuegbar ist, wird dieser Test automatisch uebersprungen.

Der Smoke-Bund laeuft mit den eingebauten Defaults ohne manuelle Credentials und ohne bereits gestartete Server.

Standardmaessig startet Playwright Frontend und Backend frisch und verwendet eine separate Datei `backend/database/e2e.sqlite`. Wenn du bewusst bereits laufende Server weiterverwenden willst, setze `E2E_REUSE_EXISTING_SERVER=true`.

Standardmaessig laeuft die Suite lokal mit einem Worker, um Windows-/Sandbox-Probleme mit parallelem Prozess-Spawn zu vermeiden. Wenn die Umgebung stabil ist, kann ueber `E2E_WORKERS` bewusst erhoeht werden.
