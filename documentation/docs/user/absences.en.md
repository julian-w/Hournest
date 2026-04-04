# Absences

This page explains how illness reports and special leave requests are submitted, cancelled, and how they affect time tracking.

---

## Reporting Illness

1. Navigate to **"Absences"**
2. Click **"Report Illness"**
3. Choose:
   - **Start date**
   - **End date**
   - **Scope**: full day, morning, or afternoon
   - **Comment** optional
4. Submit the report

The report is created with status **Reported**.

!!! info "Workflow"
    Illness reports are submitted first and can then be **acknowledged** by an admin.

---

## Requesting Special Leave

1. Navigate to **"Absences"**
2. Click **"Request Special Leave"**
3. Choose:
   - **Start date**
   - **End date**
   - **Scope**: full day, morning, or afternoon
   - **Comment** optional
4. Submit the request

The request is created with status **Pending** and waits for review.

---

## Status Meanings

| Status | Meaning |
|--------|---------|
| **Reported** | Illness has been submitted |
| **Acknowledged** | Illness has been confirmed by an admin |
| **Pending** | Special leave is waiting for a decision |
| **Approved** | Special leave has been approved |
| **Rejected** | Special leave has been rejected |
| **Created by Admin** | Entry was created directly by an admin |

---

## Half Days

For illness and special leave, a half day can be selected:

- **Morning**
- **Afternoon**

!!! info "Single-Day Only"
    Half days can only be used when start date and end date are the same.

---

## Effect on Time Tracking

Effective absences directly affect time tracking:

- **Illness:** status `acknowledged` or `admin_created`
- **Special Leave:** status `approved` or `admin_created`

In those cases:

- **Full day:** the day is locked and automatically booked to the matching system cost center
- **Half day:** 50% is booked automatically and 50% remains open for regular cost centers
- Existing time entries on full effective absence days are removed

---

## Cancelling Open Reports

Open reports can be cancelled by the employee:

- **Illness** with status **Reported**
- **Special leave** with status **Pending**

Entries that are already processed or created by an admin cannot be cancelled by the employee.

---

## Absence List

The list shows:

- **Type**
- **Period**
- **Scope**
- **Status**
- **Comment**
- **Actions** to cancel open entries
