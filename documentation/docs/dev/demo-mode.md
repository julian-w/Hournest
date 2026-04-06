# Demo-Modus

Diese Seite dokumentiert den technischen Demo-Modus von Hournest. Sie richtet sich bewusst an Entwickler und Betreiber, nicht an Endanwender.

## Ziel

Der Demo-Modus ist ein echter Betriebsmodus des Backends. Er dient dazu, eine öffentliche oder interne Vorschau von Hournest mit realistischen, datumsrelativen Daten bereitzustellen, ohne sensible Schreiboperationen offen zu lassen.

Die wichtigsten Ziele:

- vorzeigbare Daten relativ zum aktuellen oder einem festen Referenzdatum
- serverseitiger Schutz für sensible Änderungen
- regelmäßiger Reset der Demo-Datenbank
- Wiederverwendbarkeit für E2E-Tests, spätere Docker-Setups und komplexere Testdaten

## Architektur

Der Demo-Modus besteht aus vier Bausteinen:

1. `backend/config/demo.php`
2. `backend/app/Http/Middleware/EnsureDemoActionAllowed.php`
3. `backend/app/Demo/DemoScenarioBuilder.php`
4. `php artisan hournest:demo:refresh`

Zusätzlich meldet `/api/auth/config` an das Frontend, ob Demo aktiv ist und ob Passwortwechsel erlaubt sind. Das Frontend zeigt daraufhin einen globalen Banner und blendet gesperrte Aktionen wie den Passwort-Button aus.

## Wichtige Umgebungsvariablen

Minimaler Demo-Betrieb:

```env
APP_ENV=demo
AUTH_OAUTH_ENABLED=false
DEMO_ENABLED=true
DEMO_REFERENCE_DATE=now
DEMO_DATASET_VARIANT=standard
DEMO_LOGIN_PASSWORD=public-demo-password
DEMO_NOTICE=Public demo preview
DEMO_ALLOW_PASSWORD_CHANGE=false
DEMO_ALLOW_USER_MANAGEMENT=false
DEMO_ALLOW_GLOBAL_SETTINGS_WRITE=false
DEMO_ALLOW_HOLIDAY_WRITE=false
DEMO_ALLOW_BLACKOUT_WRITE=false
```

Wichtige Sicherheitsvariablen:

```env
DEMO_REQUIRE_DEDICATED_DATABASE=true
DEMO_ALLOW_DEFAULT_PASSWORDS=false
DEMO_LOGIN_PASSWORD=public-demo-password
```

Wichtig:

- `AUTH_OAUTH_ENABLED=false` ist im Demo-Modus Pflicht.
- Demo-Modus und OAuth/OIDC dürfen nicht parallel betrieben werden.
- Das Demo-Passwort ist absichtlich nicht geheim und darf im Login-UI angezeigt werden.

## Sicherheitsgeländer

### Mutierende Endpunkte werden serverseitig geschützt

Schreibende Aktionen wie Passwortwechsel, Benutzerverwaltung, Feiertage, Blackouts, globale Einstellungen, Zeitbuchungen, Favoriten, Templates und Admin-Reviews werden über Demo-Middleware abgesichert.

Wichtig:

- Der Schutz liegt im Backend und ist nicht nur eine UI-Ausblendung.
- Selbst direkte API-Requests bekommen im Demo-Modus einen `403` mit `demo_blocked=true`.

### Demo-Start mit Standardpasswörtern schlägt fehl

Wenn Hournest mit `DEMO_ENABLED=true` in einer echten Demo-Umgebung startet, verweigert die Anwendung den Start, falls weiterhin `demo-password` als Demo-Login-Passwort verwendet wird.

Ausnahme:

- In `local`, `testing` und `e2e` sind diese Checks absichtlich gelockert.
- Für lokale Experimente kannst du zusätzlich `DEMO_ALLOW_DEFAULT_PASSWORDS=true` setzen.

### Dedizierte Demo-Datenbank wird erzwungen

In strikten Demo-Umgebungen erwartet Hournest eine separate Datenbank mit einem Namen oder Pfad, der `demo` oder `e2e` enthält.

Beispiele:

- `backend/database/demo.sqlite`
- `backend/database/e2e-demo.sqlite`
- `hournest_demo`

### OAuth ist im Demo-Modus verboten

Wenn `DEMO_ENABLED=true` ist, erwartet Hournest zwingend `AUTH_OAUTH_ENABLED=false`.

Gründe:

