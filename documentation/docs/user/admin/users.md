# Benutzerverwaltung

Die Benutzerverwaltung ist nur für Admins zugänglich und ermöglicht die Verwaltung aller Mitarbeiter-Einstellungen.

---

## Benutzerliste

Die Benutzerliste zeigt alle registrierten Benutzer mit folgenden Informationen:

| Spalte                | Beschreibung                                    |
|-----------------------|-------------------------------------------------|
| Name                  | Anzeigename des Benutzers                       |
| Email                 | Email-Adresse des Benutzers                     |
| Rolle                 | Employee, Admin oder Superadmin                 |
| Urlaubstage/Jahr      | Jährlicher Urlaubsanspruch                     |
| Resturlaub            | Verbleibende Urlaubstage im aktuellen Jahr      |

---

## Benutzer bearbeiten

Durch Klick auf einen Benutzer öffnet sich die Detailansicht mit folgenden Einstellungsmöglichkeiten:

### Rolle ändern

Die Rolle eines Benutzers kann zwischen **Employee** und **Admin** umgeschaltet werden.

!!! warning "Hinweis"
    Die Rollenänderung wird sofort wirksam. Der Benutzer erhält beim nächsten Seitenladen die neue Rolle mit den entsprechenden Berechtigungen.

### Urlaubstage pro Jahr

Der jährliche Urlaubsanspruch kann pro Benutzer individuell eingestellt werden. Der Standardwert wird aus der `.env`-Variable `DEFAULT_VACATION_DAYS_PER_YEAR` übernommen (Standard: 30 Tage).

### Feiertage-Ausnahme (holidays_exempt)

Wenn dieses Flag aktiviert ist, zählen **Feiertage als normale Arbeitstage** für diesen Mitarbeiter. Das bedeutet:

- Feiertage werden im Kalender weiterhin markiert
- Bei der Berechnung der Urlaubstage werden Feiertage aber **nicht** abgezogen
- Typischer Anwendungsfall: Mitarbeiter, die an Feiertagen arbeiten müssen

### Wochenend-Arbeiter (weekend_worker)

Wenn dieses Flag aktiviert ist, gelten **Samstag und Sonntag als Arbeitstage** für diesen Mitarbeiter, unabhängig von den globalen Einstellungen oder dem individuellen Arbeitszeitmodell.

---

## Arbeitszeitmodelle

Arbeitszeitmodelle definieren, an welchen Wochentagen ein Mitarbeiter arbeitet. Sie werden als Perioden mit Start- und optionalem Enddatum angelegt.

### Standard-Arbeitstage

Wenn kein individuelles Arbeitszeitmodell definiert ist, gelten die globalen Standard-Arbeitstage (konfiguriert unter [Einstellungen](settings.md)). Typischerweise Montag bis Freitag (1-5).

### Individuelle Perioden

Für Mitarbeiter mit besonderen Arbeitszeiten (z.B. Brückenteilzeit) können Perioden angelegt werden:

**Beispiel:** Ein Mitarbeiter arbeitet von Juli bis Dezember 2026 nur Mittwoch und Donnerstag:

- **Startdatum:** 01.07.2026
- **Enddatum:** 31.12.2026
- **Arbeitstage:** Mittwoch (3), Donnerstag (4)

### Perioden verwalten

| Aktion    | Beschreibung                                                |
|-----------|-------------------------------------------------------------|
| Erstellen | Neue Periode mit Startdatum, optionalem Enddatum und Arbeitstagen |
| Bearbeiten| Bestehende Periode ändern                                   |
| Löschen  | Periode entfernen                                            |

!!! info "Arbeitstage-Kodierung"
    Die Wochentage werden als Zahlen nach ISO 8601 kodiert: 1 = Montag, 2 = Dienstag, 3 = Mittwoch, 4 = Donnerstag, 5 = Freitag, 6 = Samstag, 7 = Sonntag.

### Auswirkung auf die Urlaubsberechnung

