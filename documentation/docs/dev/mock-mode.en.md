# Mock Mode

Mock mode enables complete frontend development without a running backend. All API calls are intercepted by an HTTP interceptor and answered with realistic test data.

---

## Why Mock Mode?

- **Faster development cycle:** No backend setup needed to work on the UI
- **Independent development:** Frontend and backend developers can work in parallel
- **Testing different roles:** Quick switching between Employee, Admin, and Superadmin
- **Deterministic data:** Always the same test data for consistent testing

---

## Starting

### Option 1: Build Configuration

```bash
cd frontend
ng serve --configuration=mock
```

This configuration is defined in `angular.json` and activates mock mode via an environment flag.

### Option 2: URL Parameter

With a normal `ng serve`, mock mode can be activated via URL parameter:

```
http://localhost:4200?mock=true
```

The parameter is stored in the session, so it persists when navigating within the application.

---

## Role Switcher (Mock Toolbar)

In mock mode, a **floating toolbar** appears at the bottom right of the screen with three buttons:

- **Employee** -- Switches to the employee role (standard user)
- **Admin** -- Switches to the admin role (with access to all admin functions)
- **Superadmin** -- Switches to the superadmin role

The role selection is stored in the session and persists during navigation. When switching roles, the page is automatically refreshed so that navigation and visible data match the new role.

---

## Mock Data

Test data is defined in `frontend/src/app/core/mock/mock-data.ts`:

### Users (6)

| ID | Name            | Role        | Vacation Days | Specifics             |
|----|-----------------|-------------|---------------|-----------------------|
| 1  | Anna Admin      | admin       | 30            | --                    |
| 2  | Max Mustermann  | employee    | 30            | --                    |
| 3  | Sarah Schmidt   | employee    | 28            | --                    |
| 4  | Tom Weber       | employee    | 30            | holidays_exempt       |
| 5  | Lisa Braun      | employee    | 30            | weekend_worker        |
| 6  | Superadmin      | superadmin  | 0             | --                    |

### Vacations (8)

Various statuses (approved, pending, rejected) for different users.

### Holidays (9)

German holidays for 2026, a mix of fixed and variable holidays.

### Settings

- Default work days: Monday-Friday
- Weekend free: yes
- Carryover enabled: yes
- Carryover expiry date: March 31

### Work Schedules (1)

Lisa Braun: Jul-Dec 2026, only Wednesday and Thursday.

### Vacation Account

Dynamically generated per user and year (entitlement, carryover, bonus, taken days).

---

## Technical Implementation

### MockService

The `MockService` (`core/mock/mock.service.ts`) manages the mock state:

- Checks if mock mode is active (build configuration or URL parameter)
- Stores the current role in the session
- Provides the current mock user

### MockInterceptor

The `mockInterceptor` (`core/mock/mock.interceptor.ts`) is an Angular HTTP interceptor that:

1. Checks if mock mode is active (`MockService.isActive()`)
2. Passes through non-API requests (e.g., i18n JSON files)
3. Matches API requests by URL and HTTP method
4. Returns matching mock responses with 200ms simulated latency
5. Passes unmatched URLs through to the real backend

### In-Memory State

CRUD operations modify the in-memory state:

- New vacations are added to the `vacations` array
- Deleted vacations are removed from the array
- Changed settings are updated
- ID counters (`nextVacationId`, `nextHolidayId`, etc.) assign sequential IDs

---

## Adding a New Mock Endpoint

To support a new API endpoint in mock mode:

1. **Open** `core/mock/mock.interceptor.ts`
2. **Add a new block** that checks URL and method:

```typescript
// GET /api/new-endpoint
if (method === 'GET' && url.endsWith('/api/new-endpoint')) {
  const data = /* mock data */;
  return of(jsonResponse({ data })).pipe(delay(MOCK_DELAY));
}
```

3. **If needed**, add mock data in `mock-data.ts`
4. **Test** the new endpoint in the browser

!!! tip "Tip"
    Keep mock responses as close as possible to the real API responses. Use the same structure (`{ data: ..., message: ... }`).

---

## Limitations

- **In-memory:** All changes are lost when the page is reloaded
- **No real validation:** The mock interceptor does not perform server-side validation
- **Simplified calculations:** E.g., `workdays` for new vacation requests is set to a fixed value (5) instead of being calculated
- **No CSRF:** Sanctum CSRF token handling is skipped in mock mode
- **200ms latency:** All responses have a fixed delay of 200ms