- eine öffentliche Demo braucht keinen externen Identity-Provider
- das Login soll reproduzierbar und ohne Zusatzsysteme funktionieren
- die Demo-Zugangsdaten werden absichtlich offen im UI und in `/api/auth/config` bereitgestellt

### `hournest:demo:refresh` ist absichtlich eingeschränkt

Der Command läuft standardmäßig nur mit:

- `DEMO_ENABLED=true`
- `APP_ENV=demo`
- dedizierter Demo-Datenbank

Ein bewusster Override ist nur mit `--force-demo` möglich.

## Demo-Refresh

Grundlegender Ablauf:

```bash
cd backend
php artisan hournest:demo:refresh
```

Mit festem Referenzdatum:

```bash
php artisan hournest:demo:refresh --reference-date=2026-04-06
```

Mit dichterem Showcase-Datensatz:

```bash
php artisan hournest:demo:refresh --dataset-variant=full
```

Der Refresh-Command führt intern ein `migrate:fresh` mit dem Demo-Seeder aus. Das ist gewollt destruktiv und deshalb mit den oben beschriebenen Sicherheitsgeländern versehen.

## Scheduler

Wenn `DEMO_REFRESH_CRON` gesetzt ist, registriert der Scheduler automatisch periodische Demo-Resets.

```env
DEMO_REFRESH_CRON=*/30 * * * *
```

Dann reicht ein laufendes:

```bash
php artisan schedule:work
```

Dieses Muster ist bewusst so gebaut, dass es später in einem separaten Scheduler-Prozess, zum Beispiel in Docker, wiederverwendet werden kann.

## Frontend-Verhalten

Das Frontend liest `/api/auth/config` und reagiert auf:

- `data.demo.enabled`
- `data.demo.notice`
- `data.demo.reference_date`
- `data.demo.password_change_allowed`
- `data.demo.login.shared_password`
- `data.demo.login.users`

Aktuelles Verhalten:

- globaler Demo-Banner auf öffentlichen und eingeloggten Seiten
- Passwort-Button wird ausgeblendet, wenn Demo-Passwortwechsel deaktiviert ist
- Login-Seite zeigt das gemeinsame Demo-Passwort und die verfügbaren Demo-Nutzer offen an
- Login-Layout berücksichtigt den Banner-Abstand, damit nichts überlappt

## Demo-Daten

Die Demo-Daten stammen aus `DemoScenarioBuilder` und sind relativ zu `DEMO_REFERENCE_DATE`.

Es gibt zwei Varianten:

- `standard`: kompakter Datensatz mit garantierter Mindestabdeckung aller wichtigen Stati, Scopes und Kernmodule
- `full`: dichterer Showcase-Datensatz mit zusätzlichen Urlaubs-, Abwesenheits-, Vorlagen-, Buchungs- und Lock-Fällen

### Abdeckungszusage

Im `standard`-Datensatz kommt jede der folgenden Ausprägungen mindestens einmal vor:

- Vacation-Status: `approved`, `pending`, `rejected`
- Vacation-Scope: `full_day`, `morning`, `afternoon`
- Absence-Status: `pending`, `approved`, `rejected`, `acknowledged`, `admin_created`
- Absence-Type: `illness`, `special_leave`
- Absence-Scope: `full_day`, `morning`, `afternoon`
- Ledger-Typen: `entitlement`, `carryover`, `bonus`, `taken`, `expired`, `adjustment`
- Blackout-Typen: `freeze`, `company_holiday`
- Holiday-Typen: `fixed`, `variable`

Diese Mindestabdeckung ist zusätzlich per Backend-Tests abgesichert.

### Personen und Profile

| Person | Rolle / Profil | Wichtige Demo-Eigenschaften |
|---|---|---|
| Anna Admin | Admin | globale Sicht, genehmigt/reviewt Fälle, eigene halbtägige Vacation, Leadership-Daten im `full`-Datensatz |
| Max Mustermann | Employee | genehmigte und offene Vacation, Carryover, Zeitkonto-Anpassungen, genehmigte Morning-Abwesenheit |
| Sarah Schmidt | Employee | abgelehnte Vacation, bestätigte Krankheit, Support-Zeitbuchungen |
| Tom Weber | Employee | `holidays_exempt`, längere genehmigte Vacation, admin-erfasste Krankheit, temporärer Work-Schedule |
| Lisa Braun | Employee | `weekend_worker`, Pending Special Leave, Wochenend-Zeiterfassung |
| Mona Keller | Employee | Teilzeitmodell, halbtägige Vacation am Nachmittag, abgelehnte Special Leave, eigenes Template |

