# API-Referenz

Alle API-Endpoints von Hournest sind unter `/api` erreichbar. Die Authentifizierung erfolgt ueber Laravel Sanctum (Session-basiert).

!!! tip "OpenAPI-Dokumentation"
    Eine interaktive API-Dokumentation ist unter `http://localhost:8000/docs/api` verfuegbar, wenn das Backend laeuft. Die OpenAPI-JSON-Spec liegt unter `http://localhost:8000/docs/api.json`.

---

## Authentifizierung (Sanctum SPA)

Hournest verwendet Laravel Sanctum im SPA-Modus. Die Authentifizierung laeuft ueber Session-Cookies:

1. Das Frontend muss zuerst ein CSRF-Cookie anfordern: `GET /sanctum/csrf-cookie`
2. Alle weiteren Anfragen muessen `withCredentials: true` setzen
3. Das CSRF-Token wird im `X-XSRF-TOKEN`-Header mitgesendet

---

## Antwortformat

Alle API-Antworten folgen einer einheitlichen Struktur:

```json
{
  "data": { ... },
  "message": "Success message"
}
```

Bei Listen:

```json
{
  "data": [ ... ]
}
```

### HTTP-Statuscodes

| Code | Bedeutung                    |
|------|------------------------------|
| 200  | Erfolg                       |
| 201  | Ressource erstellt           |
| 401  | Nicht authentifiziert         |
| 403  | Keine Berechtigung           |
| 404  | Nicht gefunden               |
| 422  | Validierungsfehler           |

---

## Auth-Endpoints

### GET /api/auth/redirect

Leitet den Benutzer zum Synology SSO Server weiter (OIDC-Login).

**Auth:** Keine

**Response:** HTTP 302 Redirect zum SSO Server

---

### GET /api/auth/callback

Verarbeitet den OIDC-Callback vom SSO Server. Erstellt oder aktualisiert den Benutzer und richtet die Session ein.

**Auth:** Keine

**Response:** HTTP 302 Redirect zur `FRONTEND_URL`

---

### POST /api/auth/login

Superadmin-Login mit lokalen Credentials.

**Auth:** Keine

**Request Body:**

```json
{
  "username": "superadmin",
  "password": "changeme"
}
```

**Response (200):**

```json
{
  "data": {
    "id": 1,
    "email": "superadmin@hournest.local",
    "display_name": "Superadmin",
    "role": "superadmin",
    "vacation_days_per_year": 0,
    "remaining_vacation_days": 0,
    "holidays_exempt": false,
    "weekend_worker": false
  },
  "message": "Logged in successfully."
}
```

**Fehler (401):**

```json
{
  "message": "Invalid credentials."
}
```

---

### POST /api/auth/logout

Beendet die aktuelle Session.

**Auth:** Sanctum

**Response (200):**

```json
{
  "message": "Logged out successfully."
}
```

---

## User-Endpoint

### GET /api/user

Gibt die Informationen des aktuell angemeldeten Benutzers zurueck.

**Auth:** Sanctum

**Response (200):**

```json
{
  "data": {
    "id": 2,
    "email": "max@example.com",
    "display_name": "Max Mustermann",
    "role": "employee",
    "vacation_days_per_year": 30,
    "remaining_vacation_days": 22,
    "holidays_exempt": false,
    "weekend_worker": false
  }
}
```

---

## Vacation-Endpoints

### GET /api/vacations

Gibt alle **genehmigten** Urlaube zurueck (fuer den Kalender).

**Auth:** Sanctum

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "user_name": "Max Mustermann",
      "start_date": "2026-04-06",
      "end_date": "2026-04-17",
      "workdays": 10,
      "status": "approved",
      "comment": null,
      "reviewed_by": 1,
      "reviewer_name": "Anna Admin",
      "reviewed_at": "2026-03-15T10:00:00.000000Z",
      "created_at": "2026-03-10T09:00:00.000000Z"
    }
  ]
}
```

---

### GET /api/vacations/mine

Gibt alle Urlaube des angemeldeten Benutzers zurueck (alle Status).

**Auth:** Sanctum

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "user_name": "Max Mustermann",
      "start_date": "2026-04-06",
      "end_date": "2026-04-17",
      "workdays": 10,
      "status": "approved",
      "comment": null,
      "reviewed_by": 1,
      "reviewer_name": "Anna Admin",
      "reviewed_at": "2026-03-15T10:00:00.000000Z",
      "created_at": "2026-03-10T09:00:00.000000Z"
    },
    {
      "id": 2,
      "user_id": 2,
      "user_name": "Max Mustermann",
      "start_date": "2026-08-03",
      "end_date": "2026-08-14",
      "workdays": 10,
      "status": "pending",
      "comment": "Summer vacation",
      "reviewed_by": null,
      "reviewer_name": null,
      "reviewed_at": null,
      "created_at": "2026-03-20T14:00:00.000000Z"
    }
  ]
}
```

---

### POST /api/vacations

Erstellt einen neuen Urlaubsantrag.

**Auth:** Sanctum

**Request Body:**

```json
{
  "start_date": "2026-06-01",
  "end_date": "2026-06-05"
}
```

