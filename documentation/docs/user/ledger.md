# Urlaubskonto

Das Urlaubskonto zeigt eine vollständige Jahresübersicht aller Buchungen, die den Urlaubsanspruch eines Mitarbeiters betreffen. Jede Änderung -- ob Jahresanspruch, Übertrag, genommener Urlaub oder Sonderurlaub -- wird als eigene Buchung erfasst.

---

## Jahresübersicht

Das Urlaubskonto zeigt pro Jahr eine chronologische Liste aller Buchungen. Jede Zeile hat einen laufenden Saldo, sodass direkt sichtbar ist, wie sich der Resturlaub nach jeder Änderung entwickelt. Am Ende ergibt sich daraus der **aktuelle Resturlaub**.

### Beispiel

| Datum       | Typ           | Tage  | Saldo | Kommentar                    |
|-------------|---------------|-------|-------|------------------------------|
| 01.01.2026  | Jahresanspruch| +30   | 30    | Grundanspruch 2026           |
| 01.01.2026  | Übertrag      | +3    | 33    | Resturlaub aus 2025          |
| 15.02.2026  | Sonderurlaub  | +1    | 34    | Extra-Tag für Firmenjubiläum |
| 15.03.2026  | Genommen      | -5    | 29    | 23.03. - 27.03.2026          |
| 01.04.2026  | Genommen      | -10   | 19    | 06.04. - 17.04.2026          |

---

## Buchungstypen

Jede Buchung im Urlaubskonto hat einen Typ, der die Art der Änderung beschreibt:

Entitlement (Jahresanspruch)
:   Der jährliche Grundanspruch auf Urlaubstage. Wird typischerweise am 1. Januar eines Jahres gebucht. Positive Zahl (z.B. +30).

Carryover (Übertrag)
:   Resturlaubstage aus dem Vorjahr, die ins neue Jahr übertragen werden. Wird automatisch am 1. Januar gebucht. Positive Zahl (z.B. +3).

Bonus (Sonderurlaub)
:   Zusätzliche Urlaubstage, die vom Admin manuell vergeben werden. Wird z.B. für Firmenevents, besondere Anlässe oder Sonderzulagen verwendet. Positive Zahl (z.B. +1).

Taken (Genommen)
:   Genehmigte Urlaubstage, die abgezogen werden. Wird automatisch erstellt, wenn ein Urlaubsantrag genehmigt wird. Negative Zahl (z.B. -5).

Expired (Verfallen)
:   Übertragene Tage, die nach dem konfigurierten Verfallsdatum verfallen. Negative Zahl.

Adjustment (Anpassung)
:   Manuelle Korrekturbuchung durch den Admin. Kann positiv oder negativ sein. Wird für Ausnahmefälle verwendet.

---

## Berechnung des Resturlaubs

Der Resturlaub ergibt sich aus der Summe aller Buchungen eines Jahres:

```
Resturlaub = Jahresanspruch + Übertrag + Sonderurlaub - Genommen - Verfallen +/- Anpassungen
```

!!! info "Fallback-Berechnung"
    Falls für ein Jahr noch keine Buchungen im Urlaubskonto existieren, wird der Resturlaub als Fallback aus den Grundeinstellungen berechnet: `Urlaubstage pro Jahr - genehmigte Urlaubstage`.

---

## Admin: Urlaubskonto verwalten

Admins können das Urlaubskonto eines Mitarbeiters über die Benutzerverwaltung öffnen. Im Dialog wird die vollständige Buchungsliste mit Saldo angezeigt.

### Eintrag hinzufügen

1. Öffne das Urlaubskonto eines Mitarbeiters über die [Benutzerverwaltung](admin/users.md)
2. Wähle das Jahr
3. Fülle die Felder im Formular unten aus:
    - **Typ** -- Art der Buchung (z.B. Bonus, Adjustment)
    - **Tage** -- Anzahl der Tage (positiv zum Hinzufügen, negativ zum Abziehen)
    - **Kommentar** -- Grund der Buchung
4. Klicke auf **"Hinzufügen"**

### Eintrag löschen

1. Klicke auf das **Löschen-Symbol** neben dem Eintrag
2. Der Eintrag wird entfernt und der Saldo aktualisiert

!!! warning "Achtung"
    Das Löschen von Einträgen ändert den Saldo des Urlaubskontos. Prüfe vor dem Löschen, ob der verbleibende Saldo korrekt ist.

---

## Resturlaub-Übertrag

Am 1. Januar eines jeden Jahres werden verbleibende Urlaubstage automatisch als **Übertrag** ins neue Jahr übernommen.

### Verfall

Der Verfall von übertragenen Urlaubstagen ist konfigurierbar (durch den Admin unter [Einstellungen](admin/settings.md)):

- **Mit Verfallsdatum:** Übertragene Tage verfallen nach einem bestimmten Datum (z.B. 31.03.). Nach diesem Datum wird eine Buchung vom Typ **Expired** erstellt.
- **Ohne Verfall:** Übertragene Tage bleiben unbegrenzt erhalten.

---

## Hinweis für Mitarbeiter

!!! note "Nur lesen"
    Das Urlaubskonto ist für Mitarbeiter **nur zur Ansicht**. Buchungen können nur durch Admins erstellt oder geändert werden. Falls du Fragen zu deinem Urlaubskonto hast, wende dich bitte an deinen Administrator.

---

## Jahresauswahl

Oben auf der Seite kann das anzuzeigende Jahr ausgewählt werden. So lassen sich auch Buchungen vergangener Jahre einsehen.
