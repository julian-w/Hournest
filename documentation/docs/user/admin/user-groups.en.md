# User Groups

This page explains how to create user groups and use them for efficient cost center assignment.

---

## Overview

User groups allow you to combine multiple employees and assign cost centers to them collectively. Navigate to **"User Groups"** in the **"Administration"** section of the side navigation.

!!! info "Purpose of User Groups"
    Instead of assigning each cost center to each employee individually, groups can be formed (e.g., "Development", "Sales", "Administration"). All members of a group automatically see all cost centers assigned to the group.

---

## Creating a Group

1. Click the **"Create Group"** button
2. Fill in the following fields:
    - **Name** (required) -- Unique group name, e.g., "Development Team"
    - **Description** (optional) -- Explanation of the group's purpose
3. Click **"Save"**

---

## Adding and Removing Members

### Adding Members

1. Open the desired group
2. Switch to the **"Members"** tab
3. Click **"Add Member"**
4. Select one or more employees from the list
5. Click **"Add"**

### Removing Members

1. Open the desired group
2. Switch to the **"Members"** tab
3. Click the **remove icon** next to the employee
4. Confirm the removal

!!! warning "Impact on Cost Centers"
    When an employee is removed from a group, they immediately lose access to cost centers that were assigned exclusively through that group. However, previously booked time entries are preserved.

---

## Assigning Cost Centers

1. Open the desired group
2. Switch to the **"Cost Centers"** tab
3. Click **"Assign Cost Center"**
4. Select one or more cost centers from the list
5. Click **"Assign"**

Assigned cost centers can be removed at any time by clicking the **remove icon** next to the cost center.

---

## Impact on Time Tracking

Employees see all cost centers assigned to them in time tracking -- both direct assignments and cost centers from all groups they belong to.

| Assignment Type    | Example                                          |
|--------------------|--------------------------------------------------|
| **Direct**         | Cost center "Special Project" assigned directly to the employee |
| **Via Group**      | Employee is in the "Development" group; cost center "INT-DEV" is assigned to the group |
| **Combined**       | Employee sees both direct and group-based cost centers |

!!! tip "Recommendation"
    Use user groups for general cost centers (e.g., internal projects, departments) and direct assignments only for individual or temporary cost centers.

---

## Editing and Deleting Groups

- **Edit** -- Click the **edit icon** to change the group's name and description
- **Delete** -- A group can only be deleted when it has no remaining members. Remove all members first before deleting the group.

!!! warning "Deletion Cannot Be Undone"
    Deleting a group cannot be undone. Employees will lose access to cost centers that were assigned through this group.
