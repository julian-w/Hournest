# Einstellungen

Die globalen Einstellungen sind nur für Admins zugänglich und gelten für alle Mitarbeiter. Individuelle Abweichungen (z.B. Arbeitszeitmodelle) werden pro Benutzer in der [Benutzerverwaltung](users.md) konfiguriert.

---

## Übersicht der Einstellungen

| Einstellung                    | Schlüssel                  | Beschreibung                                        |
|--------------------------------|----------------------------|-----------------------------------------------------|
| Standard-Arbeitstage           | `default_work_days`        | An welchen Wochentagen standardmäßig gearbeitet wird |
| Wochenende frei                | `weekend_is_free`          | Ob Samstag und Sonntag generell frei sind           |
| Übertrag aktiviert             | `carryover_enabled`        | Ob Resturlaub ins Folgejahr übertragen wird         |
| Übertrag-Verfallsdatum         | `carryover_expiry_date`    | Bis wann übertragene Tage gültig sind               |
| Urlaubsbuchung für neues Jahr  | `vacation_booking_start`   | Ab wann Urlaub für das nächste Jahr gebucht werden kann |

---

## Standard-Arbeitstage

Definiert die globalen Arbeitstage für alle Mitarbeiter, die kein individuelles Arbeitszeitmodell haben.

**Format:** JSON-Array mit Wochentag-Nummern nach ISO 8601

| Nummer | Wochentag    |
|--------|-------------|
| 1      | Montag      |
| 2      | Dienstag    |
| 3      | Mittwoch    |
| 4      | Donnerstag  |
| 5      | Freitag     |
| 6      | Samstag     |
| 7      | Sonntag     |

**Standardwert:** `[1,2,3,4,5]` (Montag bis Freitag)

!!! info "Individuelle Überschreibung"
    Wenn für einen Mitarbeiter ein individuelles Arbeitszeitmodell definiert ist (unter [Benutzerverwaltung](users.md)), überschreibt dieses die globale Einstellung.

---

## Wochenende frei

Bestimmt, ob Samstag und Sonntag generell als freie Tage gelten.

- **true** (Standard) -- Wochenenden sind frei und zählen nicht als Urlaubstage
- **false** -- Wochenenden sind Arbeitstage

!!! note "Hinweis"
    Einzelne Mitarbeiter können mit dem Flag **weekend_worker** von dieser globalen Einstellung abweichen. Siehe [Benutzerverwaltung](users.md).

---

## Übertrag aktiviert

Bestimmt, ob verbleibende Urlaubstage am 1. Januar automatisch ins Folgejahr übertragen werden.

- **true** (Standard) -- Resturlaub wird automatisch übertragen
- **false** -- Resturlaub verfällt am Jahresende

---

## Übertrag-Verfallsdatum

Definiert, bis wann übertragene Urlaubstage gültig sind. Nach diesem Datum werden übertragene Tage als **verfallen** gebucht.

**Format:** `DD.MM` (Tag.Monat)

**Standardwert:** `31.03` (31. März)

**Beispiel:** Mit dem Wert `31.03` gelten übertragene Urlaubstage bis zum 31. März des neuen Jahres. Nach diesem Datum werden sie als verfallen gebucht und vom Resturlaub abgezogen.

!!! tip "Kein Verfall"
    Um übertragene Urlaubstage unbegrenzt gültig zu halten, kann das Verfallsdatum leer gelassen oder der Übertrag komplett deaktiviert werden.

---

## Urlaubsbuchung für neues Jahr

Definiert, ab wann Mitarbeiter Urlaub für das nächste Kalenderjahr buchen können.

**Format:** `DD.MM` (Tag.Monat)

**Standardwert:** `01.10` (1. Oktober)

**Beispiel:** Mit dem Wert `01.10` können Mitarbeiter ab dem 1. Oktober Urlaub für das Folgejahr beantragen. Vorher ist die Buchung nur für das laufende Jahr möglich.

!!! info "Voraussetzung"
    Auch wenn der Buchungsstart erreicht ist, müssen alle [Feiertage](holidays.md) für das Folgejahr bestätigt sein, bevor Urlaubsanträge eingereicht werden können.

---

## Auswirkung der Einstellungen

Die globalen Einstellungen beeinflussen folgende Berechnungen:

1. **Urlaubstage-Berechnung:** Die Standard-Arbeitstage bestimmen, wie viele Arbeitstage in einem Urlaubszeitraum liegen
2. **Kalenderanzeige:** Wochenenden werden basierend auf der Einstellung grau hinterlegt
3. **Jahreswechsel:** Der Übertrag bestimmt, ob und wie lange Resturlaub ins neue Jahr mitgenommen wird
4. **Verfallsbuchungen:** Nach dem Verfallsdatum werden automatisch Buchungen vom Typ "Expired" im Urlaubskonto erstellt
5. **Buchungszeitraum:** Der Buchungsstart bestimmt, ab wann Urlaub für das Folgejahr gebucht werden kann

---

## Empfehlung

!!! warning "Wichtig"
    Änderungen an den globalen Einstellungen wirken sich auf **alle Mitarbeiter** aus, die keine individuellen Arbeitszeitmodelle haben. Prüfe vor einer Änderung, welche Auswirkungen sie auf bestehende Urlaubsberechnungen hat.
