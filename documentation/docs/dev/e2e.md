# E2E-Tests

Hournest verwendet fuer Browser-End-to-End-Tests **Playwright**.

Warum Playwright hier sinnvoll ist:

- echte Browser-Ausfuehrung statt nur Komponenten-Mocks
- gute Stabilitaet bei modernen SPAs
- hilfreiche Artefakte bei Fehlern: Trace, Screenshot, Video
- solide Abdeckung fuer kritische Nutzerfluesse wie Login, Urlaub, Zeiterfassung und Admin-Reviews

---

## Aktuelles Setup

Das Frontend bringt jetzt ein Playwright-Setup mit:

- Konfiguration: `frontend/playwright.config.ts`
- Testordner: `frontend/e2e/`
- Browser: Chromium
- lokale Server:
  - Frontend ueber Angular Dev Server auf `http://127.0.0.1:4200`
  - Backend ueber `php artisan serve` auf `http://127.0.0.1:8000`

---

## Ausfuehren

```bash
cd frontend
npm run e2e
```

Optionale Modi:

```bash
npm run e2e:headed
npm run e2e:ui
npm run e2e:report
```

---

## Zugangsdaten fuer authentifizierte Flows

Authentifizierte Tests verwenden Umgebungsvariablen:

```text
E2E_USERNAME
E2E_PASSWORD
E2E_ROLE
E2E_BASE_URL
E2E_API_URL
E2E_WORKERS
```

Beispiel in PowerShell:

```powershell
$env:E2E_USERNAME='superadmin'
$env:E2E_PASSWORD='replace-me'
$env:E2E_ROLE='superadmin'
npm run e2e
```

Hinweis:

- Authentifizierte Tests werden automatisch uebersprungen, wenn keine Credentials gesetzt sind.
- Admin-Tests laufen nur, wenn `E2E_ROLE=admin` oder `E2E_ROLE=superadmin` gesetzt ist.

---

## Aktuelle Smoke-Flows

- unauthentifizierter Redirect auf Login
- Dashboard mit gueltiger Session
- Zeiterfassung mit gueltiger Session
- Admin-Requests mit Admin- oder Superadmin-Session
- Urlaubs-Review-Flow mit generiertem Mitarbeiter, Admin-Review in der UI und Sichtpruefung beim Mitarbeiter
- Urlaubs-Storno eines offenen Antrags in der Mitarbeiter-UI
- Urlaubsantrag komplett ueber den Mitarbeiter-Dialog
- Abwesenheits-Review mit generiertem Mitarbeiter und Admin-Freigabe
- Abwesenheitsantrag komplett ueber den Mitarbeiter-Dialog
- Abwesenheits-Storno eines offenen Sonderurlaubsantrags in der Mitarbeiter-UI
- Kalender-Sichtbarkeit fuer gemeinsame Gruppen bei gleichzeitiger Ausblendung fachfremder Personen
- Favoriten-Reihenfolge in der Zeiterfassungs-UI
- Speichern von Wochenbuchungen in der Zeiterfassung
- Vorlagen speichern und auf einen anderen Tag anwenden in der Zeiterfassung
- Vorherige Tagesbuchung in den ausgewaehlten Tag uebernehmen
- Urlaubsablehnung mit Sichtpruefung des abgelehnten Status beim Mitarbeiter

---

## Laufzeitverhalten

- Lokal laeuft Playwright standardmaessig mit einem Worker, damit Windows- und Sandbox-Umgebungen keine `spawn`-Fehler erzeugen.
- Wenn die Umgebung stabil genug ist, kann die Parallelitaet gezielt ueber `E2E_WORKERS` erhoeht werden.

---

## Coverage-Messung

Ja, so etwas ist als Grundlage fuer weitere Tests sehr sinnvoll, solange man die Zahlen nicht mit fachlicher Vollstaendigkeit verwechselt.

Praktische Moeglichkeiten im Projekt:

- Frontend: `npm run test:coverage`
- Backend: `php artisan test --coverage`

Wichtig dazu:

- Frontend-Coverage misst vor allem Datei-, Zeilen- und Branch-Abdeckung der Angular-Specs
- Backend-Coverage benoetigt in der Regel `Xdebug` oder `PCOV`
- E2E-Tests zeigen eher kritische Nutzerfluesse, sind aber keine gute alleinige Prozentbasis fuer fachliche Sicherheit

Mein Vorschlag fuer euch:

1. Coverage-Prozentwerte als technische Orientierung nutzen
2. Test-Matrix und Feature-Inventar weiter als fachliche Sicht beibehalten
3. Beides zusammen verwenden, um echte Testluecken zu priorisieren

---

## Empfohlene naechste E2E-Flows

Die wichtigsten fachlichen Kandidaten fuer den naechsten Ausbau sind:

1. Urlaubs- und Abwesenheitsdialoge mit Validierungs- und Blackout-Fehlerpfaden
2. Zeiterfassung mit Vorwoche kopieren und gezielten Save-Fehlern
3. Halbtag-/Sperrfall in der Zeiterfassung als echter Browserflow
4. Admin-Create-Flows fuer Abwesenheiten oder weitere seltene Review-Randfaelle

Gerade diese Flows sollten nach und nach sowohl Happy Paths als auch kritische Randfaelle abdecken.
