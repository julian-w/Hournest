# Kalender

Der Kalender zeigt eine Monatsansicht mit allen relevanten Informationen zu Feiertagen, Wochenenden und Urlauben.

---

## Monatsansicht

Der Kalender zeigt jeweils einen Monat in einer Rasteransicht (Wochentage als Spalten, Wochen als Zeilen). Jeder Tag zeigt die Tagnummer und -- falls vorhanden -- Urlaubs- und Feiertagsinformationen.

### Navigation

- **Pfeil links** -- zum vorherigen Monat wechseln
- **Pfeil rechts** -- zum nächsten Monat wechseln
- **Heute-Button** -- springt zurück zum aktuellen Monat und markiert den heutigen Tag

---

## Farbcodierung

Die Tage im Kalender sind farblich gekennzeichnet:

| Farbe / Markierung | Bedeutung                        |
|---------------------|----------------------------------|
| Grauer Hintergrund  | Wochenende (Samstag, Sonntag)    |
| Feiertags-Markierung| Gesetzlicher Feiertag            |
| Gelb / Amber        | Urlaub mit Status **Pending** (in Bearbeitung) |
| Grün               | Urlaub mit Status **Approved** (genehmigt) |
| Rot                 | Urlaub mit Status **Rejected** (abgelehnt) |

!!! info "Feiertage und Urlaubsberechnung"
    Feiertage werden nicht als Urlaubstage gezählt. Wenn ein Urlaub über einen Feiertag hinweg geht, wird dieser Tag automatisch abgezogen.

---

## Sichtbarkeit

### Employee (Mitarbeiter)

Mitarbeiter sehen im Kalender **nur ihre eigenen Urlaube**. Die Feiertage und Wochenenden sind für alle sichtbar.

### Admin (Administrator)

Admins sehen die **Urlaube aller Mitarbeiter** im Kalender. Jeder Urlaubseintrag zeigt den Namen des Mitarbeiters, sodass leicht erkennbar ist, wer wann abwesend ist.

!!! note "Geplant: Gruppen-Sichtbarkeit"
    In Phase 2 ist eine gruppenbasierte Sichtbarkeit geplant. Dann können Mitarbeiter innerhalb ihrer Gruppe auch die Urlaube der Kollegen sehen.

---

## Legende

Am unteren Rand des Kalenders befindet sich eine Legende, die die Farbcodierung erklärt:

- **Pending** -- Urlaubsantrag in Bearbeitung (wartet auf Genehmigung)
- **Approved** -- Urlaubsantrag genehmigt
- **Rejected** -- Urlaubsantrag abgelehnt
- **Holiday** -- Gesetzlicher Feiertag
- **Weekend** -- Wochenende (Samstag/Sonntag)

---

## Tipps zur Nutzung

- Nutze den Kalender, um vor der Urlaubsbeantragung zu prüfen, ob Feiertage in den gewünschten Zeitraum fallen
- Admins können den Kalender nutzen, um die Teamabwesenheiten im Blick zu behalten und Überlappungen zu erkennen
- Der Kalender aktualisiert sich automatisch, wenn Urlaubsanträge genehmigt oder abgelehnt werden
