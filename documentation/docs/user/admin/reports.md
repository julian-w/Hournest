# Reports

Diese Seite beschreibt die Admin-Reports für Zeiterfassung und Kostenstellen.

---

## Report-Seite öffnen

1. Öffne im Admin-Bereich **"Reports"**
2. Wähle **Von**- und **Bis**-Datum
3. Lege fest, ob nach **Mitarbeiter** oder **Kostenstelle** gruppiert werden soll
4. Klicke auf **"Laden"**

---

## Zeitbuchungs-Zusammenfassung

Die obere Tabelle fasst Buchungen für den gewählten Zeitraum zusammen.

Je nach Gruppierung zeigt sie:

- pro **Mitarbeiter** die gesamten Prozentpunkte und gebuchten Minuten
- pro **Kostenstelle** die gesamten Prozentpunkte und gebuchten Minuten

Die gebuchten Minuten werden aus dem Zeiteintrag des Tages und der jeweiligen Prozentverteilung abgeleitet.

Für automatische Systembuchungen ohne separaten Zeiteintrag, z. B. Urlaub, Krankheit oder Betriebsferien, verwendet der Report die Soll-Minuten des Tages aus Arbeitszeitmodell oder Standard-Einstellung.

---

## Fehlende Einträge

Die zweite Tabelle zeigt Arbeitstage mit Lücken:

- **Fehlender Zeiteintrag**: Es gibt für einen Arbeitstag keinen Zeiteintrag
- **Unvollständige Buchung**: Ein Zeiteintrag ist vorhanden, aber die manuell erwartete Prozentverteilung ist nicht vollständig

Dabei gelten die aktuellen Fachregeln:

- normale Arbeitstage erwarten **100 %**
- halbtägige Abwesenheiten oder halbtägiger Urlaub erwarten **50 %**
- ganztägige Abwesenheiten, ganztägiger Urlaub und **Betriebsferien (`company_holiday`)** erscheinen nicht als fehlender Eintrag

---

## CSV-Export

Mit **"CSV exportieren"** wird ein Detail-Export für den gewählten Zeitraum heruntergeladen.

Der Export enthält pro Buchung u.a.:

- Datum
- Mitarbeitername und E-Mail
- Kostenstellen-Code und -Name
- Prozentwert
- abgeleitete gebuchte Minuten
- Kommentar
