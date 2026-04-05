# Changelog

All notable changes to Hournest are documented on this page.

---

## v0.1.1 (2026-04-05)

### Tests & Quality Assurance

- Backend coverage expanded to **368 tests / 1031 assertions**
- New feature tests for OIDC login, favorites, admin absence management, admin time bookings, yearly maintenance, and cross-system rules
- Frontend specs added for all core services
- Feature components now covered with specs: Login, My Vacations, and Time Tracking

### Time Tracking & System Bookings

- Automatic system bookings added for `VACATION`, `ILLNESS`, `SPECIAL_LEAVE`, and `HOLIDAY`
- Booking templates added for employees: save, apply, update, and delete directly in the weekly view
- New convenience feature `Copy previous day`: reuses the distribution from the latest earlier booked day
- Half-day vacation added: `0.5` vacation days, `50%` `VACATION` system booking, and the remaining `50%` stays manually bookable
- Full effective absences remove existing time entries and lock the day
- Half-day absences create automatic **50% bookings**, while the remaining 50% stays open for manual booking
- Holidays take precedence over vacation on the same day; for holidays-exempt users, vacation remains bookable as normal
- Recalculation improved when holidays are deleted or moved and when absences are removed

### Admin & Validation

- Favorite reordering now has stricter validation
- Admin time booking endpoints now return clean `404` responses for unknown users
- New admin reports for aggregated time bookings, missing entries, and CSV export
- Blackouts/company holidays now have real backend CRUD, server-side freeze validation, and automatic effects in the vacation ledger and time tracking
- Additional negative-path and auto-lock overlap rules are now covered by tests

---

## v0.1.0 (2026-03-26)

### Initial Release

- Dashboard with remaining vacation days, open requests, and next planned vacation
- Monthly calendar with navigation and status colors
- Vacation requests, vacation ledger, and holiday management
- Work schedules, roles, OIDC, and superadmin access
- Bilingual UI, API documentation, mock mode, and responsive design
