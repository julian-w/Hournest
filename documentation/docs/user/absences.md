# Abwesenheiten

Diese Seite erklärt, wie Krankheitsmeldungen und Sonderurlaub eingereicht, storniert und in der Zeiterfassung wirksam werden.

---

## Krankheit melden

1. Navigiere zu **"Abwesenheiten"**
2. Klicke auf **"Krankheit melden"**
3. Wähle:
   - **Startdatum**
   - **Enddatum**
   - **Umfang**: ganzer Tag, Vormittag oder Nachmittag
   - **Kommentar** optional
4. Reiche die Meldung ein

Die Meldung wird mit dem Status **Gemeldet** erstellt.

!!! info "Workflow"
    Krankmeldungen werden gemeldet und können anschließend vom Admin **zur Kenntnis genommen** werden.

---

## Sonderurlaub beantragen

1. Navigiere zu **"Abwesenheiten"**
2. Klicke auf **"Sonderurlaub beantragen"**
3. Wähle:
   - **Startdatum**
   - **Enddatum**
   - **Umfang**: ganzer Tag, Vormittag oder Nachmittag
   - **Kommentar** optional
4. Reiche den Antrag ein

Der Antrag wird mit dem Status **Ausstehend** erstellt und wartet auf Bearbeitung.

---

## Status-Bedeutungen

| Status | Bedeutung |
|--------|-----------|
| **Gemeldet** | Krankheit wurde eingereicht |
| **Zur Kenntnis genommen** | Krankheit wurde vom Admin bestätigt |
| **Ausstehend** | Sonderurlaub wartet auf Entscheidung |
| **Genehmigt** | Sonderurlaub wurde genehmigt |
| **Abgelehnt** | Sonderurlaub wurde abgelehnt |
| **Vom Admin erstellt** | Eintrag wurde direkt durch einen Admin angelegt |

---

## Halbe Tage

Für Krankheit und Sonderurlaub kann ein halber Tag gewählt werden:

- **Vormittag**
- **Nachmittag**

!!! info "Nur für eintägige Abwesenheiten"
    Halbtage können nur genutzt werden, wenn Start- und Enddatum identisch sind.

---

## Wirkung in der Zeiterfassung

Effektive Abwesenheiten wirken sich direkt auf die Zeiterfassung aus:

- **Krankheit:** Status `acknowledged` oder `admin_created`
- **Sonderurlaub:** Status `approved` oder `admin_created`

Dann gilt:

- **Ganzer Tag:** Der Tag wird gesperrt und automatisch auf die passende System-Kostenstelle gebucht
- **Halber Tag:** 50 % werden automatisch gebucht, 50 % bleiben für reguläre Kostenstellen offen
- Bereits vorhandene Zeiteinträge auf vollen effektiven Abwesenheitstagen werden entfernt

---

## Stornierung offener Meldungen

Offene Meldungen können selbst storniert werden:

- **Krankheit** mit Status **Gemeldet**
- **Sonderurlaub** mit Status **Ausstehend**

Bereits bearbeitete oder vom Admin erstellte Einträge können nicht selbst storniert werden.

---

## Abwesenheitsliste

Die Liste zeigt pro Eintrag:

- **Typ**
- **Zeitraum**
- **Umfang**
- **Status**
- **Kommentar**
- **Aktionen** zum Stornieren offener Einträge
