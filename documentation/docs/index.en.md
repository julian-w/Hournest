# Hournest -- Team Vacation Management

Hournest is an internal web application for **vacation management** with an already expanded **time tracking and cost center booking** area. It is designed for small companies (under 20 employees).

!!! info "Current Status"
    Vacation management is stable and broadly implemented. Large parts of time tracking, absences, cost centers, locking, blackouts including company-holiday automation, admin reports, and the new working time account are also already implemented. Additional analytics and later expansion stages remain planned.

---

## Key Features

### Dashboard
- Remaining vacation days for the current year
- Open personal requests (status: pending)
- Next planned vacation
- Admin view: pending approval requests, team status (who is absent today/this week)

### Team Calendar
- Monthly view with navigation (forward/back, Today button)
- Color coding: weekends (gray), holidays (highlighted), vacations by status
- Employees see their own vacations plus vacations from shared user groups, admins see all

### Vacation Requests
- Submit requests with from/to date and optional comment
- Validation: no past dates, no overlaps with approved vacations
- Cancellation of pending requests by employees
- Approval/rejection by admins

### Vacation Account (Yearly Ledger)
- Complete booking overview per year: entitlement, carryover, bonus days, taken days, expired
- Automatic remaining vacation carryover with configurable expiry date
- Bonus day bookings only by admin
- Running balance column for transparent balance changes

### Working Time Account
- Yearly ledger with opening balance, daily delta bookings, and manual corrections
- Target time based on individual work schedules, holidays, vacations, absences, and company holidays
- Admins can manage manual adjustments and carryover entries per employee

### Holidays
- Management of fixed and variable holidays by admins
- Holidays are automatically deducted from vacation day calculations
- Exception flag for employees where holidays count as working days

### Work Schedules
- Individual work day periods per employee (e.g., bridge part-time: only Wed+Thu)
- Global default work days (configurable)
- Weekend worker flag for special cases

### Roles and Authentication
- **Employee** -- Default role on first SSO login
- **Admin** -- Automatically assigned on SSO login if email is in the ADMIN_EMAILS list
- **Superadmin** -- Emergency access with local credentials (username/password in `.env`)
- Authentication: OpenID Connect (OIDC) or local email+password login

### Additional Features
- Bilingual: German and English (switchable at runtime)
- Auto-generated API documentation (OpenAPI/Scramble) at `/docs/api`
- Mock mode for frontend development without backend
- Backend test coverage with 385 tests / 1098 assertions

---

## Tech Stack

| Area       | Technology                                   |
|------------|----------------------------------------------|
| Frontend   | Angular 18+, Angular Material, SCSS, ngx-translate |
| Backend    | Laravel 11+, PHP 8.2+                        |
| Database   | SQLite (development), MySQL/PostgreSQL (production) |
| Auth       | OIDC (any provider) or local login, Laravel Sanctum |
| API Docs   | Scramble (auto-generated OpenAPI spec)        |

---

## Project Structure

```
hournest/
├── frontend/              # Angular 18 SPA
│   ├── src/app/
│   │   ├── core/          # Services, Guards, Interceptors, Models, Mock
│   │   ├── features/      # Feature modules (Dashboard, Calendar, Vacation, Admin)
│   └── ...
├── backend/               # Laravel 11 API
│   ├── app/
│   │   ├── Enums/         # UserRole, VacationStatus, HolidayType, LedgerEntryType
│   │   ├── Http/          # Controllers, Middleware, Requests, Resources
│   │   └── Models/        # User, Vacation, Holiday, WorkSchedule, VacationLedgerEntry, Setting
│   ├── database/          # Migrations, Factories, Seeders
│   └── routes/api.php     # API routes
├── documentation/         # MkDocs documentation (this document)
├── .env.example           # Environment variables template
├── CLAUDE.md              # Conventions for Claude Code
└── CONCEPT.md             # Functional concept
```

---

## Further Reading

- **[Prerequisites](home/prerequisites.md)** -- What is needed?
- **[Installation](home/installation.md)** -- Step-by-step guide
- **[Configuration](home/configuration.md)** -- All environment variables explained
- **[End User Guide](user/index.md)** -- Guide for users and admins
- **[Developer Documentation](dev/index.md)** -- Architecture, API, tests, deployment

## Implementation Status Notes

- **Already implemented:** vacations, vacation ledger, working time account, holidays, work schedules, roles, OIDC, local auth, core time tracking, cost centers, favorites, absences, locks, admin reports
- **Partially implemented:** additional convenience features and later analytics stages
- **Still planned:** shift planning and more advanced reports/analytics
