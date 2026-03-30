# Voraussetzungen

Diese Seite listet alle Software-Anforderungen auf, die für die Entwicklung und den Betrieb von Hournest benötigt werden.

---

## Backend-Anforderungen

### PHP 8.2+

PHP 8.2 oder höher ist erforderlich. Folgende PHP-Extensions müssen aktiviert sein:

| Extension    | Zweck                              |
|--------------|------------------------------------|
| `sqlite3`    | SQLite-Datenbankzugriff            |
| `mbstring`   | Multibyte-Zeichenketten            |
| `openssl`    | HTTPS und Verschlüsselung         |
| `tokenizer`  | PHP-Code-Analyse (Laravel)         |
| `xml`        | XML-Verarbeitung                   |
| `curl`       | HTTP-Anfragen (OIDC, Socialite)    |
| `fileinfo`   | Dateityp-Erkennung                 |
| `zip`        | Composer-Abhängigkeiten           |

!!! tip "PHP-Extensions prüfen"
    Mit folgendem Befehl können die installierten Extensions geprüft werden:
    ```bash
    php -m
    ```

### Composer

[Composer](https://getcomposer.org/) ist der Paketmanager für PHP und wird zur Installation der Laravel-Abhängigkeiten benötigt.

```bash
composer --version
```

---

## Frontend-Anforderungen

### Node.js 18+ und npm

Node.js 18 oder höher wird für das Angular-Frontend benötigt. npm wird mit Node.js mitgeliefert.

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

Für die lokale Entwicklung wird SQLite verwendet. Keine separate Installation erforderlich -- die SQLite-Datei wird automatisch erstellt.

### Produktion: MySQL oder PostgreSQL

Für den Produktionsbetrieb kann alternativ MySQL oder PostgreSQL verwendet werden. Die Konfiguration erfolgt über die `.env`-Datei (siehe [Konfiguration](configuration.md)).

---

## Dokumentation (optional)

Für das Bauen dieser Dokumentation werden folgende Werkzeuge benötigt:

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

Die `requirements.txt` enthält:

- `mkdocs-material` -- MkDocs-Theme mit Material Design
- `mkdocs-static-i18n` -- Internationalisierungs-Plugin für mehrsprachige Dokumentation

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
