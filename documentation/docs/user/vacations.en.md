# Vacation Requests

This page explains how vacation requests are submitted, cancelled, and -- for admins -- approved or rejected.

---

## Requesting Vacation (Step by Step)

1. Navigate to **"My Vacations"** in the side navigation
2. Click the **"Request Vacation"** button
3. A dialog opens with the following fields:
    - **Start date** (required) -- the first vacation day
    - **End date** (required) -- the last vacation day
    - **Comment** (optional) -- e.g., "Summer vacation" or "Family event"
4. Click **"Submit Request"**
5. The request is created with the status **Pending** and appears in your vacation list

!!! tip "Work Day Calculation"
    The number of vacation days is calculated automatically. Weekends and holidays are not counted. If you have an individual work schedule (e.g., only Wed+Thu), only your actual working days are counted.

---

## Validation Rules

The request is validated and may be rejected with an error message:

| Rule                                   | Error Message                                    |
|----------------------------------------|--------------------------------------------------|
| Start date is in the past              | Vacation requests in the past are not allowed     |
| End date is before start date          | The end date must be after the start date         |
| Overlap with approved vacation         | Vacation overlaps with an already approved vacation |
| Holidays not confirmed                 | Not all holidays have been confirmed for this year |
| Vacation freeze active                 | This period falls within a vacation freeze        |

### Holiday Check

Before a vacation request can be submitted, the system checks whether all [holidays](admin/holidays.md) for the relevant year are confirmed. If variable holidays still lack a date, an **orange warning** is displayed and the request is blocked.

### Vacation Planning Check

The system checks whether the selected period conflicts with a [vacation freeze or company holiday](admin/blackouts.md):

- **Vacation Freeze:** The request is **blocked** (red notice)
- **Company Holiday:** A **warning** is shown (orange), the request remains possible

---

## Cancelling a Request

Open requests (status **Pending**) can be cancelled by the employee:

1. Go to **"My Vacations"**
2. Find the desired request in the list
3. Click the **Cancel** button
4. Confirm the cancellation

!!! warning "Important"
    Only requests with the status **Pending** can be cancelled. Requests that have already been approved or rejected cannot be changed by the employee.

---

## Status Meanings

| Status       | Symbol/Color | Meaning                                        |
|--------------|-------------|-------------------------------------------------|
| **Pending**  | Yellow/Amber| Request has been submitted and is waiting for admin review |
| **Approved** | Green       | Request has been approved -- the vacation is confirmed |
| **Rejected** | Red         | Request has been rejected -- possibly with an admin comment |

---

## Vacation List

The **"My Vacations"** page shows a table of all your vacation requests with the following columns:

- **Period** -- From and to date
- **Work days** -- Number of calculated working days
- **Status** -- Pending, Approved, or Rejected
- **Comment** -- Your own comment or the admin's comment
- **Reviewed by** -- Name of the admin who reviewed the request (if applicable)
- **Actions** -- Cancel button (only for pending requests)

---

## Approval/Rejection by Admins

Admins can review open vacation requests from all employees:

1. Navigate to **"Requests"** in the side navigation (only visible for admins)
2. The list shows all requests with status **Pending**
3. For each request, two actions are available:
    - **Approve** -- sets the status to Approved and automatically creates a ledger entry in the vacation account
    - **Reject** -- sets the status to Rejected, optionally with a comment explaining the reason

!!! info "Vacation Account"
    Upon approval, a **Taken** entry is automatically created in the employee's vacation account. The number of working days is calculated based on the employee's individual work schedule.
