# Vacation Planning

Vacation planning allows admins to define company-wide periods with special vacation rules. There are two modes:

---

## Overview

The page shows a table of all configured periods with the following columns:

| Column   | Description                                       |
|----------|---------------------------------------------------|
| Type     | Vacation Freeze or Company Holiday                |
| From     | Start date of the period                          |
| To       | End date of the period                            |
| Reason   | Free text field with the reason (e.g., "Inventory") |
| Actions  | Edit and Delete                                   |

---

## Two Modes

### Vacation Freeze

A vacation freeze means that **no vacation may be taken** during the defined period. No vacation days are deducted.

**Typical use cases:**

- Inventory periods
- Project deadlines
- Trade fair weeks

!!! warning "Impact"
    Employees cannot submit vacation requests for this period. The restriction is enforced on the backend. Existing requests are not affected.

### Company Holiday

Company holidays define a company-wide period where vacation is applied automatically.

**Typical use cases:**

- Christmas shutdown (e.g., Dec 24 - Dec 31)
- Summer break
- Bridge days

!!! info "Vacation Days"
    Workdays in the period are handled automatically in the vacation ledger and time tracking. Additional vacation requests for the same period are not needed and are blocked.

---

## Creating an Entry

1. Click the **"Add Entry"** button
2. Select the **Type**:
    - **Vacation Freeze** -- No vacation allowed, no days deducted
    - **Company Holiday** -- Company-wide forced vacation with automatic vacation effect
3. Set the **From date** and **To date**
4. Enter a **Reason** (e.g., "Inventory" or "Christmas shutdown")
5. Click **"Save"**

---

## Editing an Entry

1. Click the **Edit icon** (pencil) next to the entry
2. Change the desired fields (type, period, reason)
3. Click **"Save"**

---

## Deleting an Entry

1. Click the **Delete icon** (trash can) next to the entry
2. The entry is removed immediately

!!! warning "Caution"
    Deleting an entry removes the restriction or company-holiday effect immediately. Employees can then request vacation for the affected period again, and automatically created ledger and system bookings are recalculated.

---

## Impact on Vacation Requests

When an employee submits a vacation request that falls within a configured period, the following is displayed:

| Type             | Behavior                                                         |
|------------------|------------------------------------------------------------------|
| Vacation Freeze  | Request is **blocked** -- red notice, submit not possible        |
| Company Holiday  | Vacation is handled automatically, additional requests are not possible |