**Response (201):**

```json
{
  "data": {
    "id": 10,
    "user_id": 2,
    "user_name": "Max Mustermann",
    "start_date": "2026-06-01",
    "end_date": "2026-06-05",
    "workdays": 5,
    "status": "pending",
    "comment": null,
    "reviewed_by": null,
    "reviewer_name": null,
    "reviewed_at": null,
    "created_at": "2026-03-26T12:00:00.000000Z"
  },
  "message": "Vacation request submitted."
}
```

**Fehler (422) -- Ueberlappung:**

```json
{
  "message": "Vacation overlaps with an already approved vacation."
}
```

---

### DELETE /api/vacations/{id}

Storniert einen eigenen Urlaubsantrag (nur Pending).

**Auth:** Sanctum

**Response (200):**

```json
{
  "message": "Vacation request cancelled."
}
```

**Fehler (403):** Nicht der eigene Antrag

**Fehler (422):** Antrag ist nicht im Status Pending

---

## Vacation Ledger Endpoints

### GET /api/vacation-ledger

Gibt die eigenen Urlaubskonto-Buchungen zurueck.

**Auth:** Sanctum

**Query-Parameter:**

- `year` (optional, default: aktuelles Jahr) -- Buchungsjahr

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "year": 2026,
      "type": "entitlement",
      "days": "30.0",
      "comment": "Annual entitlement 2026",
      "vacation_id": null,
      "created_at": "2026-01-01T00:00:00.000000Z"
    },
    {
      "id": 2,
      "user_id": 2,
      "year": 2026,
      "type": "carryover",
      "days": "3.0",
      "comment": "Carried over from 2025",
      "vacation_id": null,
      "created_at": "2026-01-01T00:00:00.000000Z"
    }
  ]
}
```

---

## Holiday Endpoints

### GET /api/holidays

Gibt alle Feiertage zurueck.

**Auth:** Sanctum

**Query-Parameter:**

- `year` (optional) -- Filtert nach Jahr

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "New Year",
      "date": "2026-01-01",
      "type": "fixed"
    },
    {
      "id": 2,
      "name": "Good Friday",
      "date": "2026-04-03",
      "type": "variable"
    }
  ]
}
```

---

## Settings Endpoints

### GET /api/settings

Gibt alle globalen Einstellungen zurueck.

**Auth:** Sanctum

**Response (200):**

```json
{
  "data": [
    { "key": "default_work_days", "value": "[1,2,3,4,5]" },
    { "key": "weekend_is_free", "value": "true" },
    { "key": "carryover_enabled", "value": "true" },
    { "key": "carryover_expiry_date", "value": "03-31" }
  ]
}
```

---

## Admin-Endpoints

Alle Admin-Endpoints erfordern die Rolle `admin` oder `superadmin`.

### GET /api/admin/vacations/pending

Gibt alle offenen Urlaubsantraege zurueck.

**Auth:** Sanctum + Admin

**Response (200):**

```json
{
  "data": [
    {
      "id": 2,
      "user_id": 2,
      "user_name": "Max Mustermann",
      "start_date": "2026-08-03",
      "end_date": "2026-08-14",
      "workdays": 10,
      "status": "pending",
      "comment": "Summer vacation",
      "reviewed_by": null,
      "reviewer_name": null,
      "reviewed_at": null,
      "created_at": "2026-03-20T14:00:00.000000Z"
    }
  ]
}
```

---

### PATCH /api/admin/vacations/{id}

Genehmigt oder lehnt einen Urlaubsantrag ab.

**Auth:** Sanctum + Admin

**Request Body:**

```json
{
  "status": "approved",
  "comment": "Approved. Have a great vacation!"
}
```

**Response (200):**

```json
{
  "data": {
    "id": 2,
    "user_id": 2,
    "user_name": "Max Mustermann",
    "start_date": "2026-08-03",
    "end_date": "2026-08-14",
    "workdays": 10,
    "status": "approved",
    "comment": "Approved. Have a great vacation!",
    "reviewed_by": 1,
    "reviewer_name": "Anna Admin",
    "reviewed_at": "2026-03-26T12:00:00.000000Z",
    "created_at": "2026-03-20T14:00:00.000000Z"
  },
  "message": "Vacation request approved."
}
```

---

### GET /api/admin/users

Gibt alle Benutzer zurueck.

