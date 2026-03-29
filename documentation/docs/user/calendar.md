# Kalender

Der Kalender zeigt eine Monatsansicht mit allen relevanten Informationen zu Feiertagen, Wochenenden und Urlauben.

---

## Monatsansicht

Der Kalender zeigt jeweils einen Monat in einer Rasteransicht (Wochentage als Spalten, Wochen als Zeilen). Jeder Tag zeigt die Tagnummer und -- falls vorhanden -- Urlaubs- und Feiertagsinformationen.

### Navigation

- **Pfeil links** -- zum vorherigen Monat wechseln
- **Pfeil rechts** -- zum naechsten Monat wechseln
- **Heute-Button** -- springt zurueck zum aktuellen Monat und markiert den heutigen Tag

---

## Farbcodierung

Die Tage im Kalender sind farblich gekennzeichnet:

| Farbe / Markierung | Bedeutung                        |
|---------------------|----------------------------------|
| Grauer Hintergrund  | Wochenende (Samstag, Sonntag)    |
| Feiertags-Markierung| Gesetzlicher Feiertag            |
| Gelb / Amber        | Urlaub mit Status **Pending** (in Bearbeitung) |
| Gruen               | Urlaub mit Status **Approved** (genehmigt) |
| Rot                 | Urlaub mit Status **Rejected** (abgelehnt) |

!!! info "Feiertage und Urlaubsberechnung"
    Feiertage werden nicht als Urlaubstage gezaehlt. Wenn ein Urlaub ueber einen Feiertag hinweg geht, wird dieser Tag automatisch abgezogen.

---

## Sichtbarkeit

### Employee (Mitarbeiter)

Mitarbeiter sehen im Kalender **nur ihre eigenen Urlaube**. Die Feiertage und Wochenenden sind fuer alle sichtbar.

### Admin (Administrator)

Admins sehen die **Urlaube aller Mitarbeiter** im Kalender. Jeder Urlaubseintrag zeigt den Namen des Mitarbeiters, sodass leicht erkennbar ist, wer wann abwesend ist.

!!! note "Geplant: Gruppen-Sichtbarkeit"
    In Phase 2 ist eine gruppenbasierte Sichtbarkeit geplant. Dann koennen Mitarbeiter innerhalb ihrer Gruppe auch die Urlaube der Kollegen sehen.

---

## Legende

Am unteren Rand des Kalenders befindet sich eine Legende, die die Farbcodierung erklaert:

- **Pending** -- Urlaubsantrag in Bearbeitung (wartet auf Genehmigung)
- **Approved** -- Urlaubsantrag genehmigt
- **Rejected** -- Urlaubsantrag abgelehnt
- **Holiday** -- Gesetzlicher Feiertag
- **Weekend** -- Wochenende (Samstag/Sonntag)

---

## Tipps zur Nutzung

- Nutze den Kalender, um vor der Urlaubsbeantragung zu pruefen, ob Feiertage in den gewuenschten Zeitraum fallen
- Admins koennen den Kalender nutzen, um die Teamabwesenheiten im Blick zu behalten und Ueberlappungen zu erkennen
- Der Kalender aktualisiert sich automatisch, wenn Urlaubsantraege genehmigt oder abgelehnt werden
