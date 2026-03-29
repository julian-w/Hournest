# Manage Holidays

Holiday management is only accessible to admins and allows creating, editing, and deleting holidays.

---

## Overview

The holidays page shows a year-based view of all holidays with the following information:

| Column | Description                               |
|--------|-------------------------------------------|
| Status | Green (confirmed) or Red (date missing)   |
| Name   | Holiday name (e.g., "New Year")           |
| Date   | The date of the holiday for the selected year |
| Type   | Fixed or Variable                         |

### Year Filter

A year filter at the top of the page can restrict the display to a specific year.

### Status Banner

A status banner is displayed at the top of the page:

- **Green:** All holidays for the year are confirmed -- employees can book vacation
- **Orange:** Dates are still missing -- vacation booking is locked

---

## Fixed and Variable Holidays

### Fixed Holidays

Fixed holidays fall on the same date every year and are **automatically** carried over for each year. Examples:

| Holiday                   | Date       |
|---------------------------|------------|
| New Year                  | Jan 1      |
| Labour Day                | May 1      |
| German Unity Day          | Oct 3      |
| Christmas Day             | Dec 25     |
| St. Stephen's Day         | Dec 26     |

!!! note "Note"
    Fixed holidays only need to be created once. The date is automatically derived for each year (same day and month).

### Variable Holidays

Variable holidays fall on a different date each year. They typically depend on the Easter date. Examples:

| Holiday              | 2026       |
|----------------------|------------|
| Good Friday          | 04/03/2026 |
| Easter Monday        | 04/06/2026 |
| Ascension Day        | 05/14/2026 |
| Whit Monday          | 05/25/2026 |

Variable holidays are **marked in red** in the year view as long as no date has been set for the respective year. The date can be set via the calendar button.

---

## Start and End Year

Each holiday has a **start year** and an optional **end year**:

- **Start year** (required): From which year the holiday applies
- **End year** (optional): Until when the holiday applies. Leave empty for unlimited.

**Example:** A regional holiday that only applies from 2027 gets start year 2027. A discontinued holiday gets an end year.

---

## Holiday Confirmation and Vacation Booking

!!! warning "Important"
    Employees can only book vacation for a year when **all holidays for that year are confirmed**. This means:

    - All **fixed holidays** are automatically confirmed
    - All **variable holidays** must have a specific date set for the year

    The status is shown in the banner at the top of the page. Employees see a warning when requesting vacation if the holidays are not yet complete.

---

## Creating a Holiday

1. Click the **"Add Holiday"** button
2. Fill in the fields:
    - **Name** -- Holiday name
    - **Date** -- The date of the holiday
    - **Type** -- Choose between "Fixed" and "Variable"
    - **Start Year** -- From when the holiday applies
    - **End Year** (optional) -- Until when the holiday applies
3. Click **"Save"**

---

## Editing a Holiday

1. Click the edit button next to the desired holiday
2. Change the desired fields
3. Click **"Save"**

### Confirming a Variable Holiday for a Year

1. Click the **calendar button** next to the variable holiday
2. Select the date for the current year
3. Click **"Save"**

---

## Deleting a Holiday

1. Click the delete button next to the desired holiday
2. Confirm the deletion

!!! warning "Caution"
    Deleting a holiday can affect vacation day calculations. If vacation has already been approved that spans the deleted holiday, the calculation will change retroactively.

---

## Impact on Vacation Calculation

Holidays are **not** counted as vacation days when calculating vacation:

- **Example:** An employee takes vacation from 12/28/2026 to 01/02/2027. January 1st (New Year) is not counted as a vacation day.
- **Exception:** Employees with the **holidays_exempt** flag -- for these employees, holidays count as normal working days.

---

## Recommendation

!!! tip "Tip"
    Enter all variable holidays at the beginning of the year so employees can book vacation early. Fixed holidays are automatically carried over and do not need to be updated annually.
