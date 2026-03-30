# User Management

User management is only accessible to admins and enables the management of all employee settings.

---

## User List

The user list shows all registered users with the following information:

| Column                | Description                                     |
|-----------------------|-------------------------------------------------|
| Name                  | Display name of the user                        |
| Email                 | Email address of the user                       |
| Role                  | Employee, Admin, or Superadmin                  |
| Vacation days/year    | Annual vacation entitlement                     |
| Remaining vacation    | Remaining vacation days in the current year     |

---

## Editing a User

Clicking on a user opens the detail view with the following settings:

### Changing the Role

The role of a user can be toggled between **Employee** and **Admin**.

!!! warning "Note"
    The role change takes effect immediately. The user will receive the new role with the corresponding permissions on the next page load.

### Vacation Days Per Year

The annual vacation entitlement can be set individually per user. The default value is taken from the `.env` variable `DEFAULT_VACATION_DAYS_PER_YEAR` (default: 30 days).

### Holidays Exempt (holidays_exempt)

When this flag is enabled, **holidays count as normal working days** for this employee. This means:

- Holidays are still marked in the calendar
- However, holidays are **not** deducted when calculating vacation days
- Typical use case: employees who must work on holidays

### Weekend Worker (weekend_worker)

When this flag is enabled, **Saturday and Sunday count as working days** for this employee, regardless of global settings or individual work schedules.

---

## Work Schedules

Work schedules define which weekdays an employee works. They are created as periods with a start date and optional end date.

### Default Work Days

If no individual work schedule is defined, the global default work days apply (configured under [Settings](settings.md)). Typically Monday through Friday (1-5).

### Individual Periods

For employees with special working hours (e.g., bridge part-time), periods can be created:

**Example:** An employee works only Wednesday and Thursday from July to December 2026:

- **Start date:** 07/01/2026
- **End date:** 12/31/2026
- **Work days:** Wednesday (3), Thursday (4)

### Managing Periods

| Action    | Description                                                 |
|-----------|-------------------------------------------------------------|
| Create    | New period with start date, optional end date, and work days |
| Edit      | Modify an existing period                                    |
| Delete    | Remove a period                                              |

!!! info "Work Days Encoding"
    Weekdays are encoded as numbers following ISO 8601: 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday, 7 = Sunday.

### Impact on Vacation Calculation

If an employee works only Wed+Thu, a vacation request for a full week will only deduct **2 working days** from the vacation account (instead of 5).

---

## Managing Vacation Accounts

Admins can create bookings in the vacation account for each user:

### Creating a New Booking

1. Select the user in the user list
2. Navigate to the "Vacation Account" section
3. Click "New Booking"
4. Fill in the fields:
    - **Year** -- the affected booking year
    - **Type** -- booking type (e.g., Bonus, Adjustment, Entitlement, Carryover, Expired)
    - **Days** -- number of days (positive for credit, negative for deduction)
    - **Comment** -- description of the booking

### Typical Use Cases

- **Grant bonus vacation:** Type = Bonus, Days = +1, Comment = "Company event"
- **Correction:** Type = Adjustment, Days = +2, Comment = "Correction from previous year"
- **Book annual entitlement:** Type = Entitlement, Days = +30, Comment = "Annual entitlement 2026"
- **Book carryover:** Type = Carryover, Days = +3, Comment = "Remaining from 2025"

---

## Creating a User

A **"Create User"** button appears above the user list.

| Field | OAuth Mode | Local Mode |
|-------|------------|------------|
| Name | Required | Required |
| Email | Required (must be unique) | Required (must be unique) |
| Role | Required | Required |
| Vacation days/year | Optional (default: 30) | Optional (default: 30) |
| Default Password | Not needed | Required (min. 8 characters) |

**OAuth mode (pre-provisioning):** Users can be created in advance to set vacation days, role and other settings before their first SSO login. On first SSO login, the user is matched by email and automatically linked to the OIDC account.

**Local mode:** The new user must change their default password on first login.

---

## Deleting a User

In the actions column of each user, there is a **delete icon**. Deleted users are soft-deleted (can be restored in the database). The superadmin and your own account cannot be deleted.

---

## Resetting a Password (Local Auth Mode Only)

In the actions column of each user, there is a **lock icon** to reset the password. After resetting, the user must change their password on next login.
