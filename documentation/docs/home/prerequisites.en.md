# Prerequisites

This page clearly separates local development requirements from target-system requirements.

If you only want to run Hournest from a release package, the target server does not need Node.js, Angular CLI, Python, or MkDocs.

---

## Target System / End Users

For normal operation of the release package, the server only needs the runtime components:

- PHP 8.5+
- A web server or PHP hosting setup with the **document root** pointing to `public/`
- The matching PHP extensions for the selected database driver

### Required PHP Extensions

These extensions are always required:

| Extension    | Purpose                         |
|--------------|---------------------------------|
| `mbstring`   | Multibyte string handling       |
| `openssl`    | HTTPS and encryption            |
| `tokenizer`  | Laravel runtime                 |
| `xml`        | XML processing                  |
| `curl`       | HTTP requests, for example OIDC |
| `fileinfo`   | File type detection             |

In addition, exactly **one** database driver is required:

| Extension      | Required when                       |
|----------------|-------------------------------------|
| `pdo_sqlite`   | Default setup with SQLite           |
| `pdo_mysql`    | When using MySQL/MariaDB            |
| `pdo_pgsql`    | When using PostgreSQL               |

!!! tip "Check PHP extensions"
    You can check installed extensions with:
    ```bash
    php -m
    ```

### Optional for Operation

- An OIDC provider if SSO should be used
- SSH/SFTP access for more convenient deployment

### Not Required on the Target System

- Node.js
- npm
- Angular CLI
- Python
- MkDocs

---

## Development Environment

For local development, additional tools for backend, frontend, and optionally the documentation are needed.

### Backend

| Component | Minimum Version | Purpose |
|-----------|-----------------|---------|
| PHP       | 8.5+            | Laravel backend |
| Composer  | 2.x             | Install PHP dependencies |

For the default local SQLite setup, `pdo_sqlite` is also required.

### Frontend

| Component | Minimum Version | Purpose |
|-----------|-----------------|---------|
| Node.js   | 18+             | Angular tooling |
| npm       | 9+              | Frontend package manager |

A **global** Angular CLI is not required. This project uses the local CLI via `npx ng` or `npm run ...`.

```bash
node --version
npm --version
```

### Documentation (optional)

Only needed if you want to build the MkDocs documentation locally or run it with live reload:

| Component | Minimum Version | Purpose |
|-----------|-----------------|---------|
| Python    | 3.x             | Run MkDocs |
| pip       | 21+             | Python package manager |

```bash
cd documentation
pip install -r requirements.txt
```

The current `requirements.txt` contains:

- `mkdocs-material`
- `mkdocs-static-i18n`

---

## Summary

| Use Case | Required |
|----------|----------|
| Target system / release package | PHP 8.5+, web server, matching PDO extension |
| Local development | additionally Composer, Node.js, and npm |
| Building docs locally | additionally Python and pip |
