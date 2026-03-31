# Kostenstellen verwalten

Diese Seite erklärt, wie Kostenstellen erstellt, bearbeitet und Mitarbeitern zugeordnet werden.

---

## Übersicht

Navigiere zu **"Kostenstellen"** im Bereich **"Administration"** der Seitennavigation. Die Übersicht zeigt alle aktiven und archivierten Kostenstellen.

### Systemkostenstellen

Die folgenden Kostenstellen werden automatisch vom System erstellt und können nicht gelöscht oder umbenannt werden:

| Kostenstelle       | Code   | Verwendung                                      |
|--------------------|--------|--------------------------------------------------|
| **Urlaub**         | `VACAT`| Automatisch gebucht bei genehmigtem Urlaub       |
| **Krankheit**      | `SICK` | Automatisch gebucht bei Krankmeldung             |
| **Sonderurlaub**   | `SPLV` | Automatisch gebucht bei genehmigtem Sonderurlaub |
| **Feiertag**       | `HOLID`| Automatisch gebucht an Feiertagen                |

!!! info "Systemkostenstellen"
    Systemkostenstellen werden bei Abwesenheiten automatisch in der Zeiterfassung gebucht. Sie erscheinen in der Kostenstellenliste, können aber nicht bearbeitet oder gelöscht werden.

---

## Kostenstelle erstellen

1. Klicke auf den Button **"Kostenstelle erstellen"**
2. Fülle die folgenden Felder aus:
    - **Code** (Pflichtfeld) -- Eindeutiger Kurzcode, z.B. "PROJ-A" oder "INT-001"
    - **Name** (Pflichtfeld) -- Beschreibender Name, z.B. "Projekt Alpha"
    - **Beschreibung** (optional) -- Zusätzliche Erläuterung zur Kostenstelle
3. Klicke auf **"Speichern"**

!!! tip "Code-Konventionen"
    Der Code sollte kurz und eindeutig sein. Er wird in Auswertungen und Exporten verwendet und kann nach dem Erstellen nicht mehr geändert werden.

---

## Kostenstelle bearbeiten und deaktivieren

- **Bearbeiten** -- Klicke auf das **Bearbeiten-Symbol** neben einer Kostenstelle, um Name und Beschreibung zu ändern. Der Code kann nachträglich nicht geändert werden.
- **Deaktivieren** -- Deaktivierte Kostenstellen erscheinen nicht mehr in der Auswahl bei der Zeiterfassung, bleiben aber in historischen Buchungen erhalten.

!!! warning "Auswirkungen der Deaktivierung"
    Bereits gebuchte Zeiten auf deaktivierte Kostenstellen bleiben bestehen und werden in Auswertungen weiterhin angezeigt. Neue Buchungen auf diese Kostenstelle sind jedoch nicht mehr möglich.

---

## Archivierung

Kostenstellen werden per **Soft Delete** archiviert und nicht endgültig gelöscht:

- Archivierte Kostenstellen werden in der Liste grau dargestellt
- Historische Buchungen bleiben mindestens **10 Jahre** erhalten
- Archivierte Kostenstellen können bei Bedarf wiederhergestellt werden

---

## Direkte Zuordnung zu Mitarbeitern

Kostenstellen können einzelnen Mitarbeitern direkt zugeordnet werden:

1. Öffne die gewünschte Kostenstelle
2. Wechsle zum Tab **"Mitarbeiter"**
3. Klicke auf **"Mitarbeiter hinzufügen"**
4. Wähle einen oder mehrere Mitarbeiter aus der Liste
5. Klicke auf **"Zuordnen"**

Zugeordnete Mitarbeiter sehen die Kostenstelle in ihrem Dropdown bei der Zeiterfassung.

!!! tip "Massenbearbeitung"
    Für die Zuordnung vieler Mitarbeiter gleichzeitig empfiehlt sich die Verwendung von [Benutzergruppen](user-groups.md).

---

## Benutzergruppen

Neben der direkten Zuordnung können Kostenstellen auch über **Benutzergruppen** zugeordnet werden. Alle Mitglieder einer Gruppe erhalten automatisch Zugriff auf die Kostenstellen der Gruppe.

Weitere Informationen findest du unter [Benutzergruppen](user-groups.md).
