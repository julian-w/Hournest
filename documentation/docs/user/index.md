# Erste Schritte

Diese Anleitung richtet sich an Endanwender von Hournest -- sowohl an Mitarbeiter (Employees) als auch an Administratoren (Admins).

---

## Anmeldung

### SSO-Login (Standard)

1. Öffne Hournest im Browser
2. Auf der Login-Seite wird prominent der Button **"Sign in with SSO"** angezeigt
3. Klicke auf den Button -- du wirst zum SSO Server weitergeleitet
4. Melde dich mit deinen SSO-Zugangsdaten an
5. Nach erfolgreicher Anmeldung wirst du automatisch zurück zu Hournest geleitet

!!! info "Erster Login"
    Beim ersten Login wird dein Benutzerkonto automatisch angelegt. Du erhältst zunächst die Rolle **Employee**. Falls deine Email-Adresse in der Admin-Liste hinterlegt ist, erhältst du automatisch die Rolle **Admin**.

### Superadmin-Login (Notfallzugang)

Der Superadmin-Login dient als Notfallzugang, falls der SSO Server nicht verfügbar ist:

1. Klicke auf der Login-Seite auf den Link **"Admin Login"** unterhalb des SSO-Buttons
2. Es klappen Felder für Benutzername und Passwort auf
3. Gib die Superadmin-Zugangsdaten ein (werden vom Systemadministrator bereitgestellt)

---

## Oberfläche im Überblick

Nach dem Login gelangst du zum Dashboard. Die Oberfläche besteht aus folgenden Bereichen:

### Toolbar (oben)

- **Logo und Anwendungsname** (Hournest) -- links
- **Sprach-Umschalter** -- wechselt zwischen Deutsch und Englisch
- **Benutzer-Menü** -- zeigt den angemeldeten Benutzer und den Logout-Button

### Seitennavigation (links)

Die Seitennavigation zeigt die verfügbaren Bereiche:

**Für alle Benutzer:**

- Dashboard
- Kalender
- Meine Urlaube
- Abwesenheiten
- Zeiterfassung

**Zusätzlich für Admins:**

- Urlaubsanfragen (offene Anträge zur Genehmigung)
- Benutzerverwaltung
- Feiertage verwalten
- Abwesenheiten verwalten
- Kostenstellen
- Benutzergruppen
- Urlaubsplanung
- Einstellungen

### Inhaltsbereich (Mitte)

Der Hauptbereich zeigt den Inhalt der aktuell gewählten Seite.

---

## Was sehen die verschiedenen Rollen?

### Employee (Mitarbeiter)

- **Dashboard:** Eigener Resturlaub, offene Anträge, nächster Urlaub
- **Kalender:** Eigene Urlaube im Monatskalender
- **Meine Urlaube:** Liste aller eigenen Urlaubsanträge mit Status
- **Abwesenheiten:** Krankheit und Sonderurlaub melden oder stornieren
- **Zeiterfassung:** Arbeitszeiten und Kostenstellen-Buchungen pro Woche
- **Urlaubskonto:** Eigenes Jahreslog (nur lesen)

### Admin (Administrator)

Alles, was der Employee sieht, plus:

- **Dashboard:** Zu bearbeitende Anfragen aller Mitarbeiter, Team-Status
- **Kalender:** Urlaube aller Mitarbeiter sichtbar
- **Urlaubsanfragen:** Liste aller offenen Anträge mit Genehmigungs-/Ablehnungsfunktion
- **Benutzerverwaltung:** Rollen, Urlaubstage, Arbeitszeitmodelle, Urlaubskonto verwalten
- **Feiertage:** Feiertage anlegen, bearbeiten, löschen
- **Abwesenheiten:** Meldungen prüfen, genehmigen, bestätigen, selbst anlegen
- **Kostenstellen & Gruppen:** Kostenstellen, Gruppen und direkte Zuweisungen verwalten
- **Urlaubsplanung:** Urlaubssperren und Planungszeiträume verwalten
- **Einstellungen:** Globale Einstellungen (Arbeitstage, Übertrag, Verfall)

### Superadmin

Hat die gleichen Berechtigungen wie ein Admin. Der Superadmin ist als Notfall-Account konzipiert und wird typischerweise nur verwendet, wenn der SSO Server nicht erreichbar ist.

---

## Sprache umschalten

Die Anwendung unterstützt Deutsch und Englisch. Der Sprach-Umschalter befindet sich in der Toolbar oben rechts. Ein Klick wechselt sofort die Sprache aller Texte in der Anwendung -- ohne Neuladen der Seite.

---

## Nächste Schritte

- [Dashboard](dashboard.md) -- Übersicht über die Startseite
- [Kalender](calendar.md) -- Monatskalender verstehen und nutzen
- [Urlaubsanträge](vacations.md) -- Urlaub beantragen, stornieren, genehmigen
- [Abwesenheiten](absences.md) -- Krankheit und Sonderurlaub verwalten
- [Zeiterfassung](time-tracking.md) -- Arbeitszeiten und Kostenstellen buchen
- [Urlaubskonto](ledger.md) -- Jahresübersicht und Buchungstypen
