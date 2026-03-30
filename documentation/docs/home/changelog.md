# Änderungsprotokoll

Alle nennenswerten Änderungen an Hournest werden auf dieser Seite dokumentiert.

---

## v0.1.0 (2026-03-26)

### Erstveröffentlichung

**Dashboard**

- Dashboard mit Resturlaub, offenen Anfragen und nächstem geplantem Urlaub
- Admin-Sicht mit zu bearbeitenden Anfragen und Team-Status

**Kalender**

- Monatskalender mit Navigation (vor/zurück, Heute-Button)
- Farbliche Hervorhebung von Feiertagen und Urlauben nach Status
- Wochenenden grau hinterlegt

**Urlaubsanträge**

- Urlaubsanträge stellen mit Von-/Bis-Datum und optionalem Kommentar
- Stornierung offener Anträge durch Mitarbeiter
- Genehmigung und Ablehnung durch Admins mit Kommentar
- Validierung: keine Vergangenheitsdaten, keine Überlappung

**Urlaubskonto**

- Jahreslog mit Anspruch, Übertrag, Sonderurlaub, genommenen Tagen und Verfall
- Automatischer Resturlaub-Übertrag mit konfigurierbarem Verfallsdatum
- Sonderurlaub- und Anpassungsbuchungen durch Admin

**Feiertage**

- Verwaltung fixer und variabler Feiertage
- Feiertage werden bei der Urlaubstage-Berechnung berücksichtigt
- Feiertage-Ausnahme-Flag pro Mitarbeiter

**Arbeitszeitmodelle**

- Individuelle Arbeitszeitmodelle pro Mitarbeiter mit Zeiträumen
- Globale Standard-Arbeitstage (konfigurierbar)
- Wochenend-Arbeiter-Flag

**Authentifizierung und Rollen**

- OpenID Connect Login (beliebiger OIDC-Provider)
- Superadmin-Notfallzugang mit lokalen Credentials
- Drei Rollen: Employee, Admin, Superadmin
- Automatische Rollenzuweisung basierend auf Admin-Email-Liste

**Sonstiges**

- Zweisprachig: Deutsch und Englisch (umschaltbar zur Laufzeit)
- Auto-generierte API-Dokumentation (OpenAPI/Scramble)
- Mock-Modus für Frontend-Entwicklung ohne Backend
- 28 Backend-Tests (PHPUnit)
- Responsive Design (Desktop, Tablet, Mobile)
