# Hournest -- Gesamtkonzept

## 1. Rollen & Authentifizierung

### Rollen

| Rolle | Zugang | Bestimmung |
|-------|--------|-----------|
| **Employee** | OpenID SSO (Synology) | Automatisch bei erstem Login |
| **Admin** | OpenID SSO (Synology) | Email in Konfigurationsliste (`ADMIN_EMAILS` in `.env`) |
| **Superadmin** | Benutzername + Passwort | Credentials in `.env` (`SUPERADMIN_USERNAME`, `SUPERADMIN_PASSWORD`), Notfall-Zugang ohne SSO |

### Login-Flow

- **Standard:** Login-Seite zeigt prominent "Sign in with SSO"-Button -> OpenID-Redirect -> Account wird automatisch angelegt/aktualisiert
- **Admin-Erkennung:** Bei jedem SSO-Login wird geprüft ob die Email in `ADMIN_EMAILS` steht -> Rolle = Admin, sonst Employee
- **Superadmin:** Unter dem SSO-Button ein Link "Admin Login" -> klappt Benutzername/Passwort-Felder auf. Funktioniert ohne OpenID.
- **Passwort vergessen:** Nicht vorgesehen (SSO-Zugang wird extern verwaltet, Superadmin-Credentials in `.env`)

---

## 2. Dashboard (Startseite nach Login)

### Alle Mitarbeiter
- Resturlaub (verbleibende Tage im aktuellen Jahr)
- Offene eigene Anfragen (Pending)
- Nächster geplanter Urlaub

### Admin zusätzlich
- Zu bearbeitende Urlaubsanfragen (Pending von allen Mitarbeitern)
- Team-Status (wer ist heute/diese Woche abwesend)

---

## 3. Kalender

### Monatsansicht
- Navigation: Monat vor/zurück, "Heute"-Button
- Farbliche Hervorhebung:
  - **Wochenenden:** Grau hinterlegt
  - **Feiertage:** Markiert/hervorgehoben
  - **Urlaube:** Farblich nach Status unterschieden (Pending, Approved, Rejected)

### Sichtbarkeit
- **Phase 1:** Mitarbeiter sieht nur eigenen Urlaub, Admin sieht alle
- **Phase 2:** Gruppen -- innerhalb einer Gruppe sieht jeder die Urlaube der anderen Gruppenmitglieder

---

## 4. Urlaubsanträge

### Antrag stellen
- Felder: Von-Datum, Bis-Datum, Kommentar (optional)
- Validierung:
  - Kein Urlaub in der Vergangenheit
  - End-Datum >= Start-Datum
  - Keine Überlappung mit eigenen genehmigten Urlauben

### Bearbeitung durch Admin
- Genehmigen oder Ablehnen
- Kommentarfeld bei Genehmigung/Ablehnung
- E-Mail-Benachrichtigung an den Mitarbeiter

### Stornierung
- Mitarbeiter kann Pending-Anträge selbst zurückziehen

---

## 5. Urlaubskonto (Jahreslog)

Pro Mitarbeiter und Jahr eine vollständige Liste aller Buchungen:

| Typ | Beispiel | Tage |
|-----|---------|------|
| Jahresanspruch | Grundanspruch 2026 | +30 |
| Übertrag | Resturlaub aus 2025 | +3 |
| Sonderurlaub | Extra-Tag für Firmenevent | +1 |
| Urlaub genommen | Genehmigt: 06.04.-10.04.2026 | -5 |
| | | **= 29 Resttage** |

- Jede Buchung hat einen **Kommentar**, sodass alles nachvollziehbar ist
- **Sonderurlaub / Extra-Tage:** Nur Admin kann diese Buchungen anlegen
- Mitarbeiter sieht das Log als Jahresübersicht (**read-only**, kein Kommentieren/Anfechten)

### Resturlaub-Übertrag
- **Automatisch** am 01.01. des Folgejahres: Resttage werden als "Übertrag"-Buchung ins neue Jahr geschrieben
- **Verfall konfigurierbar (Admin):**
  - Verfallsdatum festlegbar (z.B. "Resturlaub verfällt am 31.03.") -- nach diesem Datum werden übertragene Tage als verfallen gebucht
  - Oder: unbegrenzt haltbar (kein Verfall)
  - Globale Einstellung, gilt für alle Mitarbeiter

---

## 6. Feiertage

