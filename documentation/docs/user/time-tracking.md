# Zeiterfassung

Diese Seite erklärt, wie Arbeitszeiten in der Wochenansicht erfasst, Kostenstellen zugeordnet und Ist/Soll-Stunden überwacht werden.

---

## Wochenansicht öffnen

1. Navigiere zu **"Zeiterfassung"** in der Seitennavigation
2. Die aktuelle Kalenderwoche wird automatisch geladen
3. Nutze die **Pfeiltasten** oder den **Kalender-Button**, um zwischen Wochen zu wechseln

Die Wochenansicht zeigt alle sieben Tage der Woche mit den jeweiligen Arbeitszeiten und Kostenstellen-Buchungen.

---

## Arbeitszeiten erfassen

Für jeden Arbeitstag können folgende Werte eingetragen werden:

1. **Startzeit** -- Beginn des Arbeitstages (z.B. 08:00)
2. **Endzeit** -- Ende des Arbeitstages (z.B. 17:00)
3. **Pause** -- Pausendauer in Minuten (z.B. 30 oder 60)

Die Netto-Arbeitszeit wird automatisch berechnet: **Endzeit − Startzeit − Pause**.

!!! tip "Schnelle Eingabe"
    Tab-Taste nutzen, um zwischen den Feldern zu springen. Die Eingabe wird automatisch gespeichert, sobald das Feld verlassen wird.

---

## Ist/Soll/Delta-Anzeige

Am unteren Rand der Wochenansicht wird eine Zusammenfassung angezeigt:

| Wert      | Bedeutung                                                    |
|-----------|--------------------------------------------------------------|
| **Soll**  | Erwartete Arbeitszeit basierend auf dem individuellen Arbeitszeitmodell |
| **Ist**   | Tatsächlich erfasste Arbeitszeit der Woche                   |
| **Delta** | Differenz zwischen Ist und Soll (positiv = Überstunden, negativ = Fehlstunden) |

!!! info "Arbeitszeitmodell"
    Das Soll wird aus dem hinterlegten Arbeitszeitmodell des Mitarbeiters berechnet. Feiertage und genehmigte Abwesenheiten reduzieren das Wochensoll automatisch.

---

## Kostenstellen-Buchung

Unterhalb der Arbeitszeiten können die geleisteten Stunden auf **Kostenstellen** verteilt werden:

1. Wähle eine Kostenstelle aus dem Dropdown
2. Gib den **prozentualen Anteil** der Arbeitszeit ein
3. Füge bei Bedarf weitere Kostenstellen hinzu

!!! warning "100 %-Regel"
    Die Summe aller Kostenstellen-Buchungen eines Tages muss genau **100 %** ergeben. Solange die Summe nicht 100 % beträgt, wird ein Hinweis angezeigt und der Tag gilt als unvollständig.

---

## Favoriten und Vorwoche kopieren

Um wiederkehrende Buchungen zu beschleunigen, stehen zwei Funktionen zur Verfügung:

- **Favoriten** -- Speichere eine häufig verwendete Kostenstellen-Verteilung als Favorit und wende sie per Klick auf einzelne Tage oder die ganze Woche an
- **Vorwoche kopieren** -- Übernimmt die Kostenstellen-Verteilung der Vorwoche für die aktuelle Woche

!!! tip "Favoriten verwalten"
    Klicke auf das **Stern-Symbol** neben einer Kostenstellen-Verteilung, um sie als Favorit zu speichern. Gespeicherte Favoriten erscheinen im Dropdown **"Favoriten anwenden"**.

---

## Gesperrte Tage

Bestimmte Tage können nicht bearbeitet werden:

| Grund                  | Anzeige                  | Erklärung                                      |
|------------------------|--------------------------|-------------------------------------------------|
| **Genehmigter Urlaub** | Grün hinterlegt          | Tag ist als Urlaub gebucht -- keine manuelle Erfassung nötig |
| **Krankheit**          | Orange hinterlegt        | Krankmeldung liegt vor -- keine Erfassung möglich |
| **Feiertag**           | Blau hinterlegt          | Gesetzlicher oder betrieblicher Feiertag       |
| **Sonderurlaub**       | Violett hinterlegt       | Genehmigter Sonderurlaub                       |
| **Monatsabschluss**    | Schloss-Symbol           | Der Monat wurde vom Admin abgeschlossen -- nachträgliche Änderungen sind gesperrt |

!!! info "Abwesenheiten"
    Gesperrte Tage durch Abwesenheiten werden automatisch mit der entsprechenden System-Kostenstelle (z.B. "Urlaub" oder "Krankheit") gebucht.

---

## Status der Zeiterfassung

| Status              | Bedeutung                                                     |
|---------------------|---------------------------------------------------------------|
| **Offen**           | Tag wurde noch nicht vollständig erfasst                      |
| **Vollständig**     | Arbeitszeit und Kostenstellen sind korrekt erfasst (100 %)   |
| **Gesperrt**        | Tag ist durch Abwesenheit oder Monatsabschluss gesperrt       |
