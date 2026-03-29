# Benutzerverwaltung

Die Benutzerverwaltung ist nur fuer Admins zugaenglich und ermoeglicht die Verwaltung aller Mitarbeiter-Einstellungen.

---

## Benutzerliste

Die Benutzerliste zeigt alle registrierten Benutzer mit folgenden Informationen:

| Spalte                | Beschreibung                                    |
|-----------------------|-------------------------------------------------|
| Name                  | Anzeigename des Benutzers                       |
| Email                 | Email-Adresse (aus SSO uebernommen)             |
| Rolle                 | Employee, Admin oder Superadmin                 |
| Urlaubstage/Jahr      | Jaehrlicher Urlaubsanspruch                     |
| Resturlaub            | Verbleibende Urlaubstage im aktuellen Jahr      |

---

## Benutzer bearbeiten

Durch Klick auf einen Benutzer oeffnet sich die Detailansicht mit folgenden Einstellungsmoeglichkeiten:

### Rolle aendern

Die Rolle eines Benutzers kann zwischen **Employee** und **Admin** umgeschaltet werden.

!!! warning "Hinweis"
    Die Rollenaenderung wird sofort wirksam. Der Benutzer erhaelt beim naechsten Seitenladen die neue Rolle mit den entsprechenden Berechtigungen.

### Urlaubstage pro Jahr

Der jaehrliche Urlaubsanspruch kann pro Benutzer individuell eingestellt werden. Der Standardwert wird aus der `.env`-Variable `DEFAULT_VACATION_DAYS_PER_YEAR` uebernommen (Standard: 30 Tage).

### Feiertage-Ausnahme (holidays_exempt)

Wenn dieses Flag aktiviert ist, zaehlen **Feiertage als normale Arbeitstage** fuer diesen Mitarbeiter. Das bedeutet:

- Feiertage werden im Kalender weiterhin markiert
- Bei der Berechnung der Urlaubstage werden Feiertage aber **nicht** abgezogen
- Typischer Anwendungsfall: Mitarbeiter, die an Feiertagen arbeiten muessen

### Wochenend-Arbeiter (weekend_worker)

Wenn dieses Flag aktiviert ist, gelten **Samstag und Sonntag als Arbeitstage** fuer diesen Mitarbeiter, unabhaengig von den globalen Einstellungen oder dem individuellen Arbeitszeitmodell.

---

## Arbeitszeitmodelle

Arbeitszeitmodelle definieren, an welchen Wochentagen ein Mitarbeiter arbeitet. Sie werden als Perioden mit Start- und optionalem Enddatum angelegt.

### Standard-Arbeitstage

Wenn kein individuelles Arbeitszeitmodell definiert ist, gelten die globalen Standard-Arbeitstage (konfiguriert unter [Einstellungen](settings.md)). Typischerweise Montag bis Freitag (1-5).

### Individuelle Perioden

Fuer Mitarbeiter mit besonderen Arbeitszeiten (z.B. Brueckenteilzeit) koennen Perioden angelegt werden:

**Beispiel:** Ein Mitarbeiter arbeitet von Juli bis Dezember 2026 nur Mittwoch und Donnerstag:

- **Startdatum:** 01.07.2026
- **Enddatum:** 31.12.2026
- **Arbeitstage:** Mittwoch (3), Donnerstag (4)

### Perioden verwalten

| Aktion    | Beschreibung                                                |
|-----------|-------------------------------------------------------------|
| Erstellen | Neue Periode mit Startdatum, optionalem Enddatum und Arbeitstagen |
| Bearbeiten| Bestehende Periode aendern                                   |
| Loeschen  | Periode entfernen                                            |

!!! info "Arbeitstage-Kodierung"
    Die Wochentage werden als Zahlen nach ISO 8601 kodiert: 1 = Montag, 2 = Dienstag, 3 = Mittwoch, 4 = Donnerstag, 5 = Freitag, 6 = Samstag, 7 = Sonntag.

### Auswirkung auf die Urlaubsberechnung

Wenn ein Mitarbeiter z.B. nur Mi+Do arbeitet, werden bei einem Urlaubsantrag fuer eine volle Woche nur **2 Arbeitstage** vom Urlaubskonto abgezogen (statt 5).

---

## Urlaubskonto verwalten

Admins koennen fuer jeden Benutzer Buchungen im Urlaubskonto anlegen:

### Neue Buchung erstellen

1. Waehle den Benutzer in der Benutzerliste
2. Navigiere zum Bereich "Urlaubskonto"
3. Klicke auf "Neue Buchung"
4. Fuelle die Felder aus:
    - **Jahr** -- das betroffene Buchungsjahr
    - **Typ** -- Buchungstyp (z.B. Bonus, Adjustment, Entitlement, Carryover, Expired)
    - **Tage** -- Anzahl der Tage (positiv fuer Gutschrift, negativ fuer Abzug)
    - **Kommentar** -- Beschreibung der Buchung

### Typische Anwendungsfaelle

- **Sonderurlaub gewähren:** Typ = Bonus, Tage = +1, Kommentar = "Firmenevent"
- **Korrektur:** Typ = Adjustment, Tage = +2, Kommentar = "Fehlerkorrektur Vorjahr"
- **Jahresanspruch buchen:** Typ = Entitlement, Tage = +30, Kommentar = "Grundanspruch 2026"
- **Uebertrag buchen:** Typ = Carryover, Tage = +3, Kommentar = "Resturlaub aus 2025"
