# Benutzergruppen

Diese Seite erklärt, wie Benutzergruppen erstellt und zur effizienten Zuordnung von Kostenstellen verwendet werden.

---

## Übersicht

Benutzergruppen ermöglichen es, mehrere Mitarbeiter zusammenzufassen und ihnen gemeinsam Kostenstellen zuzuordnen. Navigiere zu **"Benutzergruppen"** im Bereich **"Administration"** der Seitennavigation.

!!! info "Zweck von Benutzergruppen"
    Statt jede Kostenstelle jedem Mitarbeiter einzeln zuzuordnen, können Gruppen gebildet werden (z.B. "Entwicklung", "Vertrieb", "Verwaltung"). Alle Mitglieder einer Gruppe sehen automatisch alle Kostenstellen, die der Gruppe zugeordnet sind.

---

## Gruppe erstellen

1. Klicke auf den Button **"Gruppe erstellen"**
2. Fülle die folgenden Felder aus:
    - **Name** (Pflichtfeld) -- Eindeutiger Gruppenname, z.B. "Team Entwicklung"
    - **Beschreibung** (optional) -- Erläuterung zum Zweck der Gruppe
3. Klicke auf **"Speichern"**

---

## Mitglieder hinzufügen und entfernen

### Mitglieder hinzufügen

1. Öffne die gewünschte Gruppe
2. Wechsle zum Tab **"Mitglieder"**
3. Klicke auf **"Mitglied hinzufügen"**
4. Wähle einen oder mehrere Mitarbeiter aus der Liste
5. Klicke auf **"Hinzufügen"**

### Mitglieder entfernen

1. Öffne die gewünschte Gruppe
2. Wechsle zum Tab **"Mitglieder"**
3. Klicke auf das **Entfernen-Symbol** neben dem Mitarbeiter
4. Bestätige die Entfernung

!!! warning "Auswirkung auf Kostenstellen"
    Wenn ein Mitarbeiter aus einer Gruppe entfernt wird, verliert er sofort den Zugriff auf die Kostenstellen, die ausschließlich über diese Gruppe zugeordnet waren. Bereits gebuchte Zeiten bleiben jedoch erhalten.

---

## Kostenstellen zuordnen

1. Öffne die gewünschte Gruppe
2. Wechsle zum Tab **"Kostenstellen"**
3. Klicke auf **"Kostenstelle zuordnen"**
4. Wähle eine oder mehrere Kostenstellen aus der Liste
5. Klicke auf **"Zuordnen"**

Zugeordnete Kostenstellen können jederzeit wieder entfernt werden, indem das **Entfernen-Symbol** neben der Kostenstelle angeklickt wird.

---

## Auswirkung auf die Zeiterfassung

Mitarbeiter sehen in der Zeiterfassung alle Kostenstellen, die ihnen zugeordnet sind -- sowohl direkte Zuordnungen als auch Kostenstellen aus allen Gruppen, denen sie angehören.

| Zuordnungsart       | Beispiel                                         |
|----------------------|--------------------------------------------------|
| **Direkt**           | Kostenstelle "Sonderprojekt" direkt dem Mitarbeiter zugeordnet |
| **Über Gruppe**      | Mitarbeiter ist in Gruppe "Entwicklung", die Kostenstelle "INT-DEV" ist der Gruppe zugeordnet |
| **Kombiniert**       | Mitarbeiter sieht sowohl direkte als auch gruppenbasierte Kostenstellen |

!!! tip "Empfehlung"
    Verwende Benutzergruppen für allgemeine Kostenstellen (z.B. interne Projekte, Abteilungen) und direkte Zuordnungen nur für individuelle oder temporäre Kostenstellen.

---

## Gruppe bearbeiten und löschen

- **Bearbeiten** -- Klicke auf das **Bearbeiten-Symbol**, um Name und Beschreibung der Gruppe zu ändern
- **Löschen** -- Eine Gruppe kann nur gelöscht werden, wenn sie keine Mitglieder mehr hat. Entferne zuerst alle Mitglieder, bevor du die Gruppe löschst.

!!! warning "Löschen nicht rückgängig machbar"
    Das Löschen einer Gruppe kann nicht rückgängig gemacht werden. Die Mitarbeiter verlieren den Zugriff auf die Kostenstellen, die über diese Gruppe zugeordnet waren.
