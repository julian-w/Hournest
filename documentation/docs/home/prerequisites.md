# Voraussetzungen

Diese Seite listet alle Software-Anforderungen auf, die fuer die Entwicklung und den Betrieb von Hournest benoetigt werden.

---

## Backend-Anforderungen

### PHP 8.2+

PHP 8.2 oder hoeher ist erforderlich. Folgende PHP-Extensions muessen aktiviert sein:

| Extension    | Zweck                              |
|--------------|------------------------------------|
| `sqlite3`    | SQLite-Datenbankzugriff            |
| `mbstring`   | Multibyte-Zeichenketten            |
| `openssl`    | HTTPS und Verschluesselung         |
| `tokenizer`  | PHP-Code-Analyse (Laravel)         |
| `xml`        | XML-Verarbeitung                   |
| `curl`       | HTTP-Anfragen (OIDC, Socialite)    |
| `fileinfo`   | Dateityp-Erkennung                 |
| `zip`        | Composer-Abhaengigkeiten           |

!!! tip "PHP-Extensions pruefen"
    Mit folgendem Befehl koennen die installierten Extensions geprueft werden:
    ```bash
    php -m
    ```

### Composer

[Composer](https://getcomposer.org/) ist der Paketmanager fuer PHP und wird zur Installation der Laravel-Abhaengigkeiten benoetigt.

```bash
composer --version
```

---

## Frontend-Anforderungen

### Node.js 18+ und npm

Node.js 18 oder hoeher wird fuer das Angular-Frontend benoetigt. npm wird mit Node.js mitgeliefert.

```bash
node --version
npm --version
```

### Angular CLI

Die Angular CLI wird global installiert und zum Starten des Entwicklungsservers sowie zum Bauen der Produktionsversion verwendet.

```bash
npm install -g @angular/cli
ng version
```

---

## Datenbank

### Entwicklung: SQLite

Fuer die lokale Entwicklung wird SQLite verwendet. Keine separate Installation erforderlich -- die SQLite-Datei wird automatisch erstellt.

### Produktion: MySQL oder PostgreSQL

Fuer den Produktionsbetrieb kann alternativ MySQL oder PostgreSQL verwendet werden. Die Konfiguration erfolgt ueber die `.env`-Datei (siehe [Konfiguration](configuration.md)).

---

## Dokumentation (optional)

Fuer das Bauen dieser Dokumentation werden folgende Werkzeuge benoetigt:

### Python 3 und pip

```bash
python --version
pip --version
```

### MkDocs Material und Plugins

```bash
cd documentation
pip install -r requirements.txt
```

Die `requirements.txt` enthaelt:

- `mkdocs-material` -- MkDocs-Theme mit Material Design
- `mkdocs-static-i18n` -- Internationalisierungs-Plugin fuer mehrsprachige Dokumentation

---

## Zusammenfassung

| Komponente      | Mindestversion | Zweck                        |
|-----------------|----------------|------------------------------|
| PHP             | 8.2+           | Laravel-Backend              |
| Composer        | 2.x            | PHP-Paketmanager             |
| Node.js         | 18+            | Angular-Frontend             |
| npm             | 9+             | JavaScript-Paketmanager      |
| Angular CLI     | 18+            | Frontend-Entwicklungstools   |
| SQLite          | 3.x            | Entwicklungsdatenbank        |
| Python          | 3.x            | Dokumentation (optional)     |
| pip             | 21+            | Python-Paketmanager (optional) |
