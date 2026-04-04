# Zeiterfassung

Diese Seite erklärt, wie Arbeitszeiten in der Wochenansicht erfasst, Kostenstellen prozentual verteilt und gesperrte Tage behandelt werden.

---

## Wochenansicht öffnen

1. Navigiere zu **"Zeiterfassung"** in der Seitennavigation
2. Die aktuelle Kalenderwoche wird automatisch geladen
3. Nutze die **Pfeiltasten** oder den **Heute-Button**, um zwischen Wochen zu wechseln

Die Wochenansicht zeigt alle sieben Tage der Woche mit Arbeitszeiten, Kostenstellen-Buchungen und Wochenzusammenfassung.

---

## Arbeitszeiten erfassen

Für jeden Arbeitstag können folgende Werte eingetragen werden:

1. **Startzeit** -- Beginn des Arbeitstages
2. **Endzeit** -- Ende des Arbeitstages
3. **Pause** -- Pausendauer in Minuten

Die Netto-Arbeitszeit wird automatisch berechnet: **Endzeit − Startzeit − Pause**.

!!! tip "Direktes Speichern"
    Änderungen an Startzeit, Endzeit oder Pause werden direkt gespeichert, sobald das Feld geändert wird.

---

## Ist/Soll/Delta-Anzeige

Am unteren Rand der Wochenansicht wird eine Zusammenfassung angezeigt:

| Wert      | Bedeutung |
|-----------|-----------|
| **Ist**   | Tatsächlich erfasste Arbeitszeit der Woche |
| **Soll**  | Erwartete Arbeitszeit auf Basis des hinterlegten Arbeitszeitmodells |
| **Delta** | Differenz zwischen Ist und Soll |

---

## Kostenstellen-Buchung

Unterhalb der Arbeitszeiten werden die verfügbaren Kostenstellen als Zeilen angezeigt. Pro Tag wird je Kostenstelle ein **Prozentwert** eingetragen.

1. Trage zuerst die Arbeitszeit für den Tag ein
2. Verteile die Zeit auf eine oder mehrere Kostenstellen
3. Gib die Verteilung in **5-%-Schritten** ein

!!! warning "100-%-Regel"
    Die Summe aller Buchungen eines Tages muss genau **100 %** der manuell buchbaren Tagesanteile ergeben. Bei halbtägigen Abwesenheiten sind entsprechend genau **50 %** manuell zu verteilen.

---

## Favoriten, Vorlagen und Vorwoche kopieren

Um wiederkehrende Buchungen zu beschleunigen, stehen drei Funktionen zur Verfügung:

- **Favoriten** -- Favorisierte Kostenstellen werden im Grid zuerst angezeigt
- **Buchungsvorlagen** -- Speichern eine prozentuale Verteilung eines Tages und wenden sie auf andere Tage an
- **Vorwoche kopieren** -- Übernimmt die Prozentverteilung der Vorwoche in die aktuelle Woche

!!! tip "Favoriten"
    Favoriten werden getrennt von der Wochenansicht verwaltet. In der Zeiterfassung erscheinen sie automatisch oben.

### Buchungsvorlagen verwenden

Im Aktionsbereich der Wochenansicht können Vorlagen direkt verwaltet werden:

1. **Tag für Vorlage** auswählen
2. Eine bestehende **Vorlage** auswählen oder einen aktuellen Tag als neue Vorlage speichern
3. Vorlage auf den ausgewählten Tag anwenden oder aus den aktuellen Tageswerten aktualisieren

Vorlagen speichern nur die **Kostenstellen-Verteilung** eines Tages, nicht die Arbeitszeiten selbst.

!!! info "CRUD für Vorlagen"
    Mitarbeiter können ihre eigenen Buchungsvorlagen anlegen, aktualisieren und löschen. System-Kostenstellen wie `VACATION` oder `HOLIDAY` können nicht Teil einer Vorlage sein.

---

## Gesperrte Tage

Bestimmte Tage können nicht oder nur teilweise bearbeitet werden:

| Grund | Wirkung |
|-------|---------|
| **Genehmigter Urlaub** | Tag wird automatisch auf `VACATION` gebucht |
| **Krankheit** | Effektive Krankheitstage werden automatisch auf `ILLNESS` gebucht |
| **Sonderurlaub** | Effektive Sonderurlaubstage werden automatisch auf `SPECIAL_LEAVE` gebucht |
| **Feiertag** | Arbeitstage an Feiertagen werden automatisch auf `HOLIDAY` gebucht |
| **Monatsabschluss / Auto-Lock** | Änderungen sind nach manueller oder automatischer Sperre nicht mehr möglich |

!!! info "Automatische System-Buchungen"
    Gesperrte Tage durch Urlaub, Abwesenheiten und Feiertage werden automatisch mit der passenden System-Kostenstelle gebucht.

---

## Halbtags-Abwesenheiten

Halbtägige Krankheit oder halbtägiger Sonderurlaub sperren nur **50 %** des Tages:

- Das System erstellt automatisch eine **50-%-Buchung** auf die passende System-Kostenstelle
- Die übrigen **50 %** müssen manuell auf reguläre Kostenstellen verteilt werden
- Manuelle Buchungen über **100 %** sind an solchen Tagen nicht erlaubt

---

## Speichern

Die Wochenansicht bietet zwei Speicherarten:

- **Direktes Speichern** der Arbeitszeit bei Änderungen
- **"Alles speichern"** für Prozentbuchungen der Woche

Nur Tage mit gültiger Gesamtverteilung werden gespeichert. Tage ohne Buchungen oder mit ungültiger Summe werden übersprungen.

---

## Status der Zeiterfassung

| Status | Bedeutung |
|--------|-----------|
| **Offen** | Tag wurde noch nicht vollständig erfasst |
| **Vollständig** | Arbeitszeit und Kostenstellen sind korrekt erfasst |
| **Gesperrt** | Tag ist durch Abwesenheit, Feiertag oder Monatsabschluss gesperrt |
