# Settings

Global settings are only accessible to admins and apply to all employees. Individual deviations (e.g., work schedules) are configured per user in [User Management](users.md).

---

## Settings Overview

| Setting                        | Key                        | Description                                         |
|--------------------------------|----------------------------|-----------------------------------------------------|
| Default work days              | `default_work_days`        | Which weekdays are worked by default                |
| Weekend free                   | `weekend_is_free`          | Whether Saturday and Sunday are generally free      |
| Carryover enabled              | `carryover_enabled`        | Whether remaining vacation is carried over to the next year |
| Carryover expiry date          | `carryover_expiry_date`    | Until when carried-over days are valid              |
| Vacation booking for new year  | `vacation_booking_start`   | When vacation for the next year can be booked       |

---

## Default Work Days

Defines the global work days for all employees who do not have an individual work schedule.

**Format:** JSON array with weekday numbers following ISO 8601

| Number | Weekday     |
|--------|-------------|
| 1      | Monday      |
| 2      | Tuesday     |
| 3      | Wednesday   |
| 4      | Thursday    |
| 5      | Friday      |
| 6      | Saturday    |
| 7      | Sunday      |

**Default value:** `[1,2,3,4,5]` (Monday through Friday)

!!! info "Individual Override"
    If an individual work schedule is defined for an employee (under [User Management](users.md)), it overrides the global setting.

---

## Weekend Free

Determines whether Saturday and Sunday are generally considered days off.

- **true** (default) -- Weekends are free and do not count as vacation days
- **false** -- Weekends are working days

!!! note "Note"
    Individual employees can deviate from this global setting with the **weekend_worker** flag. See [User Management](users.md).

---

## Carryover Enabled

Determines whether remaining vacation days are automatically carried over to the next year on January 1st.

- **true** (default) -- Remaining vacation is automatically carried over
- **false** -- Remaining vacation expires at the end of the year

---

## Carryover Expiry Date

Defines until when carried-over vacation days are valid. After this date, carried-over days are booked as **expired**.

**Format:** `DD.MM` (day.month)

**Default value:** `31.03` (March 31st)

**Example:** With the value `31.03`, carried-over vacation days are valid until March 31st of the new year. After this date, they are booked as expired and deducted from the remaining vacation.

!!! tip "No Expiry"
    To keep carried-over vacation days valid indefinitely, the expiry date can be left empty or the carryover can be completely disabled.

---

## Vacation Booking for New Year

Defines when employees can start booking vacation for the next calendar year.

**Format:** `DD.MM` (day.month)

**Default value:** `01.10` (October 1st)

**Example:** With the value `01.10`, employees can request vacation for the following year starting October 1st. Before that, booking is only possible for the current year.

!!! info "Prerequisite"
    Even when the booking start date has been reached, all [holidays](holidays.md) for the following year must be confirmed before vacation requests can be submitted.

---

## Impact of Settings

The global settings affect the following calculations:

1. **Vacation day calculation:** The default work days determine how many working days fall within a vacation period
2. **Calendar display:** Weekends are displayed with a gray background based on the setting
3. **Year-end:** The carryover setting determines whether and for how long remaining vacation is carried over to the new year
4. **Expiry bookings:** After the expiry date, bookings of type "Expired" are automatically created in the vacation account
5. **Booking period:** The booking start determines when vacation for the following year can be booked

---

## Recommendation

!!! warning "Important"
    Changes to global settings affect **all employees** who do not have individual work schedules. Before making changes, review what impact they will have on existing vacation calculations.
