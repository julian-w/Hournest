# Erste Schritte

Diese Anleitung richtet sich an Endanwender von Hournest -- sowohl an Mitarbeiter (Employees) als auch an Administratoren (Admins).

---

## Anmeldung

### SSO-Login (Standard)

1. Oeffne Hournest im Browser
2. Auf der Login-Seite wird prominent der Button **"Sign in with SSO"** angezeigt
3. Klicke auf den Button -- du wirst zum Synology SSO Server weitergeleitet
4. Melde dich mit deinen Synology-Zugangsdaten an
5. Nach erfolgreicher Anmeldung wirst du automatisch zurueck zu Hournest geleitet

!!! info "Erster Login"
    Beim ersten Login wird dein Benutzerkonto automatisch angelegt. Du erhaeltst zunaechst die Rolle **Employee**. Falls deine Email-Adresse in der Admin-Liste hinterlegt ist, erhaeltst du automatisch die Rolle **Admin**.

### Superadmin-Login (Notfallzugang)

Der Superadmin-Login dient als Notfallzugang, falls der SSO Server nicht verfuegbar ist:

1. Klicke auf der Login-Seite auf den Link **"Admin Login"** unterhalb des SSO-Buttons
2. Es klappen Felder fuer Benutzername und Passwort auf
3. Gib die Superadmin-Zugangsdaten ein (werden vom Systemadministrator bereitgestellt)

---

## Oberflaeche im Ueberblick

Nach dem Login gelangst du zum Dashboard. Die Oberflaeche besteht aus folgenden Bereichen:

### Toolbar (oben)

- **Logo und Anwendungsname** (Hournest) -- links
- **Sprach-Umschalter** -- wechselt zwischen Deutsch und Englisch
- **Benutzer-Menue** -- zeigt den angemeldeten Benutzer und den Logout-Button

### Seitennavigation (links)

Die Seitennavigation zeigt die verfuegbaren Bereiche:

**Fuer alle Benutzer:**

- Dashboard
- Kalender
- Meine Urlaube

**Zusaetzlich fuer Admins:**

- Urlaubsanfragen (offene Antraege zur Genehmigung)
- Benutzerverwaltung
- Feiertage verwalten
- Einstellungen

### Inhaltsbereich (Mitte)

Der Hauptbereich zeigt den Inhalt der aktuell gewaehlten Seite.

---

## Was sehen die verschiedenen Rollen?

### Employee (Mitarbeiter)

- **Dashboard:** Eigener Resturlaub, offene Antraege, naechster Urlaub
- **Kalender:** Eigene Urlaube im Monatskalender
- **Meine Urlaube:** Liste aller eigenen Urlaubsantraege mit Status
- **Urlaubskonto:** Eigenes Jahreslog (nur lesen)

### Admin (Administrator)

Alles, was der Employee sieht, plus:

- **Dashboard:** Zu bearbeitende Anfragen aller Mitarbeiter, Team-Status
- **Kalender:** Urlaube aller Mitarbeiter sichtbar
- **Urlaubsanfragen:** Liste aller offenen Antraege mit Genehmigungs-/Ablehnungsfunktion
- **Benutzerverwaltung:** Rollen, Urlaubstage, Arbeitszeitmodelle, Urlaubskonto verwalten
- **Feiertage:** Feiertage anlegen, bearbeiten, loeschen
- **Einstellungen:** Globale Einstellungen (Arbeitstage, Uebertrag, Verfall)

### Superadmin

Hat die gleichen Berechtigungen wie ein Admin. Der Superadmin ist als Notfall-Account konzipiert und wird typischerweise nur verwendet, wenn der SSO Server nicht erreichbar ist.

---

## Sprache umschalten

Die Anwendung unterstuetzt Deutsch und Englisch. Der Sprach-Umschalter befindet sich in der Toolbar oben rechts. Ein Klick wechselt sofort die Sprache aller Texte in der Anwendung -- ohne Neuladen der Seite.

---

## Naechste Schritte

- [Dashboard](dashboard.md) -- Uebersicht ueber die Startseite
- [Kalender](calendar.md) -- Monatskalender verstehen und nutzen
- [Urlaubsantraege](vacations.md) -- Urlaub beantragen, stornieren, genehmigen
- [Urlaubskonto](ledger.md) -- Jahresuebersicht und Buchungstypen
