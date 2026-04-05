# Architecture

This page describes the technical architecture of Hournest for developers contributing to the project.

---

## Overview

Hournest is structured as a **monorepo** with two main components:

- **Backend** (`/backend`) -- Laravel 11 REST API
- **Frontend** (`/frontend`) -- Angular 18 Single Page Application (SPA)

The frontend communicates exclusively via HTTP API calls with the backend. There is no server-side view rendering.

---

## Frontend-Backend Communication

```
Browser (Angular SPA)
    |
    | HTTP (JSON)
    |
Laravel API (/api/*)
    |
    | Eloquent ORM
    |
SQLite / MySQL / PostgreSQL
```

- All API endpoints are under `/api/*`
- JSON is the only exchange format
- Authentication uses session cookies (Laravel Sanctum in SPA mode)
- CORS is configured to allow the frontend (e.g., `localhost:4200`) to access the API

---

## Authentication Flow

The standard login uses OpenID Connect (OIDC) with an external OIDC provider:

```
1. Angular redirects to:         GET /api/auth/redirect
2. Laravel redirects to:         OIDC Provider
3. User authenticates on:        OIDC Provider
4. OIDC Provider redirects to:   GET /api/auth/callback
5. Laravel creates/updates user and session
6. Laravel redirects to:         FRONTEND_URL (e.g., http://localhost:4200)
7. Angular checks authentication: GET /api/user
```

The **superadmin login** bypasses the OIDC flow:

```
1. Angular sends:                POST /api/auth/login (username + password)
2. Laravel validates credentials against .env values
3. Laravel creates session and returns user
```

---

## Role System

| Role         | Value        | Assignment                                 | Permissions |
|--------------|--------------|---------------------------------------------|-------------|
| Employee     | `employee`   | Automatically on SSO login                  | Own vacations, shared-group calendar, dashboard |
| Admin        | `admin`      | SSO login with email in `ADMIN_EMAILS`      | Everything from Employee + all vacations, user management, holidays, settings |
| Superadmin   | `superadmin` | Login with local credentials                | Same permissions as Admin             |

The admin check is handled in the backend via the `EnsureAdmin` middleware, which accepts both `admin` and `superadmin`.

---

## Database Schema

### users

| Column               | Type       | Description                           |
|----------------------|------------|---------------------------------------|
| id                   | bigint (PK)| Auto-increment                        |
| email                | string     | Unique email address                  |
| display_name         | string     | Display name                          |
| role                 | string     | employee / admin / superadmin         |
| vacation_days_per_year| integer   | Annual vacation entitlement           |
| oidc_id              | string     | Unique ID from OIDC provider (null for local users) |
| holidays_exempt      | boolean    | Holidays count as working days        |
| weekend_worker       | boolean    | Weekends count as working days        |
| remember_token       | string     | Laravel remember token                |
| created_at           | timestamp  |                                       |
| updated_at           | timestamp  |                                       |
| deleted_at           | timestamp  | Soft delete                           |

### vacations

| Column      | Type       | Description                           |
|-------------|------------|---------------------------------------|
| id          | bigint (PK)| Auto-increment                        |
| user_id     | bigint (FK)| Reference to users.id                 |
| start_date  | date       | First vacation day                    |
| end_date    | date       | Last vacation day                     |
| status      | string     | pending / approved / rejected         |
| comment     | text       | Comment (optional)                    |
| reviewed_by | bigint (FK)| Reference to users.id (reviewer)      |
| reviewed_at | timestamp  | Time of approval/rejection            |
| created_at  | timestamp  |                                       |
| updated_at  | timestamp  |                                       |
| deleted_at  | timestamp  | Soft delete                           |

### holidays

| Column      | Type       | Description                           |
|-------------|------------|---------------------------------------|
| id          | bigint (PK)| Auto-increment                        |
| name        | string     | Holiday name                          |
| date        | date       | Holiday date                          |
| type        | string     | fixed / variable                      |
| created_at  | timestamp  |                                       |
| updated_at  | timestamp  |                                       |

### work_schedules

| Column      | Type       | Description                           |
|-------------|------------|---------------------------------------|
| id          | bigint (PK)| Auto-increment                        |
| user_id     | bigint (FK)| Reference to users.id                 |
| start_date  | date       | Period start                          |
| end_date    | date       | Period end (nullable)                 |
| work_days   | json       | Array of work days [1,2,3,4,5]       |
| created_at  | timestamp  |                                       |
| updated_at  | timestamp  |                                       |

### vacation_ledger_entries

| Column      | Type        | Description                           |
|-------------|-------------|---------------------------------------|
| id          | bigint (PK) | Auto-increment                        |
| user_id     | bigint (FK) | Reference to users.id                 |
| year        | integer     | Booking year                          |
| type        | string      | entitlement / carryover / bonus / taken / expired / adjustment |
| days        | decimal(5,1)| Days (positive or negative)           |
| comment     | text        | Booking comment (optional)            |
| vacation_id | bigint (FK) | Reference to vacations.id (optional)  |
| created_at  | timestamp   |                                       |
| updated_at  | timestamp   |                                       |

### settings

| Column      | Type       | Description                           |
|-------------|------------|---------------------------------------|
| id          | bigint (PK)| Auto-increment                        |
| key         | string     | Unique key                            |
| value       | text       | Value (stored as string)              |
| created_at  | timestamp  |                                       |
| updated_at  | timestamp  |                                       |

### sessions

| Column         | Type       | Description                        |
|----------------|------------|------------------------------------|
| id             | string (PK)| Session ID                         |
| user_id        | bigint (FK)| Reference to users.id (nullable)   |
| ip_address     | string(45) | Client IP address                  |
| user_agent     | text       | Browser user agent                 |
| payload        | longtext   | Session data                       |
| last_activity  | integer    | Timestamp of last activity         |

---

## Tech Stack Details

| Component         | Technology             | Version  |
|-------------------|------------------------|----------|
| Backend framework | Laravel                | 11+      |
| PHP               | PHP                    | 8.5+     |
| Frontend framework| Angular                | 18+      |
| UI library        | Angular Material       | 18+      |
| CSS preprocessor  | SCSS                   |          |
| i18n (frontend)   | ngx-translate          |          |
| Auth (backend)    | Laravel Sanctum        |          |
| Auth (OIDC)       | Laravel Socialite      |          |
| API docs          | Scramble               |          |
| Tests             | PHPUnit                |          |
| Database          | SQLite / MySQL / PostgreSQL |     |
