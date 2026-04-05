# Time Tracking

This page explains how to record working hours in the weekly view, distribute time by percentage across cost centers, and handle locked days.

---

## Opening the Weekly View

1. Navigate to **"Time Tracking"** in the side navigation
2. The current calendar week is loaded automatically
3. Use the **arrow buttons** or the **Today button** to switch between weeks

The weekly view shows all seven days with working hours, cost center allocations, and a weekly summary.

---

## Recording Working Hours

For each working day, the following values can be entered:

1. **Start time** -- beginning of the work day
2. **End time** -- end of the work day
3. **Break** -- break duration in minutes

Net working time is calculated automatically: **End time − Start time − Break**.

!!! tip "Direct Saving"
    Changes to start time, end time, or break are saved directly when the field changes.

---

## Actual/Target/Delta Display

A summary is shown at the bottom of the weekly view:

| Value | Meaning |
|-------|---------|
| **Actual** | Recorded working time for the week |
| **Target** | Expected working time based on the stored work schedule and effective day rules |
| **Delta** | Difference between actual and target |

Target time takes individual work schedules, holidays, approved vacation, effective absences, and company holidays into account. Fully covered days reduce the target to `0`, half-day cases to `50%`.

---

## Cost Center Allocation

Below the working hours, available cost centers are shown as rows. For each day, you enter a **percentage value** per cost center.

1. First record the working hours for the day
2. Split the time across one or more cost centers
3. Enter the distribution in **5% increments**

!!! warning "100% Rule"
    The total of all bookings for a day must equal exactly **100%** of the manually bookable part of the day. On half-day absences, that means exactly **50%** must be booked manually.

---

## Favorites, Templates, and Copy Earlier Bookings

Three features help with recurring allocations:

- **Favorites** -- Favorite cost centers are shown first in the grid
- **Booking Templates** -- Save a day's percentage distribution and apply it to other days
- **Copy Previous Day** -- Copies the allocation from the latest earlier booked day into the selected day
- **Copy Previous Week** -- Copies the previous week's percentage distribution into the current week

!!! tip "Favorites"
    Favorites are managed outside the weekly grid. In time tracking they are shown at the top automatically.

### Using Booking Templates

Templates are managed directly from the action area of the weekly view:

1. Select a **template day**
2. Choose an existing **template** or save the current day's allocation as a new template
3. Apply the template to the selected day or update the selected template from the current day

Templates only store the **cost center distribution** of a day, not the working hours.

!!! info "Template CRUD"
    Employees can create, update, and delete their own booking templates. System cost centers such as `VACATION` or `HOLIDAY` cannot be part of a template.

### Copying Earlier Bookings

Two copy helpers are now available for the selected day:

- **Copy Previous Day** looks for the latest earlier booked day and copies its cost center distribution
- **Copy Previous Week** copies the previous calendar week's distribution day by day

---

## Locked Days

Certain days cannot be edited or can only be edited partially:

| Reason | Effect |
|--------|--------|
| **Approved Vacation** | Full days are automatically booked to `VACATION`, half days only book 50% |
| **Illness** | Effective illness days are automatically booked to `ILLNESS` |
| **Special Leave** | Effective special leave days are automatically booked to `SPECIAL_LEAVE` |
| **Holiday** | Working days on holidays are automatically booked to `HOLIDAY` |
| **Month Close / Auto-lock** | Changes are no longer allowed after manual or automatic locking |

!!! info "Automatic System Bookings"
    Days locked by vacation, absences, and holidays are automatically booked to the matching system cost center.

---

## Half-Day Absences

Half-day illness, half-day special leave, or half-day vacation only lock **50%** of the day:

- The system creates an automatic **50% booking** on the matching system cost center
- The remaining **50%** must be booked manually to regular cost centers
- Manual bookings totaling **100%** are not allowed on such days

---

## Saving

The weekly view uses two save modes:

- **Direct saving** of working hours when values change
- **"Save all"** for weekly percentage allocations

Only days with valid totals are saved. Days without bookings or with invalid totals are skipped.

---

## Working Time Account

Below the weekly view there is a collapsible **working time account** for the selected year.

The table shows each relevant change with a running balance:

| Column | Meaning |
|--------|---------|
| **Date** | Effective date of the entry |
| **Type** | For example opening balance, daily delta, correction, or carryover |
| **Change** | Minute delta, positive or negative |
| **Balance** | Account balance after this entry |
| **Comment** | Additional reason or note |

Fully or partially credited days such as **holidays**, **company holidays**, **approved vacation**, or **effective absences** now also appear as their own rows. This makes it easier to understand why no negative balance was created for a day or why the target time was reduced.

The working time account is **read-only** for employees. Admins can manage manual corrections and carryover entries in user management.

---

## Time Tracking Status

| Status | Meaning |
|--------|---------|
| **Open** | The day has not been fully recorded yet |
| **Complete** | Working time and cost centers are recorded correctly |
| **Locked** | The day is locked due to absence, holiday, or month close |
