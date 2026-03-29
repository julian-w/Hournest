# Mock-Modus

Der Mock-Modus ermoeglicht die vollstaendige Frontend-Entwicklung ohne ein laufendes Backend. Alle API-Aufrufe werden durch einen HTTP-Interceptor abgefangen und mit realistischen Testdaten beantwortet.

---

## Warum Mock-Modus?

- **Schnellerer Entwicklungszyklus:** Kein Backend-Setup noetig, um an der UI zu arbeiten
- **Unabhaengige Entwicklung:** Frontend- und Backend-Entwickler koennen parallel arbeiten
- **Testen verschiedener Rollen:** Schnelles Umschalten zwischen Employee, Admin und Superadmin
- **Deterministische Daten:** Immer die gleichen Testdaten fuer konsistentes Testen

---

## Starten

### Option 1: Build-Konfiguration

```bash
cd frontend
ng serve --configuration=mock
```

Diese Konfiguration ist in der `angular.json` definiert und aktiviert den Mock-Modus ueber ein Environment-Flag.

### Option 2: URL-Parameter

Bei einem normalen `ng serve` kann der Mock-Modus per URL-Parameter aktiviert werden:

```
http://localhost:4200?mock=true
```

Der Parameter wird in der Session gespeichert, sodass er bei Navigation innerhalb der Anwendung erhalten bleibt.

---

## Rollen-Umschalter (Mock Toolbar)

Im Mock-Modus erscheint am unteren rechten Bildschirmrand eine **Floating Toolbar** mit drei Buttons:

- **Employee** -- Wechselt zur Employee-Rolle (Standard-Mitarbeiter)
- **Admin** -- Wechselt zur Admin-Rolle (mit Zugriff auf alle Admin-Funktionen)
- **Superadmin** -- Wechselt zur Superadmin-Rolle

Die Rollenauswahl wird in der Session gespeichert und bleibt beim Navigieren erhalten. Beim Rollenwechsel wird die Seite automatisch aktualisiert, sodass die Navigation und die sichtbaren Daten der neuen Rolle entsprechen.

---

## Mock-Daten

Die Testdaten sind in `frontend/src/app/core/mock/mock-data.ts` definiert:

### Benutzer (6 Stueck)

| ID | Name            | Rolle       | Urlaubstage | Besonderheiten        |
|----|-----------------|-------------|-------------|-----------------------|
| 1  | Anna Admin      | admin       | 30          | --                    |
| 2  | Max Mustermann  | employee    | 30          | --                    |
| 3  | Sarah Schmidt   | employee    | 28          | --                    |
| 4  | Tom Weber       | employee    | 30          | holidays_exempt       |
| 5  | Lisa Braun      | employee    | 30          | weekend_worker        |
| 6  | Superadmin      | superadmin  | 0           | --                    |

### Urlaube (8 Stueck)

Verschiedene Status (approved, pending, rejected) fuer unterschiedliche Benutzer.

### Feiertage (9 Stueck)

Deutsche Feiertage fuer 2026, gemischt aus fixen und variablen Feiertagen.

### Einstellungen

- Standard-Arbeitstage: Montag-Freitag
- Wochenende frei: ja
- Uebertrag aktiviert: ja
- Uebertrag-Verfallsdatum: 31.03.

### Arbeitszeitmodelle (1 Stueck)

Lisa Braun: Jul-Dez 2026, nur Mittwoch und Donnerstag.

### Urlaubskonto

Wird dynamisch pro Benutzer und Jahr generiert (Jahresanspruch, Uebertrag, Sonderurlaub, genommene Tage).

---

## Technische Funktionsweise

### MockService

Der `MockService` (`core/mock/mock.service.ts`) verwaltet den Mock-Zustand:

- Prueft ob der Mock-Modus aktiv ist (Build-Konfiguration oder URL-Parameter)
- Speichert die aktuelle Rolle in der Session
- Stellt den aktuellen Mock-Benutzer bereit

### MockInterceptor

Der `mockInterceptor` (`core/mock/mock.interceptor.ts`) ist ein Angular HTTP-Interceptor, der:

1. Prueft ob der Mock-Modus aktiv ist (`MockService.isActive()`)
2. Nicht-API-Requests (z.B. i18n-JSON-Dateien) durchlaesst
3. API-Requests anhand von URL und HTTP-Methode matched
4. Passende Mock-Responses mit 200ms simulierter Latenz zurueckgibt
5. Bei nicht-gematchten URLs den Request zum echten Backend durchlaesst

### In-Memory State

CRUD-Operationen aendern den In-Memory-Zustand:

- Neue Urlaube werden zum `vacations`-Array hinzugefuegt
- Geloeschte Urlaube werden aus dem Array entfernt
- Geaenderte Einstellungen werden aktualisiert
- ID-Zaehler (`nextVacationId`, `nextHolidayId`, etc.) vergeben fortlaufende IDs

---

## Neuen Mock-Endpoint hinzufuegen

Um einen neuen API-Endpoint im Mock-Modus zu unterstuetzen:

1. **Oeffne** `core/mock/mock.interceptor.ts`
2. **Fuege einen neuen Block** hinzu, der URL und Methode prueft:

```typescript
// GET /api/new-endpoint
if (method === 'GET' && url.endsWith('/api/new-endpoint')) {
  const data = /* mock data */;
  return of(jsonResponse({ data })).pipe(delay(MOCK_DELAY));
}
```

3. **Falls noetig**, fuege Mock-Daten in `mock-data.ts` hinzu
4. **Teste** den neuen Endpoint im Browser

!!! tip "Tipp"
    Halte die Mock-Responses moeglichst nah an den echten API-Responses. Verwende die gleiche Struktur (`{ data: ..., message: ... }`).

---

## Einschraenkungen

- **In-Memory:** Alle Aenderungen gehen beim Neuladen der Seite verloren
- **Keine echte Validierung:** Der Mock-Interceptor fuehrt keine serverseitige Validierung durch
- **Vereinfachte Berechnungen:** Z.B. wird `workdays` bei neuen Urlaubsantraegen mit einem festen Wert (5) belegt statt berechnet
- **Kein CSRF:** Das Sanctum-CSRF-Token-Handling wird im Mock-Modus uebersprungen
- **200ms Latenz:** Alle Responses haben eine feste Verzoegerung von 200ms
