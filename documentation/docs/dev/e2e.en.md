# E2E Tests

Hournest uses **Playwright** for browser end-to-end testing.

Why Playwright is a good fit here:

- it exercises real browser behavior instead of only mocked components
- it is stable for modern SPAs
- it gives useful failure artifacts: trace, screenshot, and video
- it helps protect critical user flows such as login, vacation requests, time tracking, and admin reviews

---

## Current Setup

The frontend now includes a Playwright setup:

- configuration: `frontend/playwright.config.ts`
- test directory: `frontend/e2e/`
- browser: Chromium
- local servers:
  - frontend through Angular Dev Server on `http://127.0.0.1:4200`
  - backend through `php artisan serve` on `http://127.0.0.1:8000`

---

## Running The Suite

```bash
cd frontend
npm run e2e
```

Optional modes:

```bash
npm run e2e:headed
npm run e2e:ui
npm run e2e:report
```

---

## Credentials For Authenticated Flows

Authenticated tests use environment variables:

```text
E2E_USERNAME
E2E_PASSWORD
E2E_ROLE
E2E_BASE_URL
E2E_API_URL
E2E_WORKERS
```

Example in PowerShell:

```powershell
$env:E2E_USERNAME='superadmin'
$env:E2E_PASSWORD='replace-me'
$env:E2E_ROLE='superadmin'
npm run e2e
```

Notes:

- authenticated tests are skipped automatically when credentials are missing
- admin tests only run when `E2E_ROLE=admin` or `E2E_ROLE=superadmin`

---

## Current Flows

- unauthenticated redirect to login
- dashboard with a valid session
- time tracking with a valid session
- admin request review screen with an admin or superadmin session
- vacation review with a generated employee, admin approval in the UI, and status verification in the employee UI
- vacation cancellation for an open request in the employee UI
- vacation request creation through the employee UI dialog
- absence review with a generated employee and admin approval
- absence cancellation for an open special-leave request in the employee UI
- absence request creation through the employee UI dialog
- calendar visibility for shared groups while unrelated users stay hidden
- favorite ordering in the time-tracking UI
- weekly booking save flow in time tracking
- saving a template and applying it to another day in time tracking
- copying the previous booked day into the selected day
- vacation rejection with status verification in the employee UI

---

## Runtime Behavior

- locally, Playwright runs with one worker by default so Windows and sandboxed environments do not fail with `spawn` errors
- when the environment is stable enough, parallelism can be increased explicitly through `E2E_WORKERS`

---

## Recommended Next E2E Flows

The next strong candidates are:

1. vacation and absence dialogs with validation and blackout error paths
2. time tracking with copy-from-previous-week and explicit save errors
3. half-day and locked-day scenarios in time tracking as real browser flows
4. admin create flows for absences or other rarer review edge cases

These should gradually cover both happy paths and the most important edge cases.
