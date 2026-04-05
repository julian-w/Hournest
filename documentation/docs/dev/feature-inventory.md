# Feature-Inventar

Diese Seite beschreibt die wichtigsten Produktbereiche von Hournest in einer Form, die sich gut mit Tests und offenen Lücken abgleichen lässt.

Ziel:

- Features fachlich knapp benennen
- den aktuellen Umsetzungsstand festhalten
- später gegen die Test-Matrix spiegeln

---

## Verwendung

Für jedes größere Feature sollte es idealerweise drei Dinge geben:

1. einen Eintrag in diesem Inventar
2. einen Eintrag in der Test-Matrix
3. bei Teilumsetzung einen klar benannten Gap oder geplanten Ausbau

Wenn eines davon fehlt, ist das ein Signal für Nacharbeit.

---

## Kernfunktionen

| Bereich | Feature | Status | Hinweise |
|---------|---------|--------|----------|
| Auth | OIDC-Login | Implementiert | Standardmodus für produktive Nutzung |
| Auth | Lokaler Login | Implementiert | Mit Passwortwechsel beim ersten Login |
| Auth | Superadmin-Notfallzugang | Implementiert | Immer verfügbar, unabhängig vom OIDC-Modus |
| Dashboard | Persönliche Startseite | Implementiert | Kennzahlen für Resturlaub, offene Anträge und nächste Urlaube; für Admins zusätzlich Team-Status |
| Urlaub | Urlaubsanträge einreichen | Implementiert | Inklusive Kommentar und Validierungen |
| Urlaub | Halbtags-Urlaub | Implementiert | Vormittag/Nachmittag, nur eintägig |
| Urlaub | Offene Anträge stornieren | Implementiert | Nur für eigene Pending-Anträge |
| Urlaub | Genehmigung/Ablehnung durch Admin | Implementiert | Mit Review-Kommentar |
| Urlaub | E-Mail-Benachrichtigungen bei Antrag und Review | Implementiert | Admins erhalten neue Anträge, Mitarbeitende erhalten das Review-Ergebnis |
| Urlaub | Gruppenbasierte Kalendersicht | Implementiert | Mitarbeiter sehen eigene genehmigte Urlaube plus gemeinsame Gruppen |
| Urlaub | Urlaubssperren und Betriebsferien | Implementiert | Serverseitig geprüft |
| Urlaubskonto | Jahresanspruch, Übertrag, Verfall | Implementiert | Über Ledger und Wartungsroutine |
| Urlaubskonto | Manuelle Korrekturen/Bonus | Implementiert | Admin-gesteuert |
| Arbeitszeitkonto | Jahresledger mit Deltas und Korrekturen | Implementiert | Einschließlich Carryover und manueller Anpassungen |
| Feiertage | Feste und variable Feiertage | Implementiert | Variable Feiertage jahresbezogen |
| Arbeitszeitmodelle | Individuelle Arbeitstage | Implementiert | Mit Zeiträumen und Wochenziel |
| Mitarbeiter | Benutzer anlegen, ändern, löschen | Implementiert | Rollen, Urlaubstage, Flags |
| Mitarbeiter | Benutzergruppen | Implementiert | Mitglieder- und Kostenstellenzuordnung |
| Zeiterfassung | Tageserfassung Start/Ende/Pause | Implementiert | Pro Tag ein Eintrag |
| Zeiterfassung | Prozentuale Kostenstellenbuchung | Implementiert | 100-%-Regel, inkl. Halbtagsszenarien |
| Zeiterfassung | Buchungsvorlagen | Implementiert | Eigene Vorlagen pro Nutzer |
| Zeiterfassung | Favoriten | Implementiert | Häufige Kostenstellen speichern |
| Abwesenheiten | Krankheit melden | Implementiert | Inklusive Admin-Bestätigung |
| Abwesenheiten | Sonderurlaub beantragen | Implementiert | Review durch Admin |
| Abwesenheiten | Eigene Abwesenheiten verwalten | Implementiert | Persönliche Übersicht mit Storno für gemeldete/offene Einträge |
| Abwesenheiten | Halbtagsszenarien | Implementiert | Abwesenheiten und Urlaub kombiniert |
| Reports | Zeitbuchungsreport | Implementiert | Gruppierung nach User oder Kostenstelle |
| Reports | Fehlende Einträge | Implementiert | Für Admin-Auswertung |
| Reports | Abwesenheitsreport | Implementiert | Filterbar nach Zeitraum, Mitarbeiter, Typ und Status |
| Reports | CSV-Export | Implementiert | Für Admin-Reports |
| Planung | Schichtplanung | Geplant | Noch nicht umgesetzt |
| Benachrichtigungen | Zusätzliche Kanäle neben E-Mail | Geplant | Z. B. Messenger/WhatsApp |
| Analytics | Erweiterte Analysen | Geplant | Über bestehende Reports hinaus |

---

## Offene Struktur-Regeln

- Neue Endnutzer-Funktion zuerst hier ergänzen
- Danach Test-Matrix ergänzen
- Bei größeren Features Status bewusst wählen: `Implementiert`, `Teilweise`, `Geplant`
- "Teilweise" sollte immer mit einem konkreten fehlenden Aspekt beschrieben werden
