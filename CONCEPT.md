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
  - Current implementation note: the current codebase stores a base `vacation_days_per_year` value on the user and supports year-specific corrections via vacation ledger entries; a dedicated per-year entitlement model is still planned
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
- Time tracking & cost center booking (see below)
- Shift planning
- Reports & analytics

---

## 13. Time Tracking & Cost Center Booking

### Overview

Employees record their **daily working hours** (start, end, break) and distribute that time **by percentage** across assigned cost centers. Admins manage cost centers, assign them to users (directly or via groups), and handle absence management (illness, special leave).

### 13.1 Daily Time Recording

Each working day, the employee records:

| Field | Type | Description |
|-------|------|-------------|
| `date` | DATE | The working day |
| `start_time` | TIME | Work start (e.g. 08:00) |
| `end_time` | TIME | Work end (e.g. 17:00) |
| `break_minutes` | integer | Total break duration in minutes (e.g. 30) |

**Calculated:** `net_working_minutes` = (end - start) - break

- Only one time entry per user per day
- Non-working days (weekends per work schedule) require no entry
- Days fully blocked by absences (vacation, holiday, full-day illness) require no time entry
- Half-day absences: employee records the worked portion only (e.g. morning off sick → records afternoon hours)

#### Target Hours (Soll-Stunden)

Each employee has a **weekly target** defining their contracted working hours.

| Field (on WorkSchedule) | Type | Description |
|--------------------------|------|-------------|
| `weekly_target_minutes` | integer | Contracted weekly working time in minutes (e.g. 2400 = 40h) |

The daily target is derived: `weekly_target_minutes / number_of_work_days` (e.g. 40h / 5 days = 8h/day).

**Global default** (Setting): `default_weekly_target_minutes` (e.g. 2400 for 40h). Applies when no individual schedule is defined.

#### Weekly & Monthly Summary

The UI shows actual vs. target hours:

| | Mon | Tue | Wed | Thu | Fri | **Week Total** |
|---|---|---|---|---|---|---|
| **Actual** | 8:30 | 8:00 | 4:00 | 8:15 | 8:30 | **37:15** |
| **Target** | 8:00 | 8:00 | 8:00 | 8:00 | 8:00 | **40:00** |
| **Delta** | +0:30 | ±0:00 | -4:00 | +0:15 | +0:30 | **-2:45** |

- Green delta = overtime, red = undertime
- Half-day absences: target is halved for that day (4h instead of 8h)
- Full-day absences (vacation, illness, special leave, holiday): target counts as fulfilled (delta = 0)
- Monthly overview aggregates weekly summaries

#### Working Time Account (Arbeitszeitkonto) -- Phase 2c

A **running balance** of overtime and undertime across months.

- Each day's delta (actual - target) feeds into the account
- Balance carries over month to month
- Admin can configure:
  - Maximum positive balance (overtime cap, e.g. +40h)
  - Maximum negative balance (undertime cap, e.g. -20h)
  - Monthly reset or continuous carry-over
- Admin can make manual adjustments with comment (e.g. overtime payout)
- Employee sees their current balance on the dashboard
- Monthly statement showing opening balance, daily deltas, adjustments, closing balance

### 13.2 Cost Centers

| Field | Type | Description |
|-------|------|-------------|
| `id` | PK | |
| `code` | string, unique | Short code (e.g. "PRJ-ALPHA", "INTERN") |
| `name` | string | Display name (e.g. "Project Alpha") |
| `description` | text, nullable | Optional description |
| `is_system` | boolean | System cost center (cannot be deleted or deactivated) |
| `is_active` | boolean | Inactive cost centers are hidden from booking but preserved in history |
| `timestamps` | | |
| `soft_deletes` | | Archival only -- **never hard-delete** (10-year retention in Germany) |

**System cost centers** (created by migration, cannot be modified or deleted):

| Code | Name | Behavior |
|------|------|----------|
| `VACATION` | Vacation | Auto-booked when vacation is approved (currently full day; half-day vacation support is still planned) |
| `ILLNESS` | Illness | Booked via absence management (user reports or admin creates) |
| `SPECIAL_LEAVE` | Special Leave | Booked via absence management (user requests or admin creates) |
| `HOLIDAY` | Holiday | Auto-booked on holidays (except `holidays_exempt` employees) |

