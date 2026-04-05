# Test Matrix

This matrix links product features to the tests that currently anchor them. It is not meant to replace line-by-line coverage, but to make business-level gaps easier to spot.

Legend:

- `Strong` = multiple targeted tests, including edge cases or calculation rules
- `Medium` = central cases are covered, edge cases may not be complete
- `Light` = only partial aspects or contract/smoke-style tests
- `No known coverage` = no clear documented test anchor right now

---

## Product Features and Test Anchors

| Area | Feature | Backend Tests | Frontend Specs | Assessment | Notes / likely gap |
|------|---------|---------------|----------------|------------|--------------------|
| Auth | Local login, logout, password change | `AuthTest` | `login.component.spec.ts` | Strong | Covers UI and API flow |
| Auth | OIDC login and provisioning | `AuthOidcTest` | No known coverage | Medium | Frontend is less critical here, but UI trigger coverage is light |
| Dashboard | Personal start page with KPIs | No known coverage | `dashboard.component.spec.ts` | Medium | Employee and admin dashboard variants are now covered as UI flows |
| Vacation | Requesting, validation, cancellation | `VacationTest` | `my-vacations.component.spec.ts` | Strong | Good end-to-end-like coverage |
| Vacation | Half-day vacation | `VacationTest`, `CrossSystemTest` | `my-vacations.component.spec.ts`, `time-tracking.component.spec.ts` | Strong | Good system coverage |
| Vacation | Email notifications on request and review | `VacationTest`, `AdminTest` | No known coverage | Medium | Covered on the backend for admin notifications on new requests and employee notifications on review |
| Vacation | Group-based calendar visibility | `VacationTest` | `calendar.component.spec.ts` | Strong | Both the backend rule and the visible UI hint are now covered |
| Vacation | Admin review of open requests | `AdminTest` | `admin-requests.component.spec.ts` | Strong | Review logic and the central UI actions are now both covered |
| Vacation Ledger | Ledger entries, remaining balance, adjustments | `VacationLedgerTest`, `YearlyMaintenanceTest` | `my-vacations.component.spec.ts` | Strong | Business behavior is well covered |
| Working Time Account | Delta calculation and ledger | `WorkTimeAccountTest`, `CrossSystemTest` | `time-tracking.component.spec.ts` | Strong | Good rules coverage |
| Holidays | Management and filtering | `HolidayTest` | `holiday.service.spec.ts`, `admin-holidays.component.spec.ts` | Strong | Backend, service, and central admin UI flows are covered |
| Settings | Global configuration | `SettingTest` | `settings.service.spec.ts`, `admin-settings.component.spec.ts` | Strong | Backend, service, and admin UI load/save flows are covered |
| Work Schedules | Individual work days and weekly targets | `WorkScheduleTest`, `WorkTimeAccountTest` | `work-schedule.service.spec.ts`, `time-tracking.component.spec.ts` | Strong | Good backend coverage |
| Blackouts | Vacation freezes and company holidays | `BlackoutTest`, `CrossSystemTest` | `blackout.service.spec.ts`, `time-tracking.component.spec.ts`, `admin-blackouts.component.spec.ts` | Strong | Critical rules plus the central admin UI flows are covered |
| Time Tracking | Daily entry and locking | `TimeEntryTest` | `time-tracking.component.spec.ts` | Strong | Good business-rule coverage |
| Time Tracking | Percentage bookings | `TimeBookingTest` | `time-tracking.component.spec.ts` | Strong | Core logic plus important save/error paths in the UI are covered |
| Time Tracking | Templates | `TimeBookingTemplateTest` | `time-tracking.component.spec.ts`, `time-booking-template.service.spec.ts` | Strong | Good functional coverage |
| Cost Centers | CRUD and system protection | `CostCenterTest` | `cost-center.service.spec.ts`, `admin-cost-centers.component.spec.ts` | Strong | Backend, service, and central admin UI flows are now covered |
| Cost Centers | Favorites | `CostCenterFavoriteTest` | `cost-center.service.spec.ts`, `time-tracking.component.spec.ts` | Strong | Backend, service, and visible ordering in the time-tracking grid are covered |
| User Groups | Groups, members, cost centers | `UserGroupTest` | `admin.service.spec.ts`, `admin-user-groups.component.spec.ts` | Strong | Backend, service, and core UI workflows are covered |
| Users | Create, update, delete users | `AdminTest` | `admin.service.spec.ts`, `admin-users.component.spec.ts` | Strong | Critical admin workflows are now also visibly covered in the UI |
| Absences | Illness, special leave, half days | `AbsenceTest`, `AbsenceAdminManagementTest`, `CrossSystemTest` | `absence.service.spec.ts`, `my-absences.component.spec.ts`, `admin-absences.component.spec.ts`, `time-tracking.component.spec.ts` | Strong | Domain logic plus the personal and administrative UIs are now directly covered |
| Reports | Time bookings, missing entries, absences, and export | `AdminReportTest` | `admin-reports.component.spec.ts`, `admin.service.spec.ts` | Strong | Reporting area is well covered, including the absence report |
| Security | Security headers, roles, protection rules | `SecurityTest` | No known coverage | Medium | Frontend is less relevant here |

---

## Visible Testing Gaps

These areas look like the most likely next improvements:

- Some specialized screens are still covered more through services than as direct UI components.
- Additional time-tracking support flows and rarer edge-case paths now look like the next candidates for more UI coverage.

---

## Maintenance Rule

When a new business feature is added:

1. add it to the feature inventory
2. add its test anchor to this matrix
3. record missing tests explicitly as a gap instead of leaving them implicit