### Feature-Katalog

| Bereich | Was wird generiert | Wo du es in der App findest |
|---|---|---|
| Benutzer & Rollen | 1 Admin, 5 Employees mit unterschiedlichen Profilen | Login, Admin-Benutzerverwaltung, Auswahllisten |
| Work Schedules | Teilzeitmodell für Mona, temporäres 4-Tage-Modell für Tom | Admin-Bereich für Benutzer / Work Schedules |
| Holidays | deutsche feste und variable Feiertage für Vorjahr, aktuelles Jahr und Folgejahr | Kalender, Holiday-Verwaltung |
| Vacation Ledger | Entitlement, Carryover, Bonus, Taken, Expired, Adjustment | Vacation Account / Admin-Ledger |
| Work Time Account | manuelle Plus- und Minus-Korrekturen | Working Time Account |
| Vacations | genehmigt, offen, abgelehnt, volltägig und halbtägig | Mitarbeiteransicht, Teamkalender, Admin-Review |
| Absences | Krankheit und Sonderurlaub in allen relevanten Stati und Scopes | Absence-Ansichten, Admin-Review, Reports |
| Blackouts | Freeze plus Company Holiday | Vacation Planning / Blackouts |
| Cost Centers | direkte Zuweisungen, Gruppen-Zuweisungen, Favoriten | Time Tracking, Admin-Kostenstellen, Gruppen |
| Templates | mehrere Zeitbuchungs-Vorlagen | Time Booking Templates |
| Time Tracking | normale Arbeitstage, Teilzeit, Support, Wochenende | Daily/Weekly Time Tracking, Reports |
| Time Locks | mindestens ein gesperrter Monat, im `full`-Datensatz zwei | Admin Locking |

### Wo welches Szenario steckt

<table>
  <thead>
    <tr>
      <th>Szenario</th>
      <th>Person</th>
      <th>Beispiel im Seed</th>
      <th>Sichtbar in</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Genehmigte Vollzeit-Vacation</td>
      <td>Max, Tom</td>
      <td>vergangene und zukünftige Vacation-Blöcke</td>
      <td>Kalender, Vacation Account</td>
    </tr>
    <tr>
      <td>Offene Vacation</td>
      <td>Max</td>
      <td>zukünftiger Request mit Kommentar <code>Summer trip</code></td>
      <td>Mitarbeiteransicht, Admin Review Queue</td>
    </tr>
    <tr>
      <td>Abgelehnte Vacation</td>
      <td>Sarah</td>
      <td>Kommentar zur Teamabdeckung</td>
      <td>Mitarbeiteransicht, Admin Review</td>
    </tr>
    <tr>
      <td>Halbtägige Vacation morgens</td>
      <td>Anna</td>
      <td><code>Family appointment</code></td>
      <td>Kalender, Vacation Account</td>
    </tr>
    <tr>
      <td>Halbtägige Vacation nachmittags</td>
      <td>Mona</td>
      <td><code>Moving appointment</code></td>
      <td>Kalender, Vacation Account</td>
    </tr>
    <tr>
      <td>Krankheit bestätigt</td>
      <td>Sarah</td>
      <td><code>Flu symptoms</code></td>
      <td>Absence-Modul, Admin Review</td>
    </tr>
    <tr>
      <td>Krankheit admin-erfasst</td>
      <td>Tom</td>
      <td><code>Medical appointment confirmed by HR</code></td>
      <td>Absence-Modul</td>
    </tr>
    <tr>
      <td>Sonderurlaub offen</td>
      <td>Lisa</td>
      <td><code>Family ceremony</code></td>
      <td>Absence-Modul, Review Queue</td>
    </tr>
    <tr>
      <td>Sonderurlaub abgelehnt</td>
      <td>Mona</td>
      <td><code>Requested bridge day</code></td>
      <td>Absence-Modul</td>
    </tr>
    <tr>
      <td>Sonderurlaub genehmigt morgens</td>
      <td>Max</td>
      <td><code>Parent-teacher conference</code></td>
      <td>Absence-Modul</td>
    </tr>
    <tr>
      <td>Company Holiday</td>
      <td>alle</td>
      <td>24.12. bis 31.12.</td>
      <td>Kalender, Ledger, Systembuchungen</td>
    </tr>
    <tr>
      <td>Freeze</td>
      <td>alle</td>
      <td><code>Quarter-end delivery freeze</code></td>
      <td>Vacation Planning</td>
    </tr>
    <tr>
      <td>Wochenendarbeit</td>
      <td>Lisa</td>
      <td>Wochenend-Time-Entry</td>
      <td>Time Tracking, Reports</td>
    </tr>
    <tr>
      <td>Teilzeit</td>
      <td>Mona</td>
      <td>3-Tage-Woche plus passende Zeitbuchung</td>
      <td>Work Schedule, Time Tracking</td>
    </tr>
    <tr>
      <td>Holiday-Exempt</td>
      <td>Tom</td>
      <td><code>holidays_exempt=true</code></td>
      <td>Benutzerprofil, Berechnungen</td>
    </tr>
  </tbody>
