# Feiertage verwalten

Die Feiertagsverwaltung ist nur für Admins zugänglich und ermöglicht das Anlegen, Bearbeiten und Löschen von Feiertagen.

---

## Übersicht

Die Feiertagsseite zeigt eine jahresbasierte Ansicht aller Feiertage mit folgenden Informationen:

| Spalte | Beschreibung                              |
|--------|-------------------------------------------|
| Status | Grün (bestätigt) oder Rot (Datum fehlt)   |
| Name   | Bezeichnung des Feiertags (z.B. "Neujahr") |
| Datum  | Das Datum des Feiertags für das gewählte Jahr |
| Typ    | Fix oder Variabel                          |

### Jahresfilter

Über einen Jahresfilter oben auf der Seite kann die Anzeige auf ein bestimmtes Jahr eingeschränkt werden.

### Status-Banner

Oben auf der Seite wird ein Status-Banner angezeigt:

- **Grün:** Alle Feiertage für das Jahr sind bestätigt -- Mitarbeiter können Urlaub buchen
- **Orange:** Es fehlen noch Datumsangaben -- Urlaubsbuchung ist gesperrt

---

## Fixe und variable Feiertage

### Fixe Feiertage

Fixe Feiertage fallen jedes Jahr auf dasselbe Datum und werden **automatisch** für jedes Jahr übernommen. Beispiele:

| Feiertag                 | Datum      |
|--------------------------|------------|
| Neujahr                  | 01.01.     |
| Tag der Arbeit           | 01.05.     |
| Tag der Deutschen Einheit| 03.10.     |
| 1. Weihnachtsfeiertag    | 25.12.     |
| 2. Weihnachtsfeiertag    | 26.12.     |

!!! note "Hinweis"
    Fixe Feiertage müssen nur einmal angelegt werden. Das Datum wird automatisch für jedes Jahr abgeleitet (gleicher Tag und Monat).

### Variable Feiertage

Variable Feiertage fallen jedes Jahr auf ein anderes Datum. Sie hängen typischerweise vom Ostertermin ab. Beispiele:

| Feiertag             | 2026       |
|----------------------|------------|
| Karfreitag           | 03.04.2026 |
| Ostermontag          | 06.04.2026 |
| Christi Himmelfahrt  | 14.05.2026 |
| Pfingstmontag        | 25.05.2026 |

Variable Feiertage werden in der Jahresansicht **rot markiert**, solange noch kein Datum für das jeweilige Jahr eingetragen ist. Über den Kalender-Button kann das Datum gesetzt werden.

---

## Start- und Endjahr

Jeder Feiertag hat ein **Startjahr** und ein optionales **Endjahr**:

- **Startjahr** (Pflicht): Ab welchem Jahr der Feiertag gilt
- **Endjahr** (optional): Bis wann der Feiertag gilt. Leer lassen für unbegrenzt.

**Beispiel:** Ein regionaler Feiertag, der erst ab 2027 gilt, bekommt Startjahr 2027. Ein abgeschaffter Feiertag bekommt ein Endjahr.

---

## Feiertagsbestätigung und Urlaubsbuchung

!!! warning "Wichtig"
    Mitarbeiter können erst Urlaub für ein Jahr buchen, wenn **alle Feiertage für dieses Jahr bestätigt** sind. Das bedeutet:

    - Alle **fixen Feiertage** sind automatisch bestätigt
    - Alle **variablen Feiertage** müssen ein konkretes Datum für das Jahr haben

    Der Status wird im Banner oben auf der Seite angezeigt. Mitarbeiter sehen beim Urlaubsantrag eine Warnung, wenn die Feiertage noch nicht vollständig sind.

---

## Feiertag anlegen

1. Klicke auf den Button **"Feiertag hinzufügen"**
2. Fülle die Felder aus:
    - **Name** -- Bezeichnung des Feiertags
    - **Datum** -- Das Datum des Feiertags
    - **Typ** -- Wähle zwischen "Fix" und "Variabel"
    - **Startjahr** -- Ab wann der Feiertag gilt
    - **Endjahr** (optional) -- Bis wann der Feiertag gilt
3. Klicke auf **"Speichern"**

---

## Feiertag bearbeiten

1. Klicke auf den Bearbeiten-Button neben dem gewünschten Feiertag
2. Ändere die gewünschten Felder
3. Klicke auf **"Speichern"**

### Variablen Feiertag für ein Jahr bestätigen

1. Klicke auf den **Kalender-Button** neben dem variablen Feiertag
2. Wähle das Datum für das aktuelle Jahr
3. Klicke auf **"Speichern"**

---

## Feiertag löschen

1. Klicke auf den Löschen-Button neben dem gewünschten Feiertag
2. Bestätige die Löschung

!!! warning "Achtung"
    Das Löschen eines Feiertags kann Auswirkungen auf die Urlaubstage-Berechnung haben. Falls bereits Urlaub genehmigt wurde, der über den gelöschten Feiertag hinweggeht, ändert sich die Berechnung nachträglich.

---

## Auswirkung auf die Urlaubsberechnung

Feiertage werden bei der Berechnung von Urlaubstagen **nicht** als Urlaubstage gezählt:

- **Beispiel:** Ein Mitarbeiter nimmt Urlaub vom 28.12.2026 bis 02.01.2027. Der 01.01. (Neujahr) wird nicht als Urlaubstag gezählt.
- **Ausnahme:** Mitarbeiter mit dem Flag **holidays_exempt** -- bei diesen Mitarbeitern zählen Feiertage als normale Arbeitstage.

---

## Empfehlung

!!! tip "Tipp"
    Trage zu Jahresbeginn alle variablen Feiertage ein, damit Mitarbeiter frühzeitig Urlaub buchen können. Fixe Feiertage werden automatisch übernommen und müssen nicht jährlich aktualisiert werden.
