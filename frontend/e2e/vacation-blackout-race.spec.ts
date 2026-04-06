import { expect, test } from '@playwright/test';
import { createBlackout, createLocalEmployee, deleteBlackout, deleteUser, uniqueSuffix } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { fillDateInput, nextBusinessDayOffset } from './helpers/ui';

test.describe('vacation blackout race flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the blackout race flow.');

  test('employee sees a backend blackout reason when the freeze appears after the dialog was opened', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const blockedDate = nextBusinessDayOffset(18);
    const freezeReason = `Race freeze ${suffix}`;
    const comment = `E2E blackout race ${suffix}`;

    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });
    const employee = await createLocalEmployee(adminApi, suffix);
    const employeeCredentials = {
      username: employee.email,
      password: employee.password,
    };

    let blackoutId: number | null = null;

    try {
      const employeeContext = await browser.newContext();
      try {
        const employeeApi = await createLoggedInApiRequestContext(employeeCredentials);
        await employeeApi.dispose();
        await loginInContext(employeeContext, employeeCredentials);

        const page = await employeeContext.newPage();
        await page.goto('/my-vacations');
        await expect(page.locator('app-my-vacations')).toBeVisible();

        await page.getByRole('button').filter({ has: page.locator('mat-icon', { hasText: 'add' }) }).first().click();
        const dialog = page.locator('mat-dialog-container app-vacation-dialog');
        await expect(dialog).toBeVisible();

        await fillDateInput(dialog.locator('input[formcontrolname="startDate"]'), blockedDate);
        await fillDateInput(dialog.locator('input[formcontrolname="endDate"]'), blockedDate);
        await dialog.locator('textarea[formcontrolname="comment"]').fill(comment);
        await expect(dialog.locator('.warning.blackout')).toHaveCount(0);

        const blackout = await createBlackout(adminApi, {
          type: 'freeze',
          start_date: blockedDate,
          end_date: blockedDate,
          reason: freezeReason,
        });
        blackoutId = blackout.id;

        await dialog.getByRole('button', { name: /submit request/i }).click();

        await expect(dialog.locator('.error')).toContainText(freezeReason);
        await expect(page.locator('tr.mat-mdc-row').filter({ hasText: comment })).toHaveCount(0);
      } finally {
        await employeeContext.close();
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
