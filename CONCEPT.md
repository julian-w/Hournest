# Hournest -- Full Concept

## 1. Roles & Authentication

### Auth Modes

Controlled via `AUTH_OAUTH_ENABLED` in `.env`:

| Mode | Description |
|------|-------------|
| **OAuth (default)** | Login via an external OIDC provider (e.g. Keycloak, Azure AD, SSO Server). Users are automatically created on first login. |
| **Local** | Email + password. Admins create users manually with a default password. Users must change their password on first login. |

### Roles

| Role | Access | Assignment |
|------|--------|------------|
| **Employee** | OAuth or email+password | Default role on first login (OAuth) or when created by admin (local) |
| **Admin** | OAuth or email+password | OAuth: email in `ADMIN_EMAILS`; Local: assigned during user creation |
| **Superadmin** | Username + password | Credentials in `.env` (`SUPERADMIN_USERNAME`, `SUPERADMIN_PASSWORD`), emergency access, always available |

### Login Flow

- **OAuth mode:** Login page shows a prominent "Sign in with SSO" button -> OpenID redirect -> account is automatically created/updated. Admin detection: on each SSO login, the email is checked against `ADMIN_EMAILS`.
- **Local mode:** Login page shows an email + password form. Users are created by admins in the admin panel. New users must change their password on first login.
- **Superadmin:** Always available regardless of auth mode. In OAuth mode behind an expandable "Admin Login" panel, in local mode via the same form.
- **Password change:** In local mode, users can change their password anytime via a button in the toolbar. Admins can reset passwords.

---

## 2. Dashboard (Home Page After Login)

### All Employees
- Remaining vacation days (current year)
- Open own requests (pending)
- Next planned vacation

### Admin (Additional)
- Pending vacation requests (from all employees)
- Team status (who is absent today/this week)

---

## 3. Calendar

### Monthly View
- Navigation: month forward/back, "Today" button
- Color highlights:
  - **Weekends:** Gray background
  - **Holidays:** Highlighted
  - **Vacations:** Color-coded by status (Pending, Approved, Rejected)

### Visibility
- **Phase 1:** Employee sees only own vacations, admin sees all
- **Phase 2:** Groups -- within a group, everyone sees vacations of other group members

---

## 4. Vacation Requests

### Submitting a Request
- Fields: from date, to date, comment (optional)
- Validation:
  - No vacation in the past
  - End date >= start date
  - No overlap with own approved vacations

### Review by Admin
- Approve or reject
- Comment field on approval/rejection
- Email notification to the employee

### Cancellation
- Employee can cancel own pending requests

---

## 5. Vacation Account (Annual Ledger)

Per employee and year, a complete list of all bookings:

| Type | Example | Days |
|------|---------|------|
| Annual entitlement | Base entitlement 2026 | +30 |
| Carryover | Remaining from 2025 | +3 |
| Bonus | Extra day for company event | +1 |
| Vacation taken | Approved: 06.04.-10.04.2026 | -5 |
| | | **= 29 remaining** |

- Every booking has a **comment** for traceability
- **Bonus / extra days:** Only admin can create these bookings
- Employee sees the ledger as a yearly overview (**read-only**, no disputing)

### Vacation Carryover
- **Automatic** on January 1st of the following year: remaining days are booked as a "carryover" entry into the new year
- **Expiry configurable (admin):**
  - Expiry date configurable (e.g. "carryover expires on March 31") -- after this date, carried-over days are booked as expired
  - Or: unlimited (no expiry)
  - Global setting, applies to all employees

### Maintenance Routine (`php artisan hournest:yearly-maintenance`)
- **Automates** annual entitlement, carryover and expiry for all employees
- **Idempotent:** Can be run multiple times for the same year without duplicate bookings
- **Options:** `--year=2026` (target year), `--dry-run` (show only, no bookings)
- **Scheduler:** Runs automatically on Jan 1st at 00:30 (entitlement + carryover) and monthly on the 1st at 01:00 (expiry check)
- Prerequisite: `crontab -e` with `* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1`

