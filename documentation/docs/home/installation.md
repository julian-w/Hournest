# Installation

Diese Seite beschreibt die **normale Installation aus dem Release-Paket** auf einem Server, Webspace oder einer NAS.

Für Endanwender oder Administratoren gilt: Du musst **nicht** das Repository klonen, **nicht** Angular bauen und **nicht** `composer install` ausführen, wenn du das fertige Release-Paket verwendest.

Wenn du stattdessen am Projekt entwickeln möchtest, nutze die Seite [Lokale Entwicklung](../dev/local-setup.md).

---

## Kurzüberblick

Der Standard-Flow ist:

1. Release-Paket von der GitHub-Releases-Seite herunterladen
2. Den kompletten entpackten Ordner auf den Server kopieren
3. `public/` als Document Root setzen
4. `.env.example` nach `.env` kopieren und anpassen
5. Optional `php test.php` ausführen
6. `php install.php` ausführen

Das Release-Paket enthält bereits:

- das Frontend in `public/`
- die PHP-Abhängigkeiten in `vendor/`
- den Diagnosetest `test.php`
- den Installer `install.php`

Release-Seite:

```text
https://github.com/julian-w/Hournest/releases
```

---

## Voraussetzungen auf dem Zielsystem

Benötigt werden nur:

- PHP 8.5+
- Webserver oder PHP-Hosting mit `public/` als Document Root
- die nötigen PHP-Extensions:
  - immer: `mbstring`, `openssl`, `tokenizer`, `xml`, `curl`, `fileinfo`
  - zusätzlich je nach Datenbank:
    - `pdo_sqlite`
    - `pdo_mysql`
    - oder `pdo_pgsql`

Nicht erforderlich auf dem Zielsystem:

- Git
- Node.js
- npm
- Angular CLI
- MkDocs
- Composer, solange `vendor/` im Release-Paket enthalten ist

---

## 1. Release-Paket entpacken und hochladen

1. Lade das Release-Archiv von der GitHub-Releases-Seite herunter
2. Entpacke es lokal
3. Kopiere den gesamten entpackten Ordner auf den Zielserver

Beispiel:

```text
/var/www/hournest/
```

oder auf einer Synology zum Beispiel:

```text
/volume1/web/hournest/
```

---

## 2. Document Root auf `public/` setzen

Der Webserver muss auf den `public/`-Ordner innerhalb des Pakets zeigen.

Beispiel:

```text
/var/www/hournest/public/
```

Ohne diesen Schritt funktioniert Laravel nicht korrekt.

---

## 3. `.env` anlegen

Wechsle in den hochgeladenen Ordner und kopiere die Vorlage:

```bash
cp .env.example .env
```

Danach die Datei `.env` anpassen.

Ein einfaches SQLite-Beispiel:

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://example.com
FRONTEND_URL=https://example.com

DB_CONNECTION=sqlite
DB_DATABASE=/absoluter/pfad/zur/database.sqlite

AUTH_OAUTH_ENABLED=true

SANCTUM_STATEFUL_DOMAINS=example.com

SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=
```

Wenn MySQL oder PostgreSQL verwendet wird, müssen stattdessen die jeweiligen DB-Zugangsdaten gesetzt werden.

---

## 4. Superadmin-Passwort festlegen

Ein gesetzter `SUPERADMIN_PASSWORD`-Hash ist **Pflicht**.

Wenn `SUPERADMIN_PASSWORD` in `.env` leer ist oder kein gültiger bcrypt-Hash gesetzt wurde, bricht `php install.php` bewusst ab und gibt dir:

- ein temporäres starkes Passwort
- einen kopierbaren bcrypt-Hash für die `.env`

Alternativ kannst du den Hash selbst erzeugen. Dafür kannst du temporär:

```text
public/superadmin-password-helper.php
```

im Browser öffnen, den Hash erzeugen und danach die Datei wieder löschen.

---

## 5. Installer ausführen

Optional vorher:

```bash
php test.php
```

`test.php` prüft ohne Änderungen:

- PHP-Version
- benötigte Extensions
- `.env`
- `SUPERADMIN_PASSWORD`
- Schreibrechte
- Datenbankverbindung, wenn `.env` bereits vollständig gesetzt ist

Im Paketordner:

```bash
php install.php
```

Optional mit Testdaten:

```bash
php install.php --seed
```

Der Installer:

- prüft PHP-Version und Extensions
- prüft, ob `SUPERADMIN_PASSWORD` sicher gesetzt ist
- stoppt bewusst, wenn der Superadmin-Hash fehlt oder ungültig ist, und gibt einen kopierbaren Ersatzwert aus
- installiert nur dann per Composer nach, wenn `vendor/` fehlen sollte
- erzeugt bei SQLite die Datenbankdatei
- führt Migrationen aus
- baut Laravel-Caches

`test.php` kann auch nach der Installation auf dem Server bleiben und später für Diagnosen erneut ausgeführt werden.

---

## 6. Anwendung aufrufen

Danach kann Hournest direkt über die konfigurierte URL geöffnet werden.

---

## Erste Schritte nach der Installation

Empfohlener Ablauf direkt nach der ersten erfolgreichen Installation:

1. Mit dem Superadmin über **"Admin Login"** anmelden
2. Prüfen, ob die Anwendung grundsätzlich erreichbar ist
3. Falls nötig, `ADMIN_EMAILS` und OIDC-Einstellungen in `.env` vervollständigen
4. Falls der Superadmin-Hash nur provisorisch gesetzt wurde: `SUPERADMIN_PASSWORD` in `.env` auf einen neuen bcrypt-Hash ändern
5. `public/superadmin-password-helper.php` löschen, falls verwendet
6. `APP_DEBUG=false` prüfen

### Superadmin-Passwort ändern

Der Superadmin ist ein Notfallzugang und wird **nicht** über die normale Benutzerverwaltung verwaltet. Das Passwort wird über die `.env`-Datei gesteuert.

Vorgehen:

1. Temporär `public/superadmin-password-helper.php` im Browser öffnen
2. Gewünschtes neues Passwort als bcrypt-Hash erzeugen
3. Den Wert in `.env` bei `SUPERADMIN_PASSWORD=` ersetzen
4. Danach `public/superadmin-password-helper.php` wieder löschen
5. Erneut mit dem neuen Passwort testen

Beispiel:

```ini
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=$2y$12$your-generated-bcrypt-hash
```

---

## Lokale Entwicklung

Wenn du Hournest lokal entwickeln willst, ist diese Seite nicht die richtige Anleitung. Dafür gibt es die Entwickler-Seite [Lokale Entwicklung](../dev/local-setup.md).
