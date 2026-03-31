# Abwesenheiten

Diese Seite erklärt, wie Krankheitsmeldungen und Sonderurlaub eingereicht, storniert und vom Admin bearbeitet werden.

---

## Krankheit melden (Schritt für Schritt)

1. Navigiere zu **"Abwesenheiten"** in der Seitennavigation
2. Klicke auf den Button **"Abwesenheit melden"**
3. Wähle den Typ **"Krankheit"**
4. Fülle die folgenden Felder aus:
    - **Startdatum** (Pflichtfeld) -- der erste Krankheitstag
    - **Enddatum** (Pflichtfeld) -- der letzte Krankheitstag
    - **Halber Tag** (optional) -- siehe Abschnitt [Halbe Tage](#halbe-tage)
    - **Kommentar** (optional) -- z.B. "Erkältung"
5. Klicke auf **"Meldung einreichen"**
6. Die Meldung wird mit dem Status **Gemeldet** erstellt

!!! info "Kein Genehmigungsprozess"
    Krankmeldungen durchlaufen keinen Genehmigungsprozess. Sie werden direkt eingetragen und der Admin wird benachrichtigt. Der Admin kann die Meldung anschließend **zur Kenntnis nehmen**.

---

## Sonderurlaub beantragen

1. Navigiere zu **"Abwesenheiten"** in der Seitennavigation
2. Klicke auf den Button **"Abwesenheit melden"**
3. Wähle den Typ **"Sonderurlaub"**
4. Fülle die folgenden Felder aus:
    - **Startdatum** (Pflichtfeld) -- der erste Tag des Sonderurlaubs
    - **Enddatum** (Pflichtfeld) -- der letzte Tag
    - **Halber Tag** (optional) -- siehe Abschnitt [Halbe Tage](#halbe-tage)
    - **Kommentar** (Pflichtfeld) -- Begründung, z.B. "Umzug" oder "Hochzeit"
5. Klicke auf **"Antrag einreichen"**
6. Der Antrag wird mit dem Status **Ausstehend** erstellt und wartet auf Admin-Genehmigung

!!! warning "Kommentar erforderlich"
    Bei Sonderurlaub ist ein Kommentar mit der Begründung Pflicht. Ohne Begründung kann der Antrag nicht eingereicht werden.

---

## Status-Bedeutungen

| Status                 | Symbol/Farbe | Bedeutung                                                    |
|------------------------|-------------|--------------------------------------------------------------|
| **Gemeldet**           | Blau        | Krankmeldung wurde eingereicht und ist aktiv                 |
| **Zur Kenntnis genommen** | Grün     | Admin hat die Krankmeldung gesehen und bestätigt             |
| **Ausstehend**         | Gelb/Amber  | Sonderurlaub wurde beantragt und wartet auf Genehmigung     |
| **Genehmigt**          | Grün        | Sonderurlaub wurde vom Admin genehmigt                       |
| **Abgelehnt**          | Rot         | Sonderurlaub wurde abgelehnt -- ggf. mit Kommentar des Admins |
| **Vom Admin erstellt** | Grau        | Abwesenheit wurde direkt vom Admin eingetragen               |

---

## Halbe Tage

Für Krankheit und Sonderurlaub kann ein **halber Tag** gewählt werden:

- **Vormittag** -- Abwesenheit gilt nur für den Vormittag, der Nachmittag kann in der Zeiterfassung gebucht werden
- **Nachmittag** -- Abwesenheit gilt nur für den Nachmittag, der Vormittag kann gebucht werden

!!! tip "Wann halbe Tage nutzen?"
    Halbe Tage sind z.B. sinnvoll bei einem Arzttermin am Vormittag oder wenn du nachmittags erkrankst. Die Soll-Arbeitszeit wird entsprechend halbiert.

!!! info "Nur bei eintägigen Abwesenheiten"
    Halbe Tage können nur gewählt werden, wenn Start- und Enddatum identisch sind. Bei mehrtägigen Abwesenheiten ist diese Option nicht verfügbar.

---

## Stornierung von offenen Meldungen

Offene Abwesenheitsmeldungen können vom Mitarbeiter selbst storniert werden:

1. Gehe zu **"Abwesenheiten"**
2. Finde die gewünschte Meldung in der Liste
3. Klicke auf den **Stornieren**-Button
4. Bestätige die Stornierung

!!! warning "Einschränkungen"
    - **Krankmeldungen** mit dem Status **Gemeldet** können storniert werden
    - **Sonderurlaub** mit dem Status **Ausstehend** kann storniert werden
    - Bereits genehmigte, abgelehnte oder vom Admin bestätigte Einträge können nur durch einen Admin geändert werden

---

## Abwesenheitsliste

Die Seite **"Abwesenheiten"** zeigt eine Tabelle aller eigenen Abwesenheiten mit folgenden Spalten:

- **Zeitraum** -- Von- und Bis-Datum
- **Typ** -- Krankheit oder Sonderurlaub
- **Arbeitstage** -- Anzahl der betroffenen Arbeitstage
- **Status** -- Aktueller Status der Meldung
- **Kommentar** -- Eigener Kommentar oder Kommentar des Admins
- **Aktionen** -- Stornieren-Button (nur für offene Meldungen)
