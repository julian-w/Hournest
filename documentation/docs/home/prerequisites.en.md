# Prerequisites

This page lists all software requirements needed for developing and running Hournest.

---

## Backend Requirements

### PHP 8.4+

PHP 8.4 or higher is required. The following PHP extensions must be enabled:

| Extension    | Purpose                            |
|--------------|------------------------------------|
| `sqlite3`    | SQLite database access             |
| `mbstring`   | Multibyte string handling          |
| `openssl`    | HTTPS and encryption               |
| `tokenizer`  | PHP code analysis (Laravel)        |
| `xml`        | XML processing                     |
| `curl`       | HTTP requests (OIDC, Socialite)    |
| `fileinfo`   | File type detection                |
| `zip`        | Composer dependencies              |

!!! tip "Check PHP extensions"
    You can check installed extensions with:
    ```bash
    php -m
    ```

### Composer

[Composer](https://getcomposer.org/) is the PHP package manager used to install Laravel dependencies.

```bash
composer --version
```

---

## Frontend Requirements

### Node.js 18+ and npm

Node.js 18 or higher is required for the Angular frontend. npm is included with Node.js.

```bash
node --version
npm --version
```

### Angular CLI

The Angular CLI is installed globally and used to start the development server and build the production version.

```bash
npm install -g @angular/cli
ng version
```

---

## Database

### Development: SQLite

SQLite is used for local development. No separate installation is required -- the SQLite file is created automatically.

### Production: MySQL or PostgreSQL

For production, MySQL or PostgreSQL can be used as alternatives. Configuration is done via the `.env` file (see [Configuration](configuration.md)).

---

## Documentation (optional)

The following tools are needed to build this documentation:

### Python 3 and pip

```bash
python --version
pip --version
```

### MkDocs Material and Plugins

```bash
cd documentation
pip install -r requirements.txt
```

The `requirements.txt` contains:

- `mkdocs-material` -- MkDocs theme with Material Design
- `mkdocs-static-i18n` -- Internationalization plugin for multilingual documentation

---

## Summary

| Component       | Minimum Version | Purpose                      |
|-----------------|-----------------|------------------------------|
| PHP             | 8.2+            | Laravel backend              |
| Composer        | 2.x             | PHP package manager          |
| Node.js         | 18+             | Angular frontend             |
| npm             | 9+              | JavaScript package manager   |
| Angular CLI     | 18+             | Frontend development tools   |
| SQLite          | 3.x             | Development database         |
| Python          | 3.x             | Documentation (optional)     |
| pip             | 21+             | Python package manager (optional) |
