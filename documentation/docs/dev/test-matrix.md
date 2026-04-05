# Test-Matrix

Diese Matrix verbindet Produktfeatures mit vorhandenen Tests. Sie soll keine Zeile-für-Zeile-Abdeckung ersetzen, sondern helfen, fachliche Testlücken schnell zu erkennen.

Legende:

- `Stark` = mehrere gezielte Tests, inkl. Randfälle oder Berechnungslogik
- `Mittel` = zentrale Fälle sind abgedeckt, Randfälle vermutlich nicht vollständig
- `Leicht` = nur Teilaspekte oder eher Vertrags-/Smoke-Tests
- `Keine bekannte Abdeckung` = derzeit kein klarer Testanker dokumentiert

---

## Produktfeatures und Testanker

| Bereich | Feature | Backend-Tests | Frontend-Specs | Einschätzung | Hinweise / mögliche Lücke |
|---------|---------|---------------|----------------|--------------|----------------------------|
| Auth | Lokaler Login, Logout, Passwortwechsel | `AuthTest` | `login.component.spec.ts` | Stark | UI-Flow und API-Flow vorhanden |
| Auth | OIDC-Login und Provisionierung | `AuthOidcTest` | Keine bekannte Abdeckung | Mittel | Frontend-seitig kaum relevant, aber UI-Trigger kaum dokumentiert |
| Dashboard | Persönliche Startseite mit Kennzahlen | Keine bekannte Abdeckung | `dashboard.component.spec.ts` | Mittel | Nutzer- und Admin-Varianten der Startseite sind jetzt als UI-Flow abgesichert |
| Urlaub | Antrag, Validierung, Storno | `VacationTest` | `my-vacations.component.spec.ts` | Stark | Gute End-to-End-Nähe |
| Urlaub | Halbtags-Urlaub | `VacationTest`, `CrossSystemTest` | `my-vacations.component.spec.ts`, `time-tracking.component.spec.ts` | Stark | Gute Systemabdeckung |
| Urlaub | E-Mail-Benachrichtigungen bei Antrag und Review | `VacationTest`, `AdminTest` | Keine bekannte Abdeckung | Mittel | Backend-seitig für Admin-Hinweis bei Antrag und Mitarbeiter-Hinweis bei Review abgesichert |
| Urlaub | Gruppenbasierte Kalendersicht | `VacationTest` | `calendar.component.spec.ts` | Stark | Backend-Regel und sichtbarer UI-Hinweis sind beide abgesichert |
| Urlaub | Admin-Review offener Anträge | `AdminTest` | `admin-requests.component.spec.ts` | Stark | Review-Logik und zentrale UI-Aktionen sind jetzt beide abgesichert |
| Urlaubskonto | Ledger-Einträge, Resturlaub, Korrekturen | `VacationLedgerTest`, `YearlyMaintenanceTest` | `my-vacations.component.spec.ts` | Stark | Fachlich gut abgesichert |
| Arbeitszeitkonto | Delta-Berechnung und Ledger | `WorkTimeAccountTest`, `CrossSystemTest` | `time-tracking.component.spec.ts` | Stark | Gute Regelabdeckung |
| Feiertage | Verwaltung und Filter | `HolidayTest` | `holiday.service.spec.ts`, `admin-holidays.component.spec.ts` | Stark | Backend, Service und zentrale Admin-UI-Pfade sind abgesichert |
| Einstellungen | Globale Konfigurationen | `SettingTest` | `settings.service.spec.ts`, `admin-settings.component.spec.ts` | Stark | Backend, Service und Speichern/Laden in der Admin-UI sind abgedeckt |
| Arbeitszeitmodelle | Individuelle Arbeitstage und Wochenziel | `WorkScheduleTest`, `WorkTimeAccountTest` | `work-schedule.service.spec.ts`, `time-tracking.component.spec.ts` | Stark | Gute Backend-Abdeckung |
| Blackouts | Urlaubssperren und Betriebsferien | `BlackoutTest`, `CrossSystemTest` | `blackout.service.spec.ts`, `time-tracking.component.spec.ts`, `admin-blackouts.component.spec.ts` | Stark | Kritische Regeln plus zentrale Admin-UI-Pfade sind abgedeckt |
| Zeiterfassung | Tageserfassung und Sperren | `TimeEntryTest` | `time-tracking.component.spec.ts` | Stark | Gute Business-Regel-Abdeckung |
| Zeiterfassung | Prozentbuchungen | `TimeBookingTest` | `time-tracking.component.spec.ts` | Stark | Kernlogik sowie wichtige Save-/Fehlerpfade im UI sind gut abgesichert |
| Zeiterfassung | Vorlagen | `TimeBookingTemplateTest` | `time-tracking.component.spec.ts`, `time-booking-template.service.spec.ts` | Stark | Gute funktionale Abdeckung |
| Kostenstellen | CRUD und Systemschutz | `CostCenterTest` | `cost-center.service.spec.ts`, `admin-cost-centers.component.spec.ts` | Stark | Backend, Service und zentrale Admin-UI-Pfade sind jetzt abgesichert |
| Kostenstellen | Favoriten | `CostCenterFavoriteTest` | `cost-center.service.spec.ts`, `time-tracking.component.spec.ts` | Stark | Service, Backend und sichtbare Reihenfolge im Zeiterfassungs-Grid sind abgedeckt |
| Benutzergruppen | Gruppen, Mitglieder, Kostenstellen | `UserGroupTest` | `admin.service.spec.ts`, `admin-user-groups.component.spec.ts` | Stark | Backend, Service und zentrale UI-Workflows sind abgesichert |
| Mitarbeiter | Benutzer anlegen, ändern, löschen | `AdminTest` | `admin.service.spec.ts`, `admin-users.component.spec.ts` | Stark | Kritische Admin-Workflows sind jetzt auch in der UI sichtbar getestet |
| Abwesenheiten | Krankheit, Sonderurlaub, Halbtag | `AbsenceTest`, `AbsenceAdminManagementTest`, `CrossSystemTest` | `absence.service.spec.ts`, `my-absences.component.spec.ts`, `admin-absences.component.spec.ts`, `time-tracking.component.spec.ts` | Stark | Domänenlogik plus persönliche und administrative Oberflächen sind jetzt direkt abgedeckt |
| Reports | Zeitbuchungen, Fehlende Einträge, Abwesenheiten und Export | `AdminReportTest` | `admin-reports.component.spec.ts`, `admin.service.spec.ts` | Stark | Gute Report-Abdeckung inklusive Abwesenheitsreport |
| Sicherheit | Security Header, Rollen, Schutzregeln | `SecurityTest` | Keine bekannte Abdeckung | Mittel | Frontend hier kaum relevant |

---

## Sichtbare Testlücken

Diese Punkte wirken nach aktuellem Stand am ehesten ausbaufähig:

- Einige Spezialoberflächen sind weiterhin eher über Services als direkt als UI-Komponente abgesichert.
- Weitere ergänzende Nutzerflüsse in der Zeiterfassung oder seltenere Randpfade wirken jetzt als nächste Kandidaten für zusätzliche UI-Abdeckung.

---

## Pflege-Regel

Wenn ein neues Fachfeature eingebaut wird:

1. im Feature-Inventar eintragen
2. in dieser Matrix den Testanker ergänzen
3. fehlende Tests bewusst als Lücke notieren statt stillschweigend offen zu lassen