System cost centers are **always available** to all users. They are booked exclusively through the absence system -- employees cannot manually book to them.

### 13.3 User Groups

Groups simplify bulk assignment of cost centers to multiple employees.

| Field | Type |
|-------|------|
| `id` | PK |
| `name` | string (e.g. "Development", "Marketing") |
| `description` | text, nullable |

**Pivot tables:**
- `user_group_members`: `user_id`, `user_group_id`
- `user_group_cost_centers`: `user_group_id`, `cost_center_id`

A user's **available cost centers** = directly assigned + via groups + system cost centers.

Admin manages groups in a dedicated admin section:
- Create/edit/delete groups
- Add/remove users to/from groups
- Add/remove cost centers to/from groups

### 13.4 Direct Cost Center Assignment

In addition to group-based assignment, admins can assign cost centers directly to individual users.

**Pivot table** `user_cost_centers`: `user_id`, `cost_center_id`

Both mechanisms (direct + group) work in parallel. The UI merges them into a single list of available cost centers per user.

### 13.5 Favorites & Templates

#### Favorites
Employees can mark cost centers as favorites from their available list.

| Field | Type |
|-------|------|
| `user_id` | FK |
| `cost_center_id` | FK |
| `sort_order` | integer |

In the booking UI, favorites appear at the top, remaining cost centers below.

#### Booking Templates
Employees can save a percentage distribution as a reusable template.

| Field | Type |
|-------|------|
| `id` | PK |
| `user_id` | FK |
| `name` | string (e.g. "Normal day", "Workshop day") |

Template items: `template_id`, `cost_center_id`, `percentage`

Templates can be applied to fill the day's distribution quickly.

### 13.6 Percentage Booking

After recording working hours, the employee distributes the day's net working time across cost centers **by percentage**.

| Field | Type | Description |
|-------|------|-------------|
| `id` | PK | |
| `user_id` | FK | |
| `date` | DATE | Booking day |
| `cost_center_id` | FK | |
| `percentage` | integer (5-100) | Share of the working day |
| `comment` | text, nullable | Optional note |
| `timestamps` | | |

**Rules:**
- Sum of all bookings per user per day must equal **exactly 100%** of the worked portion
- Minimum granularity: **5%** increments
- A day can be split across **multiple** cost centers (e.g. 60% Project A, 40% Project B)
- Days with absences (vacation, illness, special leave, holiday):
  - **Full-day absence:** 100% auto-booked to the corresponding system cost center. No manual booking possible. Day is locked.
  - **Half-day absence:** 50% auto-booked to system cost center. Remaining 50% must be manually distributed across regular cost centers. The absence portion is locked.
- The actual hours per cost center are derived: `net_working_minutes × percentage / 100`

### 13.7 Absence Management

Absences affect time booking by locking days (fully or partially). There are two new absence types managed here; vacation and holidays are handled by existing systems.

#### Absence Types

| Type | Initiated by | Workflow | Covers |
|------|-------------|----------|--------|
| **Illness** | Employee reports **or** admin creates | Employee → admin acknowledges | Sick days, doctor visits |
| **Special Leave** | Employee requests **or** admin creates | Employee → admin approves/rejects | Bereavement, maternity, moving day, marriage, etc. |

Vacation and holidays continue to use their existing workflows (sections 4 and 6) but integrate with time booking via auto-booking.

#### Absence Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | PK | |
| `user_id` | FK | |
| `start_date` | DATE | First day of absence |
| `end_date` | DATE | Last day of absence |
| `type` | enum | `illness`, `special_leave` |
| `scope` | enum | `full_day`, `morning`, `afternoon` |
| `status` | enum | See below |
| `comment` | text, nullable | Reason / note |
| `admin_comment` | text, nullable | Admin's note |
| `reviewed_by` | FK, nullable | Admin who reviewed |
| `reviewed_at` | timestamp, nullable | |
| `timestamps` | | |
| `soft_deletes` | | |

**Status workflows:**

