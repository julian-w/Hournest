# Urlaubsanträge

Diese Seite erklärt, wie Urlaubsanträge gestellt, storniert und -- für Admins -- genehmigt oder abgelehnt werden.

---

## Urlaub beantragen (Schritt für Schritt)

1. Navigiere zu **"Mein Urlaub"** in der Seitennavigation
2. Klicke auf den Button **"Urlaub beantragen"**
3. Es öffnet sich ein Dialog mit folgenden Feldern:
    - **Startdatum** (Pflichtfeld) -- der erste Urlaubstag
    - **Enddatum** (Pflichtfeld) -- der letzte Urlaubstag
    - **Kommentar** (optional) -- z.B. "Sommerurlaub" oder "Familienfeier"
4. Klicke auf **"Antrag einreichen"**
5. Der Antrag wird mit dem Status **Ausstehend** erstellt und erscheint in deiner Urlaubsliste

!!! tip "Arbeitstage-Berechnung"
    Die Anzahl der Urlaubstage wird automatisch berechnet. Wochenenden und Feiertage werden nicht mitgezählt. Falls du ein individuelles Arbeitszeitmodell hast (z.B. nur Mi+Do), werden nur deine tatsächlichen Arbeitstage gezählt.

---

## Validierungsregeln

Der Antrag wird geprüft und ggf. mit einer Fehlermeldung abgelehnt:

| Regel                                  | Fehlermeldung                                    |
|----------------------------------------|--------------------------------------------------|
| Startdatum liegt in der Vergangenheit  | Urlaubsanträge in der Vergangenheit sind nicht erlaubt |
| Enddatum liegt vor dem Startdatum      | Das Enddatum muss nach dem Startdatum liegen     |
| Überlappung mit genehmigtem Urlaub     | Urlaub überlappt sich mit einem bereits genehmigten Urlaub |
| Feiertage nicht bestätigt              | Für dieses Jahr sind noch nicht alle Feiertage bestätigt |
| Urlaubssperre aktiv                    | In diesem Zeitraum gilt eine Urlaubssperre       |

### Feiertagsprüfung

Bevor ein Urlaubsantrag eingereicht werden kann, prüft das System, ob alle [Feiertage](admin/holidays.md) für das betreffende Jahr bestätigt sind. Sind noch variable Feiertage ohne Datum, wird eine **orange Warnung** angezeigt und der Antrag ist blockiert.

### Urlaubsplanung-Prüfung

Das System prüft, ob der gewählte Zeitraum mit einer [Urlaubssperre oder Betriebsferien](admin/blackouts.md) kollidiert:

- **Urlaubssperre:** Der Antrag wird **blockiert** (roter Hinweis)
- **Betriebsferien:** Eine **Warnung** wird angezeigt (orange), der Antrag bleibt möglich

---

## Antrag stornieren

Offene Anträge (Status **Ausstehend**) können vom Mitarbeiter selbst storniert werden:

1. Gehe zu **"Mein Urlaub"**
2. Finde den gewünschten Antrag in der Liste
3. Klicke auf den **Stornieren**-Button
4. Bestätige die Stornierung

!!! warning "Wichtig"
    Nur Anträge mit dem Status **Ausstehend** können storniert werden. Bereits genehmigte oder abgelehnte Anträge können nicht mehr durch den Mitarbeiter geändert werden.

---

## Status-Bedeutungen

| Status          | Symbol/Farbe | Bedeutung                                      |
|-----------------|-------------|-------------------------------------------------|
| **Ausstehend**  | Gelb/Amber  | Antrag wurde gestellt und wartet auf Bearbeitung durch einen Admin |
| **Genehmigt**   | Grün        | Antrag wurde genehmigt -- der Urlaub ist verbindlich eingetragen |
| **Abgelehnt**   | Rot         | Antrag wurde abgelehnt -- ggf. mit einem Kommentar des Admins |

---

## Urlaubsliste

Die Seite **"Mein Urlaub"** zeigt eine Tabelle aller eigenen Urlaubsanträge mit folgenden Spalten:

- **Zeitraum** -- Von- und Bis-Datum
- **Arbeitstage** -- Anzahl der berechneten Arbeitstage
- **Status** -- Ausstehend, Genehmigt oder Abgelehnt
- **Kommentar** -- Eigener Kommentar oder Kommentar des Admins
- **Bearbeitet von** -- Name des Admins, der den Antrag bearbeitet hat (falls vorhanden)
- **Aktionen** -- Stornieren-Button (nur für ausstehende Anträge)

---

## Genehmigung/Ablehnung durch Admins

Admins können offene Urlaubsanträge aller Mitarbeiter bearbeiten:

1. Navigiere zu **"Anfragen"** in der Seitennavigation (nur für Admins sichtbar)
2. Die Liste zeigt alle Anträge mit Status **Ausstehend**
3. Für jeden Antrag stehen zwei Aktionen zur Verfügung:
    - **Genehmigen** -- setzt den Status auf Genehmigt und erstellt automatisch einen Eintrag im Urlaubskonto
    - **Ablehnen** -- setzt den Status auf Abgelehnt, optional mit einem Kommentar zur Begründung

!!! info "Urlaubskonto"
    Bei Genehmigung wird automatisch ein Eintrag vom Typ **Genommen** im Urlaubskonto des Mitarbeiters erstellt. Die Anzahl der Arbeitstage wird dabei basierend auf dem individuellen Arbeitszeitmodell des Mitarbeiters berechnet.
