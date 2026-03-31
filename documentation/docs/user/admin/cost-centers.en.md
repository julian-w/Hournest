# Manage Cost Centers

This page explains how to create, edit, and assign cost centers to employees.

---

## Overview

Navigate to **"Cost Centers"** in the **"Administration"** section of the side navigation. The overview shows all active and archived cost centers.

### System Cost Centers

The following cost centers are created automatically by the system and cannot be deleted or renamed:

| Cost Center        | Code   | Usage                                            |
|--------------------|--------|--------------------------------------------------|
| **Vacation**       | `VACAT`| Automatically booked for approved vacations      |
| **Sick Leave**     | `SICK` | Automatically booked for sick leave reports       |
| **Special Leave**  | `SPLV` | Automatically booked for approved special leave   |
| **Holiday**        | `HOLID`| Automatically booked on public holidays           |

!!! info "System Cost Centers"
    System cost centers are automatically booked in time tracking for absences. They appear in the cost center list but cannot be edited or deleted.

---

## Creating a Cost Center

1. Click the **"Create Cost Center"** button
2. Fill in the following fields:
    - **Code** (required) -- Unique short code, e.g., "PROJ-A" or "INT-001"
    - **Name** (required) -- Descriptive name, e.g., "Project Alpha"
    - **Description** (optional) -- Additional explanation for the cost center
3. Click **"Save"**

!!! tip "Code Conventions"
    The code should be short and unique. It is used in reports and exports and cannot be changed after creation.

---

## Editing and Deactivating Cost Centers

- **Edit** -- Click the **edit icon** next to a cost center to change its name and description. The code cannot be changed after creation.
- **Deactivate** -- Deactivated cost centers no longer appear in the time tracking dropdown but are retained in historical bookings.

!!! warning "Impact of Deactivation"
    Time already booked to deactivated cost centers is preserved and continues to appear in reports. However, new bookings to this cost center are no longer possible.

---

## Archiving

Cost centers are archived via **soft delete** and not permanently deleted:

- Archived cost centers are displayed in grey in the list
- Historical bookings are retained for at least **10 years**
- Archived cost centers can be restored if needed

---

## Direct Assignment to Employees

Cost centers can be assigned directly to individual employees:

1. Open the desired cost center
2. Switch to the **"Employees"** tab
3. Click **"Add Employee"**
4. Select one or more employees from the list
5. Click **"Assign"**

Assigned employees see the cost center in their dropdown during time tracking.

!!! tip "Bulk Editing"
    For assigning many employees at once, consider using [User Groups](user-groups.md).

---

## User Groups

In addition to direct assignment, cost centers can also be assigned via **user groups**. All members of a group automatically gain access to the group's cost centers.

For more information, see [User Groups](user-groups.md).
