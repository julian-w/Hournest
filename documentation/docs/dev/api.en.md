# API Reference

All Hournest API endpoints are accessible under `/api`. Authentication uses Laravel Sanctum (session-based).

!!! tip "OpenAPI Documentation"
    An interactive API documentation is available at `http://localhost:8000/docs/api` when the backend is running. The OpenAPI JSON spec is at `http://localhost:8000/docs/api.json`.

---

## Authentication (Sanctum SPA)

Hournest uses Laravel Sanctum in SPA mode. Authentication works via session cookies:

1. The frontend must first request a CSRF cookie: `GET /sanctum/csrf-cookie`
2. All subsequent requests must set `withCredentials: true`
3. The CSRF token is sent in the `X-XSRF-TOKEN` header

---

## Response Format

All API responses follow a consistent structure:

```json
{
  "data": { ... },
  "message": "Success message"
}
```

For lists:

```json
{
  "data": [ ... ]
}
```

### HTTP Status Codes

| Code | Meaning                      |
|------|------------------------------|
| 200  | Success                      |
| 201  | Resource created             |
| 401  | Not authenticated            |
| 403  | Forbidden                    |
| 404  | Not found                    |
| 422  | Validation error             |

---

## Auth Endpoints

### GET /api/auth/redirect

Redirects the user to the Synology SSO Server (OIDC login).

**Auth:** None

**Response:** HTTP 302 Redirect to SSO Server

---

### GET /api/auth/callback

Processes the OIDC callback from the SSO Server. Creates or updates the user and sets up the session.

**Auth:** None

**Response:** HTTP 302 Redirect to `FRONTEND_URL`

---

### POST /api/auth/login

Superadmin login with local credentials.

**Auth:** None

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

**Error (401):**

```json
{
  "message": "Invalid credentials."
}
```

---

### POST /api/auth/logout

Terminates the current session.

**Auth:** Sanctum

**Response (200):**

```json
{
  "message": "Logged out successfully."
}
```

---

## User Endpoint

### GET /api/user

Returns the information of the currently authenticated user.

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

## Vacation Endpoints

### GET /api/vacations

Returns all **approved** vacations (for the calendar).

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

Returns all vacations of the authenticated user (all statuses).

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

Creates a new vacation request.

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

**Error (422) -- Overlap:**

```json
{
  "message": "Vacation overlaps with an already approved vacation."
}
```

---

### DELETE /api/vacations/{id}

Cancels an own vacation request (only pending).

**Auth:** Sanctum

**Response (200):**

```json
{
  "message": "Vacation request cancelled."
}
```

**Error (403):** Not the user's own request

**Error (422):** Request is not in pending status

---

## Vacation Ledger Endpoints

### GET /api/vacation-ledger

Returns the user's own vacation account bookings.

**Auth:** Sanctum

**Query Parameters:**

- `year` (optional, default: current year) -- Booking year

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

Returns all holidays.

**Auth:** Sanctum

**Query Parameters:**

- `year` (optional) -- Filter by year

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

Returns all global settings.

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

## Admin Endpoints

All admin endpoints require the `admin` or `superadmin` role.

### GET /api/admin/vacations/pending

Returns all pending vacation requests.

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

Approves or rejects a vacation request.

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

Returns all users.

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
    }
  ]
}
```

---

### PATCH /api/admin/users/{id}

Updates a user.

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

Creates a new holiday.

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

Updates a holiday.

**Auth:** Sanctum + Admin

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

Deletes a holiday.

**Auth:** Sanctum + Admin

**Response (200):**

```json
{
  "message": "Holiday deleted."
}
```

---

### PUT /api/admin/settings

Updates global settings.

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

Returns work schedules for a user.

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

Creates a new work schedule for a user.

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

Updates a work schedule.

**Auth:** Sanctum + Admin

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

Deletes a work schedule.

**Auth:** Sanctum + Admin

**Response (200):**

```json
{
  "message": "Work schedule deleted."
}
```

---

### GET /api/admin/users/{id}/vacation-ledger

Returns vacation account bookings for a user.

**Auth:** Sanctum + Admin

**Query Parameters:**

- `year` (optional, default: current year)

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

Creates a new vacation account booking.

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
