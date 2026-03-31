# Abwesenheitsverwaltung

Diese Seite erklärt, wie Admins Krankmeldungen bestätigen, Sonderurlaub genehmigen und Abwesenheiten direkt anlegen können.

---

## Offene Krankmeldungen bestätigen

Wenn ein Mitarbeiter eine Krankmeldung einreicht, wird der Admin benachrichtigt. Offene Krankmeldungen können bestätigt werden:

1. Navigiere zu **"Abwesenheitsverwaltung"** im Bereich **"Administration"**
2. Wechsle zum Tab **"Offene Meldungen"**
3. Die Liste zeigt alle Krankmeldungen mit dem Status **Gemeldet**
4. Klicke auf **"Zur Kenntnis nehmen"** neben der jeweiligen Meldung
5. Der Status wechselt auf **Zur Kenntnis genommen**

!!! info "Kein Genehmigungsprozess"
    Krankmeldungen müssen nicht genehmigt werden. Die Bestätigung dient lediglich der Dokumentation, dass der Admin die Meldung gesehen hat. Die Abwesenheit ist unabhängig vom Bestätigungsstatus sofort aktiv.

---

## Sonderurlaub genehmigen oder ablehnen

Anträge auf Sonderurlaub durchlaufen einen Genehmigungsprozess:

1. Navigiere zu **"Abwesenheitsverwaltung"** im Bereich **"Administration"**
2. Wechsle zum Tab **"Offene Anträge"**
3. Die Liste zeigt alle Sonderurlaubsanträge mit dem Status **Ausstehend**
4. Für jeden Antrag stehen zwei Aktionen zur Verfügung:
    - **Genehmigen** -- setzt den Status auf **Genehmigt** und erstellt die Abwesenheit im Kalender
    - **Ablehnen** -- setzt den Status auf **Abgelehnt**, optional mit einem Kommentar zur Begründung

!!! tip "Kommentar bei Ablehnung"
    Es empfiehlt sich, bei einer Ablehnung einen Kommentar mit der Begründung hinzuzufügen. Der Mitarbeiter sieht diesen Kommentar in seiner Abwesenheitsliste.

---

## Abwesenheit direkt anlegen (als Admin)

Admins können Abwesenheiten für Mitarbeiter direkt anlegen, ohne dass der Mitarbeiter selbst einen Antrag stellen muss:

1. Navigiere zu **"Abwesenheitsverwaltung"** im Bereich **"Administration"**
2. Klicke auf den Button **"Abwesenheit erstellen"**
3. Fülle die folgenden Felder aus:
    - **Mitarbeiter** (Pflichtfeld) -- Wähle den betroffenen Mitarbeiter
    - **Typ** (Pflichtfeld) -- Krankheit oder Sonderurlaub
    - **Startdatum** (Pflichtfeld) -- Der erste Abwesenheitstag
    - **Enddatum** (Pflichtfeld) -- Der letzte Abwesenheitstag
    - **Halber Tag** (optional) -- Vormittag oder Nachmittag (nur bei eintägigen Abwesenheiten)
    - **Kommentar** (optional) -- Begründung oder Notiz
4. Klicke auf **"Speichern"**

Die Abwesenheit wird mit dem Status **Vom Admin erstellt** angelegt und ist sofort aktiv.

!!! warning "Rückwirkende Einträge"
    Admins können auch Abwesenheiten in der Vergangenheit anlegen. Bereits erfasste Zeitbuchungen für die betroffenen Tage werden dabei **nicht** automatisch entfernt und müssen ggf. manuell korrigiert werden.

---

## Status-Übersicht

| Status                 | Typ          | Nächste Aktion                                   |
|------------------------|-------------|--------------------------------------------------|
| **Gemeldet**           | Krankheit   | Zur Kenntnis nehmen                              |
| **Zur Kenntnis genommen** | Krankheit | Keine weitere Aktion erforderlich                |
| **Ausstehend**         | Sonderurlaub| Genehmigen oder Ablehnen                         |
| **Genehmigt**          | Sonderurlaub| Keine weitere Aktion erforderlich                |
| **Abgelehnt**          | Sonderurlaub| Keine weitere Aktion erforderlich                |
| **Vom Admin erstellt** | Beide       | Keine weitere Aktion erforderlich                |

---

## Monatsabschluss und Zeitsperre

Der Monatsabschluss sperrt alle Zeiterfassungs- und Abwesenheitseinträge eines Monats gegen nachträgliche Änderungen:

1. Navigiere zu **"Abwesenheitsverwaltung"** im Bereich **"Administration"**
2. Wechsle zum Tab **"Monatsabschluss"**
3. Wähle den gewünschten **Monat** und das **Jahr**
4. Prüfe die Übersicht aller Mitarbeiter auf Vollständigkeit
5. Klicke auf **"Monat abschließen"**
6. Bestätige den Abschluss

!!! warning "Unwiderruflich"
    Ein abgeschlossener Monat kann nicht wieder geöffnet werden. Alle Zeitbuchungen und Abwesenheiten in diesem Zeitraum sind danach gesperrt. Stelle sicher, dass alle Einträge korrekt und vollständig sind, bevor du den Monat abschließt.

!!! info "Auswirkung auf Mitarbeiter"
    Nach dem Monatsabschluss können Mitarbeiter für den betroffenen Monat keine Arbeitszeiten mehr erfassen oder ändern. Gesperrte Tage werden in der Zeiterfassung mit einem **Schloss-Symbol** gekennzeichnet.
