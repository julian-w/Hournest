# Changelog

All notable changes to Hournest are documented on this page.

---

## v0.1.0 (2026-03-26)

### Initial Release

**Dashboard**

- Dashboard with remaining vacation days, open requests, and next planned vacation
- Admin view with pending approval requests and team status

**Calendar**

- Monthly calendar with navigation (forward/back, Today button)
- Color highlighting for holidays and vacations by status
- Weekends with gray background

**Vacation Requests**

- Submit vacation requests with from/to date and optional comment
- Cancellation of pending requests by employees
- Approval and rejection by admins with comment
- Validation: no past dates, no overlap

**Vacation Account**

- Yearly ledger with entitlement, carryover, bonus days, taken days, and expiry
- Automatic remaining vacation carryover with configurable expiry date
- Bonus and adjustment bookings by admin

**Holidays**

- Management of fixed and variable holidays
- Holidays are considered in vacation day calculations
- Holidays exempt flag per employee

**Work Schedules**

- Individual work schedules per employee with time periods
- Global default work days (configurable)
- Weekend worker flag

**Authentication and Roles**

- OpenID Connect login (any OIDC provider)
- Superadmin emergency access with local credentials
- Three roles: Employee, Admin, Superadmin
- Automatic role assignment based on admin email list

**Other**

- Bilingual: German and English (switchable at runtime)
- Auto-generated API documentation (OpenAPI/Scramble)
- Mock mode for frontend development without backend
- 28 backend tests (PHPUnit)
- Responsive design (desktop, tablet, mobile)
