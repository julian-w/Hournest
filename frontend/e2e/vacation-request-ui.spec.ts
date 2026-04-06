import { expect, test } from '@playwright/test';
import { createLocalEmployee, deleteUser, uniqueSuffix } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { fillDateInput, nextBusinessDayOffset } from './helpers/ui';

test.describe('vacation request ui flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the vacation request UI flow.');

  test('employee submits a vacation request through the dialog', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const comment = `E2E vacation ui ${suffix}`;
    const startDate = nextBusinessDayOffset(9);

    const adminContext = await browser.newContext();
    await loginInContext(adminContext, adminCredentials);
    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });
    const employee = await createLocalEmployee(adminApi, suffix);
    const employeeCredentials = {
      username: employee.email,
      password: employee.password,
    };

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
        await expect(page.locator('mat-dialog-container app-vacation-dialog')).toBeVisible();

        await fillDateInput(page.locator('input[formcontrolname="startDate"]'), startDate);
        await fillDateInput(page.locator('input[formcontrolname="endDate"]'), startDate);
        await page.locator('textarea[formcontrolname="comment"]').fill(comment);
        await page.getByRole('button', { name: /submit|beantragen/i }).click();

        const row = page.locator('tr.mat-mdc-row').filter({ hasText: comment }).first();
        await expect(row).toBeVisible();
        await expect(row).toContainText(/pending|offen/i);
      } finally {
        await employeeContext.close();
      }
    } finally {
      await deleteUser(adminApi, employee.id);
      await adminApi.dispose();
      await adminContext.close();
    }
  });
});
