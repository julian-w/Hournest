# Hournest – Project Conventions

## Overview
Hournest is an internal team management app for vacation tracking, time tracking, and shift planning.
Small company (<20 employees). Hosted on Synology NAS (Web Station) or classic PHP hosting.

## Tech Stack
- **Frontend:** Angular 18+ with Angular Material, TypeScript, SCSS
- **Backend:** Laravel 11+ (PHP 8.2+), SQLite, Laravel Sanctum (SPA auth)
- **Auth:** OpenID Connect (OIDC) via Synology SSO Server, using Laravel Socialite with a generic OIDC provider
- **Monorepo:** `/frontend` (Angular) and `/backend` (Laravel)

## Architecture
- Backend serves a REST API under `/api/*`
- Frontend is a standalone Angular SPA, communicates with the backend via API
- Auth flow: Angular redirects to `/api/auth/redirect` → Synology SSO login → callback to `/api/auth/callback` → session cookie via Sanctum
- CORS configured for local dev (Angular on :4200, Laravel on :8000)

## Roles
- `employee` – Default role on first login. Can view team calendar, request vacation, track time.
- `admin` – Can approve/reject vacation requests, manage users, see reports. Set manually in DB or via admin panel.

## Database Conventions
- Use Laravel migrations, snake_case column names
- Soft deletes on Users and Vacations
- All dates stored as `DATE` (not datetime) for vacation entries
- Use Enums for status fields: `pending`, `approved`, `rejected`

## API Conventions
- RESTful endpoints, always prefixed with `/api`
- Use Laravel API Resources for JSON responses
- Use Form Requests for validation
- Return consistent JSON structure: `{ "data": ..., "message": "..." }`
- HTTP status codes: 200 (success), 201 (created), 403 (forbidden), 422 (validation error)

## Frontend Conventions
- Use Angular standalone components (no NgModules)
- Use Angular Material for all UI components
- Use Angular Signals where appropriate
- Lazy-load feature routes
- Services in `/core/services/`, Guards in `/core/guards/`
- Feature folders: `/features/calendar/`, `/features/vacation/`, `/features/admin/`
- Shared components in `/shared/`

## Code Style
- PHP: PSR-12, use strict types
- TypeScript: strict mode, no `any` types
- English everywhere: UI labels, code, variable names, comments, API endpoints

## Testing
- Backend: PHPUnit feature tests for API endpoints
- Frontend: Basic component tests with Jasmine/Karma

## Environment
- All secrets and config via `.env` file (never commit!)
- `.env.example` documents all required variables
