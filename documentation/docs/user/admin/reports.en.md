# Reports

This page explains the admin reports for time tracking and cost centers.

The page now also includes an **absence report** for illness and special leave within the selected period.

---

## Opening the Reports Page

1. Open **"Reports"** in the admin area
2. Choose the **from** and **to** dates
3. Select whether the summary should be grouped by **employee** or **cost center**
4. Click **"Load"**

---

## Time Booking Summary

The top table summarizes bookings for the selected period.

Depending on the selected grouping, it shows:

- per **employee** the total percentage points and booked minutes
- per **cost center** the total percentage points and booked minutes

Booked minutes are derived from the day's time entry and the booking percentage.

For automatic system bookings without a separate time entry, such as vacation, illness, or company holidays, the report uses the day's target minutes from the work schedule or the default setting.

---

## Missing Entries

The second table shows workdays with gaps:

- **Missing time entry**: there is no time entry for a workday
- **Incomplete booking**: a time entry exists, but the expected manual percentage allocation is incomplete

The current business rules apply:

- regular workdays expect **100%**
- half-day absences or half-day vacation expect **50%**
- full-day absences, full-day vacation, and **company holidays (`company_holiday`)** are not listed as missing entries

---

## CSV Export

Use **"Export CSV"** to download a detailed export for the selected period.

Each booking row includes fields such as:

- date
- employee name and email
- cost center code and name
- percentage
- derived booked minutes
- comment

---

## Absence Report

The third table shows absences within the selected period.

Additional filters let you narrow the report by:

- employee
- absence type
- status

Use **"Reset filters"** to load the full period again without those extra filters.

It includes fields such as:

- employee
- absence type
- scope
- status
- period
