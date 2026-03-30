# Getting Started

This guide is intended for end users of Hournest -- both employees and administrators (admins).

---

## Logging In

### SSO Login (Standard)

1. Open Hournest in your browser
2. The login page prominently displays the **"Sign in with SSO"** button
3. Click the button -- you will be redirected to the SSO server
4. Sign in with your SSO credentials
5. After successful authentication, you are automatically redirected back to Hournest

!!! info "First Login"
    On your first login, your user account is automatically created. You will initially receive the **Employee** role. If your email address is listed in the admin list, you will automatically receive the **Admin** role.

### Superadmin Login (Emergency Access)

The superadmin login serves as emergency access when the SSO server is unavailable:

1. On the login page, click the **"Admin Login"** link below the SSO button
2. Username and password fields will appear
3. Enter the superadmin credentials (provided by the system administrator)

---

## Interface Overview

After logging in, you arrive at the Dashboard. The interface consists of the following areas:

### Toolbar (top)

- **Logo and application name** (Hournest) -- left side
- **Language switcher** -- toggles between German and English
- **User menu** -- shows the logged-in user and the logout button

### Side Navigation (left)

The side navigation shows the available sections:

**For all users:**

- Dashboard
- Calendar
- My Vacations

**Additionally for admins:**

- Vacation Requests (pending requests for approval)
- User Management
- Manage Holidays
- Settings

### Content Area (center)

The main area displays the content of the currently selected page.

---

## What Do the Different Roles See?

### Employee

- **Dashboard:** Own remaining vacation, open requests, next vacation
- **Calendar:** Own vacations in the monthly calendar
- **My Vacations:** List of all own vacation requests with status
- **Vacation Account:** Own yearly ledger (read-only)

### Admin (Administrator)

Everything the employee sees, plus:

- **Dashboard:** Pending requests from all employees, team status
- **Calendar:** Vacations of all employees visible
- **Vacation Requests:** List of all pending requests with approve/reject functionality
- **User Management:** Manage roles, vacation days, work schedules, vacation accounts
- **Holidays:** Create, edit, delete holidays
- **Settings:** Global settings (work days, carryover, expiry)

### Superadmin

Has the same permissions as an admin. The superadmin is designed as an emergency account and is typically only used when the SSO server is unreachable.

---

## Switching Language

The application supports German and English. The language switcher is located in the toolbar at the top right. A click immediately switches the language of all texts in the application -- without reloading the page.

---

## Next Steps

- [Dashboard](dashboard.md) -- Overview of the start page
- [Calendar](calendar.md) -- Understanding and using the monthly calendar
- [Vacation Requests](vacations.md) -- Requesting, cancelling, approving vacations
- [Vacation Account](ledger.md) -- Yearly overview and booking types
