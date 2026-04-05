# Playwright E2E

Diese E2E-Tests verwenden Playwright und starten Frontend und Backend lokal automatisch.

## Voraussetzungen

- Backend ist lauffaehig (`composer install`, `.env`, App-Key, Migrationen)
- Frontend-Abhaengigkeiten sind installiert
- Fuer authentifizierte Tests sind passende Zugangsdaten als Umgebungsvariablen gesetzt

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
```

## Ausfuehren

```bash
cd frontend
npm run e2e
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
- `vacation-review.spec.ts`: lokaler Mitarbeiter beantragt Urlaub per API, Admin prueft in der UI, Mitarbeiter sieht den genehmigten Status
- `vacation-cancel.spec.ts`: lokaler Mitarbeiter storniert einen offenen Urlaubsantrag in der UI
- `vacation-request-ui.spec.ts`: lokaler Mitarbeiter beantragt Urlaub direkt ueber den UI-Dialog
- `absence-cancel.spec.ts`: lokaler Mitarbeiter storniert einen offenen Sonderurlaubsantrag in der UI
- `absence-review.spec.ts`: lokaler Mitarbeiter beantragt Sonderurlaub, Admin prueft in der UI, Mitarbeiter sieht den Status
- `absence-request-ui.spec.ts`: lokaler Mitarbeiter beantragt Sonderurlaub direkt ueber den UI-Dialog
- `calendar-visibility.spec.ts`: Mitarbeiter sieht im Kalender nur freigegebene Gruppen-Urlaube, nicht aber fachfremde Personen
- `time-tracking-favorites.spec.ts`: Favorisierte Kostenstellen erscheinen zuerst in der Wochenbuchung
- `time-tracking-save.spec.ts`: lokaler Mitarbeiter speichert Wochenbuchungen in der Zeiterfassungs-UI
- `time-tracking-template.spec.ts`: lokaler Mitarbeiter speichert eine Vorlage und wendet sie auf einen anderen Tag an
- `time-tracking-copy-prev-day.spec.ts`: lokaler Mitarbeiter uebernimmt die letzte gebuchte Tagesverteilung in den ausgewaehlten Tag
- `vacation-reject.spec.ts`: lokaler Mitarbeiter beantragt Urlaub per API, Admin lehnt in der UI ab, Mitarbeiter sieht den abgelehnten Status

## Wichtiger Hinweis zum Review-Flow

`vacation-review.spec.ts` benoetigt:

- Admin- oder Superadmin-Credentials
- deaktiviertes OAuth (`AUTH_OAUTH_ENABLED=false`), damit lokal erzeugte E2E-Mitarbeiter sich anmelden koennen

Wenn lokaler Login nicht verfuegbar ist, wird dieser Test automatisch uebersprungen.

Authentifizierte Tests werden automatisch uebersprungen, wenn die benoetigten Umgebungsvariablen nicht gesetzt sind.

Standardmaessig laeuft die Suite lokal mit einem Worker, um Windows-/Sandbox-Probleme mit parallelem Prozess-Spawn zu vermeiden. Wenn die Umgebung stabil ist, kann ueber `E2E_WORKERS` bewusst erhoeht werden.
