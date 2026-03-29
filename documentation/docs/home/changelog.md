# Aenderungsprotokoll

Alle nennenswerten Aenderungen an Hournest werden auf dieser Seite dokumentiert.

---

## v0.1.0 (2026-03-26)

### Erstveroeffentlichung

**Dashboard**

- Dashboard mit Resturlaub, offenen Anfragen und naechstem geplantem Urlaub
- Admin-Sicht mit zu bearbeitenden Anfragen und Team-Status

**Kalender**

- Monatskalender mit Navigation (vor/zurueck, Heute-Button)
- Farbliche Hervorhebung von Feiertagen und Urlauben nach Status
- Wochenenden grau hinterlegt

**Urlaubsantraege**

- Urlaubsantraege stellen mit Von-/Bis-Datum und optionalem Kommentar
- Stornierung offener Antraege durch Mitarbeiter
- Genehmigung und Ablehnung durch Admins mit Kommentar
- Validierung: keine Vergangenheitsdaten, keine Ueberlappung

**Urlaubskonto**

- Jahreslog mit Anspruch, Uebertrag, Sonderurlaub, genommenen Tagen und Verfall
- Automatischer Resturlaub-Uebertrag mit konfigurierbarem Verfallsdatum
- Sonderurlaub- und Anpassungsbuchungen durch Admin

**Feiertage**

- Verwaltung fixer und variabler Feiertage
- Feiertage werden bei der Urlaubstage-Berechnung beruecksichtigt
- Feiertage-Ausnahme-Flag pro Mitarbeiter

**Arbeitszeitmodelle**

- Individuelle Arbeitszeitmodelle pro Mitarbeiter mit Zeitraeumen
- Globale Standard-Arbeitstage (konfigurierbar)
- Wochenend-Arbeiter-Flag

**Authentifizierung und Rollen**

- OpenID Connect Login ueber Synology SSO Server
- Superadmin-Notfallzugang mit lokalen Credentials
- Drei Rollen: Employee, Admin, Superadmin
- Automatische Rollenzuweisung basierend auf Admin-Email-Liste

**Sonstiges**

- Zweisprachig: Deutsch und Englisch (umschaltbar zur Laufzeit)
- Auto-generierte API-Dokumentation (OpenAPI/Scramble)
- Mock-Modus fuer Frontend-Entwicklung ohne Backend
- 28 Backend-Tests (PHPUnit)
- Responsive Design (Desktop, Tablet, Mobile)