**Auth:** Sanctum + Admin

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "email": "anna@example.com",
      "display_name": "Anna Admin",
      "role": "admin",
      "vacation_days_per_year": 30,
      "remaining_vacation_days": 22,
      "holidays_exempt": false,
      "weekend_worker": false
    },
    {
      "id": 2,
      "email": "max@example.com",
      "display_name": "Max Mustermann",
      "role": "employee",
      "vacation_days_per_year": 30,
      "remaining_vacation_days": 18,
      "holidays_exempt": false,
      "weekend_worker": false
    }
  ]
}
```

---

### PATCH /api/admin/users/{id}

Aktualisiert einen Benutzer.

**Auth:** Sanctum + Admin

**Request Body:**

```json
{
  "role": "admin",
  "vacation_days_per_year": 28,
  "holidays_exempt": true,
  "weekend_worker": false
}
```

**Response (200):**

```json
{
  "data": {
    "id": 2,
    "email": "max@example.com",
    "display_name": "Max Mustermann",
    "role": "admin",
    "vacation_days_per_year": 28,
    "remaining_vacation_days": 18,
    "holidays_exempt": true,
    "weekend_worker": false
  },
  "message": "User updated."
}
```

---

### POST /api/admin/holidays

Erstellt einen neuen Feiertag.

**Auth:** Sanctum + Admin

**Request Body:**

```json
{
  "name": "Rosenmontag",
  "date": "2026-02-16",
  "type": "variable"
}
```

**Response (201):**

```json
{
  "data": {
    "id": 10,
    "name": "Rosenmontag",
    "date": "2026-02-16",
    "type": "variable"
  },
  "message": "Holiday created."
}
```

---

### PATCH /api/admin/holidays/{id}

Aktualisiert einen Feiertag.

**Auth:** Sanctum + Admin

**Request Body:**

```json
{
  "name": "Rosenmontag",
  "date": "2026-02-16",
  "type": "variable"
}
```

**Response (200):**

```json
{
  "data": {
    "id": 10,
    "name": "Rosenmontag",
    "date": "2026-02-16",
    "type": "variable"
  },
  "message": "Holiday updated."
}
```

---

### DELETE /api/admin/holidays/{id}

Loescht einen Feiertag.

**Auth:** Sanctum + Admin

**Response (200):**

```json
{
  "message": "Holiday deleted."
}
```

---

### PUT /api/admin/settings

Aktualisiert globale Einstellungen.

**Auth:** Sanctum + Admin

**Request Body:**

```json
{
  "settings": {
    "default_work_days": "[1,2,3,4,5]",
    "weekend_is_free": "true",
    "carryover_enabled": "true",
    "carryover_expiry_date": "03-31"
  }
}
```

**Response (200):**

```json
{
  "data": [
    { "key": "default_work_days", "value": "[1,2,3,4,5]" },
    { "key": "weekend_is_free", "value": "true" },
    { "key": "carryover_enabled", "value": "true" },
    { "key": "carryover_expiry_date", "value": "03-31" }
  ],
  "message": "Settings updated."
}
```

---

### GET /api/admin/users/{id}/work-schedules

Gibt die Arbeitszeitmodelle eines Benutzers zurueck.

**Auth:** Sanctum + Admin

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "user_id": 5,
      "start_date": "2026-07-01",
      "end_date": "2026-12-31",
      "work_days": [3, 4]
    }
  ]
}
```

---

### POST /api/admin/users/{id}/work-schedules

Erstellt ein neues Arbeitszeitmodell fuer einen Benutzer.

**Auth:** Sanctum + Admin

**Request Body:**

```json
{
  "start_date": "2026-07-01",
  "end_date": "2026-12-31",
  "work_days": [3, 4]
}
```

**Response (201):**

```json
{
  "data": {
    "id": 2,
    "user_id": 5,
    "start_date": "2026-07-01",
    "end_date": "2026-12-31",
    "work_days": [3, 4]
  },
  "message": "Work schedule created."
}
```

---

### PATCH /api/admin/work-schedules/{id}

Aktualisiert ein Arbeitszeitmodell.

**Auth:** Sanctum + Admin

**Request Body:**

```json
{
  "start_date": "2026-07-01",
  "end_date": null,
  "work_days": [1, 2, 3]
}
```

**Response (200):**

```json
{
  "data": {
    "id": 1,
    "user_id": 5,
    "start_date": "2026-07-01",
    "end_date": null,
    "work_days": [1, 2, 3]
  },
  "message": "Work schedule updated."
}
```

---

### DELETE /api/admin/work-schedules/{id}

Loescht ein Arbeitszeitmodell.

**Auth:** Sanctum + Admin

**Response (200):**

```json
{
  "message": "Work schedule deleted."
}
```

---

### GET /api/admin/users/{id}/vacation-ledger

Gibt die Urlaubskonto-Buchungen eines Benutzers zurueck.

**Auth:** Sanctum + Admin

**Query-Parameter:**

- `year` (optional, default: aktuelles Jahr)

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "year": 2026,
      "type": "entitlement",
      "days": "30.0",
      "comment": "Annual entitlement 2026",
      "vacation_id": null,
      "created_at": "2026-01-01T00:00:00.000000Z"
    }
  ]
}
```

---

### POST /api/admin/users/{id}/vacation-ledger

Erstellt eine neue Urlaubskonto-Buchung.

**Auth:** Sanctum + Admin

**Request Body:**

```json
{
  "year": 2026,
  "type": "bonus",
  "days": 1,
  "comment": "Extra day for company anniversary"
}
```

**Response (201):**

```json
{
  "data": {
    "id": 15,
    "user_id": 2,
    "year": 2026,
    "type": "bonus",
    "days": "1.0",
    "comment": "Extra day for company anniversary",
    "vacation_id": null,
    "created_at": "2026-03-26T12:00:00.000000Z"
  },
  "message": "Ledger entry created."
}
```
