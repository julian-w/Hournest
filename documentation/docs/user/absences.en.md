# Absences

This page explains how sick leave and special leave are submitted, cancelled, and processed by admins.

---

## Reporting Sick Leave (Step by Step)

1. Navigate to **"Absences"** in the side navigation
2. Click the **"Report Absence"** button
3. Select the type **"Sick Leave"**
4. Fill in the following fields:
    - **Start date** (required) -- the first day of sick leave
    - **End date** (required) -- the last day of sick leave
    - **Half day** (optional) -- see section [Half Days](#half-days)
    - **Comment** (optional) -- e.g., "Common cold"
5. Click **"Submit Report"**
6. The report is created with the status **Reported**

!!! info "No Approval Process"
    Sick leave reports do not go through an approval process. They are recorded immediately and the admin is notified. The admin can then **acknowledge** the report.

---

## Requesting Special Leave

1. Navigate to **"Absences"** in the side navigation
2. Click the **"Report Absence"** button
3. Select the type **"Special Leave"**
4. Fill in the following fields:
    - **Start date** (required) -- the first day of special leave
    - **End date** (required) -- the last day
    - **Half day** (optional) -- see section [Half Days](#half-days)
    - **Comment** (required) -- reason, e.g., "Moving" or "Wedding"
5. Click **"Submit Request"**
6. The request is created with the status **Pending** and awaits admin approval

!!! warning "Comment Required"
    For special leave, a comment with the reason is mandatory. Without a reason, the request cannot be submitted.

---

## Status Meanings

| Status               | Symbol/Color | Meaning                                                      |
|----------------------|-------------|--------------------------------------------------------------|
| **Reported**         | Blue        | Sick leave has been submitted and is active                   |
| **Acknowledged**     | Green       | Admin has seen and confirmed the sick leave report            |
| **Pending**          | Yellow/Amber| Special leave has been requested and is awaiting approval     |
| **Approved**         | Green       | Special leave has been approved by an admin                   |
| **Rejected**         | Red         | Special leave has been rejected -- possibly with an admin comment |
| **Created by Admin** | Grey        | Absence was entered directly by an admin                      |

---

## Half Days

For sick leave and special leave, a **half day** can be selected:

- **Morning** -- Absence applies only to the morning; the afternoon can be recorded in time tracking
- **Afternoon** -- Absence applies only to the afternoon; the morning can be recorded

!!! tip "When to Use Half Days?"
    Half days are useful, for example, for a doctor's appointment in the morning or when you fall ill in the afternoon. The target working time is halved accordingly.

!!! info "Single-Day Absences Only"
    Half days can only be selected when the start and end date are identical. This option is not available for multi-day absences.

---

## Cancelling Open Reports

Open absence reports can be cancelled by the employee:

1. Go to **"Absences"**
2. Find the desired report in the list
3. Click the **Cancel** button
4. Confirm the cancellation

!!! warning "Restrictions"
    - **Sick leave** with the status **Reported** can be cancelled
    - **Special leave** with the status **Pending** can be cancelled
    - Entries that have already been approved, rejected, or acknowledged by an admin can only be changed by an admin

---

## Absence List

The **"Absences"** page shows a table of all your absences with the following columns:

- **Period** -- From and to date
- **Type** -- Sick leave or special leave
- **Work days** -- Number of affected working days
- **Status** -- Current status of the report
- **Comment** -- Your own comment or the admin's comment
- **Actions** -- Cancel button (only for open reports)
