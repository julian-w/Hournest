# Urlaubsplanung

Die Urlaubsplanung ermöglicht es Admins, firmenweite Zeiträume festzulegen, in denen besondere Urlaubsregeln gelten. Es gibt zwei Modi:

---

## Übersicht

Die Seite zeigt eine Tabelle aller konfigurierten Zeiträume mit folgenden Spalten:

| Spalte   | Beschreibung                                      |
|----------|---------------------------------------------------|
| Art      | Urlaubssperre oder Betriebsferien                 |
| Von      | Startdatum des Zeitraums                          |
| Bis      | Enddatum des Zeitraums                            |
| Grund    | Freitextfeld mit dem Grund (z.B. "Inventur")      |
| Aktionen | Bearbeiten und Löschen                            |

---

## Zwei Modi

### Urlaubssperre (Freeze)

Eine Urlaubssperre bedeutet, dass in dem definierten Zeitraum **kein Urlaub genommen werden darf**. Es werden keine Urlaubstage abgezogen.

**Typische Anwendungsfälle:**

- Inventurzeiträume
- Projektdeadlines
- Messewochen

!!! warning "Auswirkung"
    Mitarbeiter können für diesen Zeitraum keinen Urlaubsantrag stellen. Bestehende Anträge sind davon nicht betroffen.

### Betriebsferien (Company Holiday)

Betriebsferien bedeuten, dass in dem definierten Zeitraum **alle Mitarbeiter Urlaub haben**. Die Urlaubstage werden automatisch vom Urlaubskonto abgezogen.

**Typische Anwendungsfälle:**

- Weihnachts-Betriebsferien (z.B. 24.12. - 31.12.)
- Sommerpause
- Brückentage

!!! info "Urlaubstage"
    Bei Betriebsferien werden die Urlaubstage automatisch von jedem Mitarbeiter abgezogen. Im Urlaubsantrag-Dialog wird eine Warnung angezeigt, aber der Antrag ist nicht blockiert.

---

## Eintrag erstellen

1. Klicke auf den Button **"Eintrag hinzufügen"**
2. Wähle die **Art**:
    - **Urlaubssperre** -- Kein Urlaub erlaubt, keine Tage abgezogen
    - **Betriebsferien** -- Zwangsurlaub, Tage werden automatisch abgezogen
3. Setze das **Von-Datum** und **Bis-Datum**
4. Gib einen **Grund** ein (z.B. "Inventur" oder "Betriebsferien Weihnachten")
5. Klicke auf **"Speichern"**

---

## Eintrag bearbeiten

1. Klicke auf das **Bearbeiten-Symbol** (Stift) neben dem Eintrag
2. Ändere die gewünschten Felder (Art, Zeitraum, Grund)
3. Klicke auf **"Speichern"**

---

## Eintrag löschen

1. Klicke auf das **Löschen-Symbol** (Mülleimer) neben dem Eintrag
2. Der Eintrag wird sofort entfernt

!!! warning "Achtung"
    Das Löschen eines Eintrags hebt die Sperre sofort auf. Mitarbeiter können dann wieder Urlaub für den betroffenen Zeitraum beantragen.

---

## Auswirkung auf Urlaubsanträge

Wenn ein Mitarbeiter einen Urlaubsantrag stellt, der in einen konfigurierten Zeitraum fällt, wird Folgendes angezeigt:

| Art              | Verhalten                                                        |
|------------------|------------------------------------------------------------------|
| Urlaubssperre    | Antrag wird **blockiert** -- roter Hinweis, Absenden nicht möglich |
| Betriebsferien   | **Warnung** wird angezeigt (orange), Antrag bleibt möglich       |