| Type | Statuses | Flow |
|------|----------|------|
| Illness | `reported` → `acknowledged` | Employee reports → admin takes note (no approval needed) |
| Special Leave | `pending` → `approved` / `rejected` | Employee requests → admin decides |
| Both | `admin_created` | Admin creates directly, no workflow needed |

**Effect on time booking:**
- Approved/acknowledged/admin-created absences **lock** the affected days
- Full-day: entire day locked, 100% booked to system cost center
- Morning/afternoon: 50% locked, other half open for regular booking

#### Admin Absence Management

Admins get a dedicated section to:
- View all reported illnesses and special leave requests
- Acknowledge illness reports
- Approve/reject special leave requests
- Create absences directly (e.g. when employee calls in sick by phone)
- View absence history per employee

### 13.8 Locking & Auto-Lock

Time bookings become **locked** after a configurable period to ensure data integrity.

**Rules:**
- **Employees** can edit their bookings until:
  - The admin manually locks the period, **or**
  - The auto-lock period expires (configurable, e.g. 30 days after the booking date)
- **Admins** can always edit any booking, even locked ones
- **Absence-locked days** (vacation, illness, special leave, holiday) cannot be edited by employees regardless of lock status

**Settings:**

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `time_booking_auto_lock_days` | integer | 30 | Days after which bookings are automatically locked (0 = no auto-lock) |

**Admin controls:**
- Manually lock/unlock a month for all employees
- View lock status per employee/month
- Override individual locked bookings

### 13.9 Booking UI (Frontend)

**Weekly view** as the primary interface:

| | Mon 2 | Tue 3 | Wed 4 | Thu 5 | Fri 6 |
|---|---|---|---|---|---|
| **Hours** | 8:00-17:00 (30min) | 8:00-17:00 (30min) | -- VACATION -- | 8:00-12:00 (0min) | 8:00-17:00 (30min) |
| ★ Project Alpha | 60% | 80% | 🔒 | 50% | 60% |
| ★ Internal | 20% | 20% | 🔒 | 50% | 40% |
| Support | 20% | -- | 🔒 | -- | -- |
| **Total** | ✅ 100% | ✅ 100% | 🔒 100% | ✅ 100% | ✅ 100% |

- ★ = Favorite cost centers (shown first)
- 🔒 = Locked (absence day)
- Grayed out: locked/absence days, non-working days
- Red total: if sum ≠ 100%
- Optional month view toggle for overview

**Convenience features:**
- **Copy previous day:** Copies percentage distribution from the last booked day
  - Current implementation note: not implemented yet
- **Copy previous week:** Copies entire week's distribution
  - Current implementation note: implemented
- **Apply template:** Fills in a saved distribution pattern
  - Current implementation note: implemented
- **Quick entry:** If only one cost center is used, auto-fill 100%

### 13.10 Interaction with Existing Systems

#### Vacation System (Section 4)
- When a vacation is **approved**, the affected days are automatically booked to the `VACATION` system cost center
- Half-day vacations: 50% booked to `VACATION`, remaining 50% open for manual booking
  - Current implementation note: half-day vacation support is still planned; current implementation handles full-day vacation auto-booking and holiday precedence
- If a vacation is **cancelled**, the auto-booking is removed and the day becomes editable again

#### Holidays (Section 6)
- On holidays, working days are automatically booked to the `HOLIDAY` system cost center (100%)
- Exception: `holidays_exempt` employees -- holidays are treated as regular working days