Wenn ein Mitarbeiter z.B. nur Mi+Do arbeitet, werden bei einem Urlaubsantrag für eine volle Woche nur **2 Arbeitstage** vom Urlaubskonto abgezogen (statt 5).

---

## Urlaubskonto verwalten

Admins können für jeden Benutzer Buchungen im Urlaubskonto anlegen:

### Neue Buchung erstellen

1. Wähle den Benutzer in der Benutzerliste
2. Navigiere zum Bereich "Urlaubskonto"
3. Klicke auf "Neue Buchung"
4. Fülle die Felder aus:
    - **Jahr** -- das betroffene Buchungsjahr
    - **Typ** -- Buchungstyp (z.B. Bonus, Adjustment, Entitlement, Carryover, Expired)
    - **Tage** -- Anzahl der Tage (positiv für Gutschrift, negativ für Abzug)
    - **Kommentar** -- Beschreibung der Buchung

### Typische Anwendungsfälle

- **Sonderurlaub gewähren:** Typ = Bonus, Tage = +1, Kommentar = "Firmenevent"
- **Korrektur:** Typ = Adjustment, Tage = +2, Kommentar = "Fehlerkorrektur Vorjahr"
- **Jahresanspruch buchen:** Typ = Entitlement, Tage = +30, Kommentar = "Grundanspruch 2026"
- **Übertrag buchen:** Typ = Carryover, Tage = +3, Kommentar = "Resturlaub aus 2025"

Automatisch erzeugte Urlaubskonto-Einträge, z. B. aus genehmigtem Urlaub oder Betriebsferien, bleiben schreibgeschützt. Löschbar sind nur manuelle Einträge.

---

## Arbeitszeitkonto verwalten

Admins können für jeden Benutzer auch das **Arbeitszeitkonto** öffnen.

Die Tabelle zeigt:

- Eröffnungssaldo aus Vorjahren
- tägliche Delta-Buchungen aus erfasster Arbeitszeit gegen Sollzeit
- manuelle Korrekturen
- Carryover-Einträge

### Typische Anwendungsfälle

- **Korrektur nach Abstimmung:** Typ = `manual_adjustment`, Minuten = `+60`, Kommentar = "Nachtrag Projektmeeting"
- **Übernahme aus Vorperiode:** Typ = `carryover`, Minuten = `-120`, Kommentar = "Saldo aus Dezember übernommen"

Nur manuelle Arbeitszeitkonto-Einträge können im Dialog wieder gelöscht werden.

---

## Nutzer erstellen

Über der Nutzerliste befindet sich ein **"Benutzer erstellen"**-Button.

| Feld | OAuth-Modus | Lokaler Modus |
|------|-------------|---------------|
| Name | Pflicht | Pflicht |
| E-Mail | Pflicht (muss eindeutig sein) | Pflicht (muss eindeutig sein) |
| Rolle | Pflicht | Pflicht |
| Urlaubstage/Jahr | Optional (Standard: 30) | Optional (Standard: 30) |
| Standard-Passwort | Nicht nötig | Pflicht (mind. 8 Zeichen) |

**OAuth-Modus (Pre-Provisioning):** Nutzer können vorab angelegt werden, um Urlaubstage, Rolle und weitere Einstellungen vor dem ersten SSO-Login festzulegen. Beim ersten SSO-Login wird der Nutzer anhand der E-Mail erkannt und automatisch mit dem OIDC-Account verknüpft.

**Lokaler Modus:** Der neue Nutzer muss sein Standard-Passwort beim ersten Login ändern.

---

## Nutzer löschen

In der Aktionsspalte jedes Nutzers befindet sich ein **Löschen-Icon**. Gelöschte Nutzer werden per Soft-Delete entfernt (können in der Datenbank wiederhergestellt werden). Der Superadmin und der eigene Account können nicht gelöscht werden.

---

## Passwort zurücksetzen (nur im lokalen Auth-Modus)

In der Aktionsspalte jedes Nutzers befindet sich ein **Schloss-Icon** zum Zurücksetzen des Passworts. Nach dem Zurücksetzen muss der Nutzer sein Passwort beim nächsten Login ändern.
