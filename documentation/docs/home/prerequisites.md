# Voraussetzungen

Diese Seite trennt klar zwischen den Anforderungen für die lokale Entwicklung und den Anforderungen für das Zielsystem.

Wenn du Hournest nur aus einem Release-Paket betreiben willst, braucht der Zielserver weder Node.js noch Angular CLI noch Python oder MkDocs.

---

## Zielsystem / Endanwender

Für den normalen Betrieb des Release-Pakets werden nur die Laufzeit-Komponenten auf dem Server benötigt:

- PHP 8.5+
- Ein Webserver oder PHP-Hosting mit **Document Root** auf `public/`
- Die passenden PHP-Extensions für den gewählten Datenbanktreiber

### Erforderliche PHP-Extensions

Diese Extensions werden immer benötigt:

| Extension    | Zweck                           |
|--------------|---------------------------------|
| `mbstring`   | Multibyte-Zeichenketten         |
| `openssl`    | HTTPS und Verschlüsselung       |
| `tokenizer`  | Laravel-Runtime                 |
| `xml`        | XML-Verarbeitung                |
| `curl`       | HTTP-Anfragen, z.B. für OIDC    |
| `fileinfo`   | Dateityp-Erkennung              |

Zusätzlich wird genau **ein** Datenbanktreiber benötigt:

| Extension      | Wann erforderlich                    |
|----------------|--------------------------------------|
| `pdo_sqlite`   | Standard-Setup mit SQLite            |
| `pdo_mysql`    | Wenn MySQL/MariaDB verwendet wird    |
| `pdo_pgsql`    | Wenn PostgreSQL verwendet wird       |

!!! tip "PHP-Extensions prüfen"
    Mit folgendem Befehl können die installierten Extensions geprüft werden:
    ```bash
    php -m
    ```

### Optional für den Betrieb

- Ein OIDC-Provider, falls SSO verwendet werden soll
- SSH/SFTP-Zugang für komfortableres Deployment

### Nicht erforderlich auf dem Zielsystem

- Node.js
- npm
- Angular CLI
- Python
- MkDocs

---

## Entwicklungsumgebung

Für die lokale Entwicklung werden zusätzlich Werkzeuge für Backend, Frontend und optional die Dokumentation benötigt.

### Backend

| Komponente | Mindestversion | Zweck |
|------------|----------------|-------|
| PHP        | 8.5+           | Laravel-Backend |
| Composer   | 2.x            | Installation der PHP-Abhängigkeiten |

Für die lokale Standardentwicklung mit SQLite wird zusätzlich `pdo_sqlite` benötigt.

### Frontend

| Komponente | Mindestversion | Zweck |
|------------|----------------|-------|
| Node.js    | 18+            | Angular-Tooling |
| npm        | 9+             | Paketmanager für das Frontend |

Eine **globale** Angular CLI ist nicht erforderlich. Im Projekt wird die lokale CLI über `npx ng` oder `npm run ...` verwendet.

```bash
node --version
npm --version
```

### Dokumentation (optional)

Nur wenn du die MkDocs-Dokumentation lokal bauen oder mit Live-Reload starten möchtest:

| Komponente | Mindestversion | Zweck |
|------------|----------------|-------|
| Python     | 3.x            | MkDocs ausführen |
| pip        | 21+            | Python-Paketmanager |

```bash
cd documentation
pip install -r requirements.txt
```

Die `requirements.txt` enthält aktuell:

- `mkdocs-material`
- `mkdocs-static-i18n`

---

## Kurzfassung

| Einsatz | Benötigt |
|---------|----------|
| Zielsystem / Release-Paket | PHP 8.5+, Webserver, passende PDO-Extension |
| Lokale Entwicklung | zusätzlich Composer, Node.js und npm |
| Doku lokal bauen | zusätzlich Python und pip |