#### Work Schedules (Section 7)
- Non-working days (per employee's work schedule) require no time entry or booking
- The booking UI hides non-working days or shows them as disabled

### 13.11 Retention & Archival

**Legal requirement (Germany):** All time tracking and booking data must be retained for **10 years**.

- Cost centers are **soft-deleted** only -- deactivated cost centers remain visible in historical bookings
- Time bookings and absence records are **never deleted**
- The `is_active` flag hides cost centers from new bookings but preserves them in reports and history
- All modifications are tracked via `timestamps` (consider adding an audit log in a later phase)

### 13.12 Reports (Admin)

- **Per employee:** Working hours and cost center distribution for a period
- **Per cost center:** Which employees booked how much time, aggregated
- **Missing entries:** List of employees with incomplete days (no time entry or percentage ≠ 100%)
- **Absence overview:** Illness and special leave per employee, per period
- **CSV export:** For accounting / payroll systems

### 13.13 Dashboard Integration

**Employee dashboard additions:**
- "X unbooked working days this week/month" warning
- Quick link to time booking view
- Current week's booking status (complete / incomplete)

**Admin dashboard additions:**
- "X employees with missing time entries" alert
- Pending illness reports and special leave requests count
- Link to absence management

### 13.14 API Endpoints

```
# Time Recording (Employee)
GET    /api/time-entries?from=&to=              Own time entries for period
PUT    /api/time-entries/{date}                 Create/update day's time entry (start, end, break)
DELETE /api/time-entries/{date}                 Remove time entry (if not locked)

# Cost Center Booking (Employee)
GET    /api/time-bookings?from=&to=             Own bookings for period
PUT    /api/time-bookings/{date}                Save day's distribution [{cost_center_id, percentage, comment}]

# Available Cost Centers (Employee)
GET    /api/cost-centers                        Own available cost centers (direct + groups + system)

# Favorites (Employee)
GET    /api/cost-center-favorites
POST   /api/cost-center-favorites
DELETE /api/cost-center-favorites/{ccId}
PATCH  /api/cost-center-favorites/reorder

# Templates (Employee)
GET    /api/time-booking-templates
POST   /api/time-booking-templates
PATCH  /api/time-booking-templates/{id}
DELETE /api/time-booking-templates/{id}

# Absences (Employee)
POST   /api/absences                            Report illness or request special leave
GET    /api/absences/mine                       Own absence history
DELETE /api/absences/{id}                       Cancel pending request (if not yet reviewed)

# Cost Centers (Admin)
GET    /api/admin/cost-centers                  All cost centers (incl. inactive)
POST   /api/admin/cost-centers
PATCH  /api/admin/cost-centers/{id}
DELETE /api/admin/cost-centers/{id}             Soft-delete only

# User Groups (Admin)
GET    /api/admin/user-groups
POST   /api/admin/user-groups
PATCH  /api/admin/user-groups/{id}
DELETE /api/admin/user-groups/{id}
PUT    /api/admin/user-groups/{id}/members      Set group members
PUT    /api/admin/user-groups/{id}/cost-centers  Set group cost centers

# Direct Assignment (Admin)
GET    /api/admin/users/{id}/cost-centers
PUT    /api/admin/users/{id}/cost-centers       Set user's direct cost centers

# Absence Management (Admin)
GET    /api/admin/absences?status=&type=        All absences (filterable)
PATCH  /api/admin/absences/{id}                 Acknowledge/approve/reject
POST   /api/admin/absences                      Create absence directly
DELETE /api/admin/absences/{id}                 Remove absence (soft delete)

# Time Booking Admin
GET    /api/admin/time-bookings?user_id=&from=&to=  View any user's bookings
PUT    /api/admin/time-bookings/{userId}/{date}      Edit bookings (even locked)
POST   /api/admin/time-lock                          Lock/unlock a period

# Reports (Admin)
GET    /api/admin/reports/time-bookings?from=&to=&group_by=user|cost_center
GET    /api/admin/reports/missing-entries?from=&to=
GET    /api/admin/reports/absences?from=&to=
GET    /api/admin/reports/export?format=csv&from=&to=
```

### 13.15 Phase Planning for Time Tracking

#### Phase 2a (Core)
- Daily time recording (start, end, break)
- Cost center management (CRUD, system cost centers)
- User groups with cost center assignment
- Direct cost center assignment to users
- Percentage booking per day
- Absence management (illness, special leave)
- Locking & auto-lock
- Integration with existing vacation & holiday systems
- Dashboard integration (missing entries warning)

#### Phase 2b (Convenience)
- Favorites & sort order
- Booking templates
- Copy previous day/week
- Reports & CSV export
  - Current implementation note: favorites, booking templates, and copy previous week are implemented; copy previous day remains planned

#### Phase 2c (Future)
- Working time account (Arbeitszeitkonto) with running balance
- Reminders (email/push for missing time entries)
- Budget tracking per cost center
- Audit log for all modifications
- Advanced reports & analytics