---

## 6. Holidays

### Management (Admin)
- Two types:
  - **Fixed:** Always on the same date (e.g. January 1st, October 3rd)
  - **Variable:** Different date each year (e.g. Easter Monday, Ascension Day)
- Admin manages holidays via a list in the admin panel
- Variable holidays must be entered annually or calculated via formula

### Effect
- Holidays are **not** counted as vacation days in calculations
- **Exception:** Employees with the "holidays exempt" flag -- for these, holidays count as regular working days

---

## 7. Work Schedule Configuration

### Global Setting (Admin)
- Define whether Sat/Sun are default days off or working days

### Per Employee
- **Default:** Global settings apply (e.g. Mon-Fri)
- **Individual:** Work schedule periods with date ranges
  - Example: bridge part-time: "01.07.-31.12.2026: Wed+Thu only"
  - If no period is defined, global settings apply
  - Periods can be time-limited
- **Weekend exception:** Individual employees can have Sat/Sun as working days, even when globally off

### Effect on Vacation Calculation
- Vacation days are only counted for the employee's individual working days
- Example: employee works only Wed+Thu -> 1 week vacation = 2 vacation days

---

## 8. User Management (Admin)

### Overview
- List of all employees with: name, email, role, vacation days/year, remaining vacation

### Editable
- Role (Employee/Admin)
- Vacation days per year, **adjustable per year** (e.g. 2026: 30, 2027: 28)
- Individual work schedules (periods)
- Holidays exempt (checkbox)
- Weekend exception
- Bonus vacation bookings with comment

### Creating Users (Both Auth Modes)
- **OAuth mode (pre-provisioning):** Admin can create users in advance to set vacation days, role and work schedules before the first SSO login. On first SSO login, the user is matched by email and linked to the OIDC account.
- **Local mode:** Admin creates users with name, email, role, vacation days and a default password. User must change password on first login.
- **Password generation:** Admin can set a custom password or use the generate button to create a random one.

### Deleting Users
- Admin can delete users (soft delete). Superadmin and own account cannot be deleted.

### Password Management (Local Auth Mode Only)
- **Reset password:** Admin can reset a user's password (user must change it on next login)

---

## 9. Notifications

### Phase 1: Email
- Employee is notified on: approval, rejection
- Admin is notified on: new vacation request

### Phase 2: Additional Channels
- WhatsApp or similar messengers
- System is abstract (Laravel Notification System), so new channels can be easily added

---

## 10. Internationalization (i18n)

- **German + English** switchable at runtime
- Language switcher in toolbar
- Frontend-side via `ngx-translate` (runtime switching, no separate build)
- Backend delivers only data keys, no translated texts

---

## 11. Technical Architecture

### Tech Stack
- **Frontend:** Angular 18+, Angular Material, SCSS, ngx-translate
- **Backend:** Laravel 11+, PHP 8.2+, Laravel Sanctum (SPA auth)
- **Database:** SQLite (dev/test), MySQL/PostgreSQL (production) -- configurable via `.env`
- **Auth:** Two modes: OpenID Connect (any OIDC provider) or local email+password authentication, controlled via `AUTH_OAUTH_ENABLED`
- **API docs:** Scramble (auto-generated OpenAPI spec at `/docs/api`)

### Responsive
- Desktop + tablet + mobile (responsive, no PWA)

---

## 12. Phase Planning

### Phase 1 (Current)
- Login (SSO + Superadmin + local auth)
- Dashboard
- Calendar (monthly view)
- Vacation requests (submit, cancel, approve, reject)
- Vacation account with annual ledger
- Holiday management
- User management (work schedules, vacation days, roles, create, delete)
- Yearly maintenance routine (entitlement, carryover, expiry)
- Email notifications
- i18n (DE/EN)

### Phase 2 (Planned)
- Group visibility in calendar
- Additional notification channels (WhatsApp, etc.)
- Time tracking / hour booking
- Shift planning
- Reports & analytics