### Verwaltung (Admin)
- Zwei Typen:
  - **Fix:** Immer am gleichen Datum (z.B. 1. Januar, 3. Oktober)
  - **Variabel:** Jedes Jahr an einem anderen Datum (z.B. Ostermontag, Christi Himmelfahrt)
- Admin pflegt Feiertage über eine Liste im Admin-Bereich
- Variable Feiertage müssen jährlich eingetragen oder per Formel berechnet werden

### Auswirkung
- Feiertage werden bei der Urlaubstage-Berechnung **nicht** als Urlaubstag gezählt
- **Ausnahme:** Mitarbeiter mit Flag "Feiertage gelten nicht" -- bei diesen zählen Feiertage als normale Arbeitstage

---

## 7. Arbeitstage-Konfiguration

### Globale Einstellung (Admin)
- Festlegung ob Sa/So standardmäßig frei oder Arbeitstage sind

### Pro Mitarbeiter
- **Standard:** Es gelten die globalen Einstellungen (z.B. Mo-Fr)
- **Individuell:** Arbeitstage-Perioden mit Zeitraum
  - Beispiel Brückenteilzeit: "01.07.-31.12.2026: nur Mi+Do"
  - Wenn keine Periode definiert ist, gelten die globalen Einstellungen
  - Perioden können zeitlich befristet sein
- **Wochenend-Ausnahme:** Einzelne Mitarbeiter können Sa/So als Arbeitstage haben, auch wenn global frei

### Auswirkung auf Urlaubsberechnung
- Urlaubstage werden nur für individuelle Arbeitstage des Mitarbeiters gezählt
- Beispiel: Mitarbeiter arbeitet nur Mi+Do -> 1 Woche Urlaub = 2 Urlaubstage

---

## 8. Mitarbeiter-Verwaltung (Admin)

### Übersicht
- Liste aller Mitarbeiter mit: Name, Email, Rolle, Urlaubstage/Jahr, Resturlaub

### Bearbeitbar
- Rolle (Employee/Admin)
- Urlaubstage pro Jahr, **jahresweise anpassbar** (z.B. 2026: 30, 2027: 28)
- Individuelle Arbeitstage (Perioden)
- Feiertage-Ausnahme (Checkbox)
- Wochenend-Ausnahme
- Sonderurlaub-Buchungen mit Kommentar

---

## 9. Benachrichtigungen

### Phase 1: E-Mail
- Mitarbeiter wird benachrichtigt bei: Genehmigung, Ablehnung
- Admin wird benachrichtigt bei: Neuer Urlaubsantrag

### Phase 2: Weitere Kanäle
- WhatsApp oder ähnliche Messenger
- System ist abstrakt gehalten (Laravel Notification System), sodass neue Kanäle einfach hinzugefügt werden können

---

## 10. Internationalisierung (i18n)

- **Deutsch + Englisch** umschaltbar zur Laufzeit
- Sprach-Umschalter im Toolbar
- Frontend-seitig via `ngx-translate` (Runtime-Switching, kein separater Build)
- Backend liefert nur Daten-Keys, keine übersetzten Texte

---

## 11. Technische Architektur

### Tech Stack
- **Frontend:** Angular 18+, Angular Material, SCSS, ngx-translate
- **Backend:** Laravel 11+, PHP 8.2+, Laravel Sanctum (SPA Auth)
- **Datenbank:** SQLite (Dev/Test), MySQL/PostgreSQL (Produktion) -- frei wählbar über `.env`
- **Auth:** OpenID Connect (Synology SSO) + lokaler Superadmin-Login
- **API-Doku:** Scramble (auto-generierte OpenAPI-Spec unter `/docs/api`)

### Responsive
- Desktop + Tablet + Mobile (responsive, keine PWA)

---

## 12. Phasen-Planung

### Phase 1 (aktuell)
- Login (SSO + Superadmin)
- Dashboard
- Kalender (Monatsansicht)
- Urlaubsanträge (stellen, stornieren, genehmigen, ablehnen)
- Urlaubskonto mit Jahreslog
- Feiertage-Verwaltung
- Mitarbeiter-Verwaltung (Arbeitstage, Urlaubstage, Rollen)
- E-Mail-Benachrichtigungen
- i18n (DE/EN)

### Phase 2 (geplant)
- Gruppen-Sichtbarkeit im Kalender
- Weitere Benachrichtigungskanäle (WhatsApp etc.)
- Zeiterfassung / Stundenbuchung
- Einsatz- & Schichtplanung
- Auswertungen & Reports
