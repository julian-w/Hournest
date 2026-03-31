# Absence Management

This page explains how admins confirm sick leave reports, approve special leave, and create absences directly.

---

## Confirming Open Sick Leave Reports

When an employee submits a sick leave report, the admin is notified. Open sick leave reports can be confirmed:

1. Navigate to **"Absence Management"** in the **"Administration"** section
2. Switch to the **"Open Reports"** tab
3. The list shows all sick leave reports with the status **Reported**
4. Click **"Acknowledge"** next to the respective report
5. The status changes to **Acknowledged**

!!! info "No Approval Process"
    Sick leave reports do not require approval. The acknowledgement serves only as documentation that the admin has seen the report. The absence is immediately active regardless of the acknowledgement status.

---

## Approving or Rejecting Special Leave

Special leave requests go through an approval process:

1. Navigate to **"Absence Management"** in the **"Administration"** section
2. Switch to the **"Open Requests"** tab
3. The list shows all special leave requests with the status **Pending**
4. For each request, two actions are available:
    - **Approve** -- sets the status to **Approved** and creates the absence in the calendar
    - **Reject** -- sets the status to **Rejected**, optionally with a comment explaining the reason

!!! tip "Comment on Rejection"
    It is recommended to add a comment with the reason when rejecting a request. The employee can see this comment in their absence list.

---

## Creating an Absence Directly (as Admin)

Admins can create absences for employees directly, without the employee needing to submit a request:

1. Navigate to **"Absence Management"** in the **"Administration"** section
2. Click the **"Create Absence"** button
3. Fill in the following fields:
    - **Employee** (required) -- Select the affected employee
    - **Type** (required) -- Sick leave or special leave
    - **Start date** (required) -- The first day of absence
    - **End date** (required) -- The last day of absence
    - **Half day** (optional) -- Morning or afternoon (only for single-day absences)
    - **Comment** (optional) -- Reason or note
4. Click **"Save"**

The absence is created with the status **Created by Admin** and is immediately active.

!!! warning "Retroactive Entries"
    Admins can also create absences in the past. Existing time entries for the affected days are **not** automatically removed and may need to be corrected manually.

---

## Status Overview

| Status               | Type          | Next Action                                      |
|----------------------|--------------|--------------------------------------------------|
| **Reported**         | Sick Leave   | Acknowledge                                       |
| **Acknowledged**     | Sick Leave   | No further action required                        |
| **Pending**          | Special Leave| Approve or Reject                                 |
| **Approved**         | Special Leave| No further action required                        |
| **Rejected**         | Special Leave| No further action required                        |
| **Created by Admin** | Both         | No further action required                        |

---

## Monthly Close and Time Lock

The monthly close locks all time tracking and absence entries for a month against retroactive changes:

1. Navigate to **"Absence Management"** in the **"Administration"** section
2. Switch to the **"Monthly Close"** tab
3. Select the desired **month** and **year**
4. Review the overview of all employees for completeness
5. Click **"Close Month"**
6. Confirm the close

!!! warning "Irreversible"
    A closed month cannot be reopened. All time entries and absences in this period are locked afterwards. Make sure all entries are correct and complete before closing the month.

!!! info "Impact on Employees"
    After the monthly close, employees can no longer record or change working hours for the affected month. Locked days are marked with a **lock icon** in time tracking.
