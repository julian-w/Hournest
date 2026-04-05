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
    Mitarbeiter können für diesen Zeitraum keinen Urlaubsantrag stellen. Die Sperre wird serverseitig geprüft. Bestehende Anträge sind davon nicht betroffen.

### Betriebsferien (Company Holiday)

Betriebsferien bedeuten, dass in dem definierten Zeitraum firmenweit **Urlaub automatisch berücksichtigt** wird.

**Typische Anwendungsfälle:**

- Weihnachts-Betriebsferien (z.B. 24.12. - 31.12.)
- Sommerpause
- Brückentage

!!! info "Urlaubstage"
    Für Arbeitstage im Zeitraum werden Urlaubskonto und Zeiterfassung automatisch angepasst. Zusätzliche Urlaubsanträge für diesen Zeitraum sind nicht nötig und werden blockiert.

---

## Eintrag erstellen

1. Klicke auf den Button **"Eintrag hinzufügen"**
2. Wähle die **Art**:
    - **Urlaubssperre** -- Kein Urlaub erlaubt, keine Tage abgezogen
    - **Betriebsferien** -- Firmenweiter Zwangsurlaub mit automatischer Urlaubswirkung
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
    Das Löschen eines Eintrags hebt die Sperre oder Betriebsferien-Wirkung sofort auf. Mitarbeiter können dann wieder regulär Urlaub für den betroffenen Zeitraum beantragen. Bereits automatisch erzeugte Ledger- und Systembuchungen werden dabei neu berechnet.

---

## Auswirkung auf Urlaubsanträge

Wenn ein Mitarbeiter einen Urlaubsantrag stellt, der in einen konfigurierten Zeitraum fällt, wird Folgendes angezeigt:

| Art              | Verhalten                                                        |
|------------------|------------------------------------------------------------------|
| Urlaubssperre    | Antrag wird **blockiert** -- roter Hinweis, Absenden nicht möglich |
| Betriebsferien   | Urlaub wird automatisch berücksichtigt, zusätzlicher Antrag ist nicht möglich |
