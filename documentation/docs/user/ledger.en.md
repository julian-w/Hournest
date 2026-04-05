# Vacation Account

The vacation account shows a complete yearly overview of all bookings that affect an employee's vacation entitlement. Every change -- whether annual entitlement, carryover, taken vacation, or bonus days -- is recorded as a separate booking.

---

## Yearly Overview

The vacation account shows a chronological list of all bookings per year. Each row includes a running balance so you can see immediately how every change affects the remaining vacation. The sum of all bookings results in the **current remaining vacation**.

### Example

| Date        | Type          | Days  | Balance | Comment                      |
|-------------|---------------|-------|---------|------------------------------|
| 01/01/2026  | Entitlement   | +30   | 30      | Annual entitlement 2026      |
| 01/01/2026  | Carryover     | +3    | 33      | Remaining from 2025          |
| 02/15/2026  | Bonus         | +1    | 34      | Extra day for company anniversary |
| 03/15/2026  | Taken         | -5    | 29      | 03/23 - 03/27/2026           |
| 04/01/2026  | Taken         | -10   | 19      | 04/06 - 04/17/2026           |

---

## Booking Types

Each booking in the vacation account has a type that describes the kind of change:

Entitlement
:   The annual base entitlement to vacation days. Typically booked on January 1st of each year. Positive number (e.g., +30).

Carryover
:   Remaining vacation days from the previous year that are carried over to the new year. Automatically booked on January 1st. Positive number (e.g., +3).

Bonus
:   Additional vacation days manually granted by the admin. Used for company events, special occasions, or bonuses. Positive number (e.g., +1).

Taken
:   Approved vacation days that are deducted. Automatically created when a vacation request is approved. Negative number (e.g., -5).

Expired
:   Carried-over days that have expired after the configured expiry date. Negative number.

Adjustment
:   Manual correction booking by the admin. Can be positive or negative. Used for exceptional cases.

---

## Remaining Vacation Calculation

The remaining vacation is the sum of all bookings for a year:

```
Remaining = Entitlement + Carryover + Bonus - Taken - Expired +/- Adjustments
```

!!! info "Fallback Calculation"
    If no bookings exist for a year in the vacation account, the remaining vacation is calculated as a fallback from the base settings: `Vacation days per year - approved vacation days`.

---

## Admin: Managing the Vacation Account

Admins can open an employee's vacation account from user management. The dialog shows the complete booking list with balance.

### Adding an Entry

1. Open an employee's vacation account from [User Management](admin/users.md)
2. Select the year
3. Fill in the form fields at the bottom:
    - **Type** -- Booking type (e.g., Bonus, Adjustment)
    - **Days** -- Number of days (positive to add, negative to deduct)
    - **Comment** -- Reason for the booking
4. Click **"Add"**

### Deleting an Entry

1. Click the **Delete icon** next to the entry
2. The entry is removed and the balance is updated

!!! warning "Caution"
    Deleting entries changes the vacation account balance. Verify that the remaining balance is correct before deleting.

---

## Vacation Carryover

On January 1st of each year, remaining vacation days are automatically carried over as a **Carryover** entry to the new year.

### Expiry

The expiry of carried-over vacation days is configurable (by the admin under [Settings](admin/settings.md)):

- **With expiry date:** Carried-over days expire after a specific date (e.g., March 31st). After this date, a booking of type **Expired** is created.
- **Without expiry:** Carried-over days are retained indefinitely.

---

## Note for Employees

!!! note "Read-only"
    The vacation account is **read-only** for employees. Bookings can only be created or changed by admins. If you have questions about your vacation account, please contact your administrator.

---

## Year Selection

At the top of the page, the display year can be selected. This allows viewing bookings from previous years as well.
