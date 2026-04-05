# Änderungsprotokoll

Alle nennenswerten Änderungen an Hournest werden auf dieser Seite dokumentiert.

---

## v0.1.1 (2026-04-05)

### Tests & Qualitätssicherung

- Backend-Testabdeckung deutlich ausgebaut auf **400 Tests / 1166 Assertions**
- Neue Feature-Tests für OIDC-Login, Favoriten, Admin-Abwesenheitsverwaltung, Admin-Zeitbuchungen, Jahreswartung und systemübergreifende Regeln
- Frontend-Specs für alle Core-Services ergänzt
- Feature-Komponenten mit Tests abgesichert: Login, Mein Urlaub und Zeiterfassung
- Arbeitszeitkonto mit eigenem Ledger, Admin-Korrekturen und Tests ergänzt
- Arbeitszeitkonto zeigt jetzt auch gutgeschriebene Tage wie Feiertage, Betriebsferien, Urlaub und Abwesenheiten explizit als nachvollziehbare Ledger-Zeilen

### Zeiterfassung & System-Buchungen

- Automatische System-Buchungen für `VACATION`, `ILLNESS`, `SPECIAL_LEAVE` und `HOLIDAY` ergänzt
- Buchungsvorlagen für Mitarbeiter ergänzt: speichern, anwenden, aktualisieren und löschen direkt in der Wochenansicht
- Neue Komfortfunktion `Vortag kopieren`: übernimmt die Verteilung des zuletzt zuvor gebuchten Tages
- Halbtags-Urlaub ergänzt: `0,5` Urlaubstage, `50 %` `VACATION`-Systembuchung und verbleibende `50 %` manuell buchbar
- Volle effektive Abwesenheiten entfernen vorhandene Zeiteinträge und sperren den Tag
- Halbtägige Abwesenheiten erzeugen automatische **50-%-Buchungen**, die übrigen 50 % bleiben manuell buchbar
- Feiertage haben Vorrang vor Urlaub auf demselben Tag; bei Feiertags-Ausnahme bleibt Urlaub regulär buchbar
- Re-Kalkulation beim Löschen oder Verschieben von Feiertagen und beim Entfernen von Abwesenheiten verbessert

### Admin & Validierung

- Favoriten-Reihenfolge wird strenger validiert
- Admin-Zeitbuchungen liefern für unbekannte Benutzer jetzt sauber `404`
- Neue Admin-Reports für aggregierte Zeitbuchungen, fehlende Einträge und CSV-Export
- Blackouts/Betriebsferien jetzt mit echtem Backend-CRUD, serverseitiger Freeze-Prüfung sowie automatischer Wirkung auf Urlaubskonto und Zeiterfassung
- Zusätzliche Negativpfade und Sperrregeln für Auto-Lock und Überschneidungen abgesichert

---

## v0.1.0 (2026-03-26)

### Erstveröffentlichung

- Dashboard mit Resturlaub, offenen Anfragen und nächstem geplantem Urlaub
- Monatskalender mit Navigation und Statusfarben
- Urlaubsanträge, Urlaubskonto und Feiertagsverwaltung
- Arbeitszeitmodelle, Rollen, OIDC und Superadmin-Zugang
- Zweisprachigkeit, API-Dokumentation, Mock-Modus und Responsive Design
