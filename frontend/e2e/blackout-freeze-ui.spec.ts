import { expect, test } from '@playwright/test';
import { createLocalEmployee, deleteBlackout, deleteUser, getBlackouts, uniqueSuffix } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { fillDateInput, nextBusinessDayOffset } from './helpers/ui';

test.describe('blackout freeze ui flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run blackout freeze UI tests.');

  test('admin creates a freeze in the UI and employees see the dialog blocked', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const freezeDate = nextBusinessDayOffset(16);
    const freezeReason = `E2E Freeze ${suffix}`;

    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });
    const employee = await createLocalEmployee(adminApi, suffix);
    const employeeCredentials = {
      username: employee.email,
      password: employee.password,
    };

    let blackoutId: number | null = null;

    try {
      const adminContext = await browser.newContext();
      const employeeContext = await browser.newContext();

      try {
        await loginInContext(adminContext, adminCredentials);
        const adminPage = await adminContext.newPage();
        await adminPage.goto('/admin/blackouts');
        await expect(adminPage.locator('app-admin-blackouts')).toBeVisible();

        await adminPage.getByRole('button', { name: /add entry/i }).click();
        const dialog = adminPage.locator('mat-dialog-container app-blackout-dialog');
        await expect(dialog).toBeVisible();

        await fillDateInput(dialog.locator('input[formcontrolname="startDate"]'), freezeDate);
        await fillDateInput(dialog.locator('input[formcontrolname="endDate"]'), freezeDate);
        await dialog.locator('textarea[formcontrolname="reason"]').fill(freezeReason);
        await dialog.getByRole('button', { name: /^save$/i }).click();

        const blackoutRow = adminPage.locator('tr.mat-mdc-row').filter({ hasText: freezeReason }).first();
        await expect(blackoutRow).toBeVisible();
        await expect(blackoutRow).toContainText(/vacation freeze/i);

        const blackouts = await getBlackouts(adminApi);
        blackoutId = blackouts.find((entry) => entry.reason === freezeReason)?.id ?? null;
        expect(blackoutId).not.toBeNull();

        const employeeApi = await createLoggedInApiRequestContext(employeeCredentials);
        await employeeApi.dispose();
        await loginInContext(employeeContext, employeeCredentials);
        const employeePage = await employeeContext.newPage();
        await employeePage.goto('/my-vacations');
        await expect(employeePage.locator('app-my-vacations')).toBeVisible();

        await employeePage.getByRole('button').filter({ has: employeePage.locator('mat-icon', { hasText: 'add' }) }).first().click();
        const vacationDialog = employeePage.locator('mat-dialog-container app-vacation-dialog');
        await expect(vacationDialog).toBeVisible();

        await fillDateInput(vacationDialog.locator('input[formcontrolname="startDate"]'), freezeDate);
        await fillDateInput(vacationDialog.locator('input[formcontrolname="endDate"]'), freezeDate);

        await expect(vacationDialog.locator('.warning.blackout')).toContainText(freezeReason);
        await expect(vacationDialog.getByRole('button', { name: /submit request/i })).toBeDisabled();
      } finally {
        await employeeContext.close();
        await adminContext.close();
      }
    } finally {
      if (blackoutId !== null) {
        await deleteBlackout(adminApi, blackoutId);
      }
      await deleteUser(adminApi, employee.id);
      await adminApi.dispose();
    }
  });
});
