# Urlaubsanträge

Diese Seite erklärt, wie Urlaubsanträge gestellt, storniert und von Admins bearbeitet werden.

---

## Urlaub beantragen

1. Navigiere zu **"Mein Urlaub"**
2. Klicke auf **"Urlaub beantragen"**
3. Fülle aus:
   - **Startdatum**
   - **Enddatum**
   - **Umfang** -- ganztägig, vormittags oder nachmittags
   - **Kommentar** optional
4. Reiche den Antrag ein

Der Antrag wird mit Status **Ausstehend** erstellt.

!!! tip "Arbeitstage"
    Urlaubstage werden auf Basis deiner tatsächlichen Arbeitstage berechnet. Wochenenden und Feiertage werden nicht als Urlaubstage gezählt.

---

## Validierungsregeln

Ein Antrag kann abgelehnt oder blockiert werden, wenn:

- das Startdatum in der Vergangenheit liegt
- das Enddatum vor dem Startdatum liegt
- sich der Zeitraum mit bereits genehmigtem Urlaub überschneidet
- für das betroffene Jahr noch nicht alle Feiertage bestätigt sind
- eine Urlaubssperre aktiv ist
- bei halbtägigem Urlaub Start- und Enddatum nicht identisch sind

### Feiertagsprüfung

Sind noch variable Feiertage ohne bestätigtes Datum vorhanden, wird eine Warnung angezeigt und der Antrag blockiert.

### Urlaubssperren und Betriebsferien

- **Urlaubssperre:** blockiert den Antrag
- **Betriebsferien:** werden automatisch berücksichtigt, zusätzlicher Antrag ist nicht möglich

---

## Antrag stornieren

Nur Anträge mit Status **Ausstehend** können vom Mitarbeiter selbst storniert werden.

---

## Status-Bedeutungen

| Status | Bedeutung |
|--------|-----------|
| **Ausstehend** | Antrag wartet auf Bearbeitung |
| **Genehmigt** | Antrag wurde genehmigt |
| **Abgelehnt** | Antrag wurde abgelehnt |

---

## Urlaubsliste und Urlaubskonto

Die Seite **"Mein Urlaub"** zeigt:

- die Liste der eigenen Urlaubsanträge
- den aktuellen Resturlaub
- das Urlaubskonto für das ausgewählte Jahr

Im Urlaubskonto werden u.a. Anspruch, Übertrag, Verfall, Korrekturen und genommene Tage angezeigt.

---

## Bearbeitung durch Admins

Admins können offene Anträge genehmigen oder ablehnen.

Bei Genehmigung:

- wird automatisch ein **Taken/Genommen**-Eintrag im Urlaubskonto erzeugt
- werden betroffene Arbeitstage automatisch mit der System-Kostenstelle `VACATION` gebucht
- bei halbtägigem Urlaub entsteht automatisch eine **50-%-Buchung** auf `VACATION`
- bei ganztägigem Urlaub werden vorhandene manuelle Zeitbuchungen auf diesen Tagen entfernt
- bei ganztägigem Urlaub werden vorhandene Zeiteinträge auf diesen Tagen entfernt

---

## Feiertage und Zeiterfassung

Feiertage haben Vorrang vor Urlaub auf demselben Tag:

- fällt ein genehmigter Urlaubstag auf einen Feiertag, bleibt für diesen Tag die `HOLIDAY`-Buchung bestehen
- Feiertage zählen nicht als Urlaubstage
- für Mitarbeiter mit Feiertags-Ausnahme gelten Feiertage stattdessen als normale Arbeitstage

---

## Halbtags-Urlaub

Halbtägiger Urlaub ist für **einen einzelnen Tag** möglich:

- **Vormittag** oder **Nachmittag** können separat beantragt werden
- der Antrag zählt als **0,5 Urlaubstage**
- in der Zeiterfassung werden automatisch **50 %** auf `VACATION` gebucht
- die übrigen **50 %** bleiben für normale Arbeitszeit und reguläre Kostenstellen offen