</table>

### Container-Laufzeit

Die Container-Variante verwendet bewusst dasselbe Image für Demo und regulären Betrieb.

Der Umschalter ist:

```env
HOURNEST_RUNTIME_MODE=demo
```

Mögliche Werte:

- `demo`: setzt Demo-Modus als Laufzeitprofil durch
- `app`: startet denselben Container im normalen Anwendungsmodus

Wichtig für den Demo-Pfad:

- `HOURNEST_RUNTIME_MODE=demo` erzwingt `DEMO_ENABLED=true`
- `HOURNEST_RUNTIME_MODE=demo` erzwingt `AUTH_OAUTH_ENABLED=false`
- ohne explizite DB-Konfiguration nutzt der Container standardmäßig `sqlite` unter `/var/lib/hournest/database/demo.sqlite`
- die persistente Runtime-`.env` liegt unter `/var/lib/hournest/env/.env`
- beim Start wird standardmäßig ein Demo-Refresh ausgeführt
- derselbe Container kann zusätzlich `php artisan schedule:work` im Hintergrund mitstarten

Diese Regeln sorgen bewusst dafür, dass Demo-Deployment und späteres Standard-Deployment denselben Containerpfad verwenden und nicht als zwei getrennte Produkte auseinanderdriften.

### Übersichtsgrafik

```text
Demo-Datensatz (standard)

Anna  | Admin, Review, half-day vacation (morning)
Max   | approved vacation, pending vacation, carryover, approved morning absence
Sarah | rejected vacation, acknowledged illness, support bookings
Tom   | holidays exempt, long approved vacation, admin-created illness, temporary schedule
Lisa  | weekend worker, pending special leave, weekend time entry
Mona  | part-time schedule, half-day vacation (afternoon), rejected special leave

Zusätzliche Verdichtung in "full"

- mehr Vacations in Review und Historie
- mehr Absences quer über Personen
- zusätzliche Templates für Admin und Weekend Support
- zusätzliche Arbeitstage und Buchungen über mehrere Personen
- zweiter gesperrter Monat für Locking-Demos
```

### Synchronisationsregel

`DemoScenarioBuilder`, diese Dokumentationsseite und `DemoRefreshCommandTest` werden als ein gemeinsames Pflegepaket behandelt.

Das bedeutet:

- jede Änderung an generierten Personas, Szenarien, Stati oder Datensatzvarianten muss im selben Change auch in der Doku nachgezogen werden
- Änderungen am Container-Laufzeitprofil für Demo und am öffentlich beschriebenen Login-Verhalten müssen im selben Change ebenfalls in Doku und Generator-Kontext aktualisiert werden
- die Tabellen und Grafiken hier beschreiben den echten Generator und keine Wunschvorstellung
- die Coverage-Tests müssen dieselben Aussagen absichern, damit Generator, Tests und Doku nicht asynchron auseinanderlaufen

## Testabdeckung

Wichtige Tests rund um den Demo-Modus:

- `backend/tests/Feature/DemoModeTest.php`
- `backend/tests/Feature/DemoRefreshCommandTest.php`
- `backend/tests/Unit/DemoSafetyTest.php`
- `frontend/src/app/app.component.spec.ts`
- `frontend/e2e/demo-banner.spec.ts`

Zusätzlich prüft `DemoRefreshCommandTest`, dass die Standard-Datenmenge alle dokumentierten Status-, Scope- und Typ-Ausprägungen tatsächlich erzeugt.

## Betriebsregeln

Für eine echte öffentliche Demo solltest du mindestens diese Regeln einhalten:

- `APP_ENV=demo`
- `AUTH_OAUTH_ENABLED=false`
- dedizierte Demo-Datenbank
- ein gemeinsames, bewusst öffentliches Demo-Passwort
- Demo-Banner aktiv lassen
- Scheduler oder externen Cron für periodische Resets aktivieren
