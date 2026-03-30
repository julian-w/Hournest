# Mock-Modus

Der Mock-Modus ermöglicht die vollständige Frontend-Entwicklung ohne ein laufendes Backend. Alle API-Aufrufe werden durch einen HTTP-Interceptor abgefangen und mit realistischen Testdaten beantwortet.

---

## Warum Mock-Modus?

- **Schnellerer Entwicklungszyklus:** Kein Backend-Setup nötig, um an der UI zu arbeiten
- **Unabhängige Entwicklung:** Frontend- und Backend-Entwickler können parallel arbeiten
- **Testen verschiedener Rollen:** Schnelles Umschalten zwischen Employee, Admin und Superadmin
- **Deterministische Daten:** Immer die gleichen Testdaten für konsistentes Testen

---

## Starten

### Option 1: Build-Konfiguration

```bash
cd frontend
ng serve --configuration=mock
```

Diese Konfiguration ist in der `angular.json` definiert und aktiviert den Mock-Modus über ein Environment-Flag.

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

### Benutzer (6 Stück)

| ID | Name            | Rolle       | Urlaubstage | Besonderheiten        |
|----|-----------------|-------------|-------------|-----------------------|
| 1  | Anna Admin      | admin       | 30          | --                    |
| 2  | Max Mustermann  | employee    | 30          | --                    |
| 3  | Sarah Schmidt   | employee    | 28          | --                    |
| 4  | Tom Weber       | employee    | 30          | holidays_exempt       |
| 5  | Lisa Braun      | employee    | 30          | weekend_worker        |
| 6  | Superadmin      | superadmin  | 0           | --                    |

### Urlaube (8 Stück)

Verschiedene Status (approved, pending, rejected) für unterschiedliche Benutzer.

### Feiertage (9 Stück)

Deutsche Feiertage für 2026, gemischt aus fixen und variablen Feiertagen.

### Einstellungen

- Standard-Arbeitstage: Montag-Freitag
- Wochenende frei: ja
- Übertrag aktiviert: ja
- Übertrag-Verfallsdatum: 31.03.

### Arbeitszeitmodelle (1 Stück)

Lisa Braun: Jul-Dez 2026, nur Mittwoch und Donnerstag.

### Urlaubskonto

Wird dynamisch pro Benutzer und Jahr generiert (Jahresanspruch, Übertrag, Sonderurlaub, genommene Tage).

---

## Technische Funktionsweise

### MockService

Der `MockService` (`core/mock/mock.service.ts`) verwaltet den Mock-Zustand:

- Prüft ob der Mock-Modus aktiv ist (Build-Konfiguration oder URL-Parameter)
- Speichert die aktuelle Rolle in der Session
- Stellt den aktuellen Mock-Benutzer bereit

### MockInterceptor

Der `mockInterceptor` (`core/mock/mock.interceptor.ts`) ist ein Angular HTTP-Interceptor, der:

1. Prüft ob der Mock-Modus aktiv ist (`MockService.isActive()`)
2. Nicht-API-Requests (z.B. i18n-JSON-Dateien) durchlässt
3. API-Requests anhand von URL und HTTP-Methode matched
4. Passende Mock-Responses mit 200ms simulierter Latenz zurückgibt
5. Bei nicht-gematchten URLs den Request zum echten Backend durchlässt

### In-Memory State

CRUD-Operationen ändern den In-Memory-Zustand:

- Neue Urlaube werden zum `vacations`-Array hinzugefügt
- Gelöschte Urlaube werden aus dem Array entfernt
- Geänderte Einstellungen werden aktualisiert
- ID-Zähler (`nextVacationId`, `nextHolidayId`, etc.) vergeben fortlaufende IDs

---

## Neuen Mock-Endpoint hinzufügen

Um einen neuen API-Endpoint im Mock-Modus zu unterstützen:

1. **Öffne** `core/mock/mock.interceptor.ts`
2. **Füge einen neuen Block** hinzu, der URL und Methode prüft:

```typescript
// GET /api/new-endpoint
if (method === 'GET' && url.endsWith('/api/new-endpoint')) {
  const data = /* mock data */;
  return of(jsonResponse({ data })).pipe(delay(MOCK_DELAY));
}
```

3. **Falls nötig**, füge Mock-Daten in `mock-data.ts` hinzu
4. **Teste** den neuen Endpoint im Browser

!!! tip "Tipp"
    Halte die Mock-Responses möglichst nah an den echten API-Responses. Verwende die gleiche Struktur (`{ data: ..., message: ... }`).

---

## Einschränkungen

- **In-Memory:** Alle Änderungen gehen beim Neuladen der Seite verloren
- **Keine echte Validierung:** Der Mock-Interceptor führt keine serverseitige Validierung durch
- **Vereinfachte Berechnungen:** Z.B. wird `workdays` bei neuen Urlaubsanträgen mit einem festen Wert (5) belegt statt berechnet
- **Kein CSRF:** Das Sanctum-CSRF-Token-Handling wird im Mock-Modus übersprungen
- **200ms Latenz:** Alle Responses haben eine feste Verzögerung von 200ms
