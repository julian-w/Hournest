# Feature Inventory

This page describes Hournest's main product areas in a way that can be compared directly against tests and known gaps.

Goals:

- name features in compact business language
- record the current implementation status
- mirror them later against the test matrix

---

## How To Use It

Every larger feature should ideally have three things:

1. an entry in this inventory
2. an entry in the test matrix
3. a clearly named gap or planned extension if it is only partially implemented

If one of these is missing, that is a good signal for follow-up work.

---

## Core Features

| Area | Feature | Status | Notes |
|------|---------|--------|-------|
| Auth | OIDC login | Implemented | Standard mode for production usage |
| Auth | Local login | Implemented | Includes forced password change on first login |
| Auth | Superadmin emergency access | Implemented | Always available regardless of OIDC mode |
| Dashboard | Personal start page | Implemented | KPIs for remaining vacation, open requests, and next vacations; admins also see team status |
| Vacation | Submit vacation requests | Implemented | Including comment and validations |
| Vacation | Half-day vacation | Implemented | Morning/afternoon, single-day only |
| Vacation | Cancel open requests | Implemented | Only for own pending requests |
| Vacation | Admin approval/rejection | Implemented | Includes review comment |
| Vacation | Email notifications for request and review | Implemented | Admins receive new requests, employees receive the review result |
| Vacation | Group-based calendar visibility | Implemented | Employees see their own approved vacations plus shared-group vacations |
| Vacation | Vacation freezes and company holidays | Implemented | Enforced server-side |
| Vacation Ledger | Yearly entitlement, carryover, expiry | Implemented | Via ledger and maintenance routine |
| Vacation Ledger | Manual adjustments/bonus days | Implemented | Admin-managed |
| Working Time Account | Yearly ledger with deltas and adjustments | Implemented | Including carryover and manual corrections |
| Holidays | Fixed and variable holidays | Implemented | Variable holidays are year-specific |
| Work Schedules | Individual work days | Implemented | With periods and weekly targets |
| Users | Create, update, delete users | Implemented | Roles, vacation days, flags |
| Users | User groups | Implemented | Member and cost center assignment |
| Time Tracking | Daily entry for start/end/break | Implemented | One entry per day |
| Time Tracking | Percentage-based cost center booking | Implemented | 100% rule, including half-day cases |
| Time Tracking | Booking templates | Implemented | User-owned templates |
| Time Tracking | Favorites | Implemented | Save frequently used cost centers |
| Absences | Report illness | Implemented | Includes admin acknowledgment |
| Absences | Request special leave | Implemented | Reviewed by admin |
| Absences | Manage own absences | Implemented | Personal overview with cancellation for reported or open entries |
| Absences | Half-day scenarios | Implemented | Combined with absences and vacation |
| Reports | Time booking report | Implemented | Grouped by user or cost center |
| Reports | Missing entries report | Implemented | For admin review |
| Reports | Absence report | Implemented | Filterable by period, employee, type, and status |
| Reports | CSV export | Implemented | For admin reports |
| Planning | Shift planning | Planned | Not implemented yet |
| Notifications | Additional channels beyond email | Planned | E.g. messenger/WhatsApp |
| Analytics | Advanced analytics | Planned | Beyond the current reports |

---

## Maintenance Rules

- Add new end-user functionality here first
- Then add it to the test matrix
- Use explicit status values for larger features: `Implemented`, `Partial`, `Planned`
- `Partial` should always name the missing aspect clearly
