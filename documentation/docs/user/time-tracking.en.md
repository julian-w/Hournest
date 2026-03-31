# Time Tracking

This page explains how to record working hours in the weekly view, assign cost centers, and monitor actual vs. target hours.

---

## Opening the Weekly View

1. Navigate to **"Time Tracking"** in the side navigation
2. The current calendar week is loaded automatically
3. Use the **arrow buttons** or the **calendar button** to switch between weeks

The weekly view displays all seven days of the week with the respective working hours and cost center allocations.

---

## Recording Working Hours

For each working day, the following values can be entered:

1. **Start time** -- beginning of the work day (e.g., 08:00)
2. **End time** -- end of the work day (e.g., 17:00)
3. **Break** -- break duration in minutes (e.g., 30 or 60)

The net working time is calculated automatically: **End time − Start time − Break**.

!!! tip "Quick Entry"
    Use the Tab key to jump between fields. Entries are saved automatically when you leave the field.

---

## Actual/Target/Delta Display

A summary is shown at the bottom of the weekly view:

| Value      | Meaning                                                      |
|------------|--------------------------------------------------------------|
| **Target** | Expected working time based on the individual work schedule   |
| **Actual** | Actually recorded working time for the week                   |
| **Delta**  | Difference between actual and target (positive = overtime, negative = shortfall) |

!!! info "Work Schedule"
    The target is calculated from the employee's stored work schedule. Holidays and approved absences automatically reduce the weekly target.

---

## Cost Center Allocation

Below the working hours, the hours worked can be distributed across **cost centers**:

1. Select a cost center from the dropdown
2. Enter the **percentage** of working time
3. Add additional cost centers if needed

!!! warning "100% Rule"
    The sum of all cost center allocations for a day must equal exactly **100%**. As long as the sum does not reach 100%, a notice is displayed and the day is considered incomplete.

---

## Favorites and Copy Previous Week

Two features are available to speed up recurring allocations:

- **Favorites** -- Save a frequently used cost center distribution as a favorite and apply it to individual days or the entire week with a single click
- **Copy Previous Week** -- Copies the cost center distribution from the previous week to the current week

!!! tip "Managing Favorites"
    Click the **star icon** next to a cost center distribution to save it as a favorite. Saved favorites appear in the **"Apply Favorite"** dropdown.

---

## Locked Days

Certain days cannot be edited:

| Reason                  | Display                  | Explanation                                     |
|-------------------------|--------------------------|-------------------------------------------------|
| **Approved Vacation**   | Green background         | Day is booked as vacation -- no manual entry needed |
| **Sick Leave**          | Orange background        | Sick note is on file -- no entry possible        |
| **Holiday**             | Blue background          | Public or company holiday                        |
| **Special Leave**       | Purple background        | Approved special leave                           |
| **Monthly Close**       | Lock icon                | The month has been closed by an admin -- retroactive changes are locked |

!!! info "Absences"
    Days locked by absences are automatically booked to the corresponding system cost center (e.g., "Vacation" or "Sick Leave").

---

## Time Tracking Status

| Status          | Meaning                                                       |
|-----------------|---------------------------------------------------------------|
| **Open**        | Day has not been fully recorded yet                            |
| **Complete**    | Working time and cost centers are correctly recorded (100%)    |
| **Locked**      | Day is locked due to absence or monthly close                  |
