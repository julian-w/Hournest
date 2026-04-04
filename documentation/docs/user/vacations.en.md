# Vacation Requests

This page explains how vacation requests are submitted, cancelled, and reviewed by admins.

---

## Requesting Vacation

1. Navigate to **"My Vacations"**
2. Click **"Request Vacation"**
3. Fill in:
   - **Start date**
   - **End date**
   - **Comment** optional
4. Submit the request

The request is created with status **Pending**.

!!! tip "Work Days"
    Vacation days are calculated based on your actual working days. Weekends and holidays are not counted as vacation days.

---

## Validation Rules

A request may be rejected or blocked if:

- the start date is in the past
- the end date is before the start date
- the range overlaps with already approved vacation
- not all holidays are confirmed for the relevant year
- a vacation freeze is active

### Holiday Check

If variable holidays for the year are still missing confirmed dates, a warning is shown and the request is blocked.

### Vacation Freezes and Company Holidays

- **Vacation freeze:** blocks the request
- **Company holiday:** shows a warning, but the request remains possible

---

## Cancelling a Request

Only requests with status **Pending** can be cancelled by the employee.

---

## Status Meanings

| Status | Meaning |
|--------|---------|
| **Pending** | Request is waiting for review |
| **Approved** | Request has been approved |
| **Rejected** | Request has been rejected |

---

## Vacation List and Vacation Ledger

The **"My Vacations"** page shows:

- the list of your vacation requests
- your current remaining vacation days
- the vacation ledger for the selected year

The ledger includes entitlement, carryover, expiry, adjustments, and taken days.

---

## Admin Review

Admins can approve or reject open requests.

When a request is approved:

- a **Taken** entry is created in the vacation ledger
- affected working days are automatically booked to the `VACATION` system cost center
- existing manual time bookings on those days are removed
- existing time entries on those days are removed

---

## Holidays and Time Tracking

Holidays take precedence over vacation on the same day:

- if an approved vacation day falls on a holiday, the `HOLIDAY` booking remains in place for that date
- holidays do not count as vacation days
- for holidays-exempt users, holidays are treated as normal working days instead
