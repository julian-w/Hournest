import { expect, test } from '@playwright/test';
import { createLocalEmployee, createVacationRequest, deleteUser, reviewVacationRequest, uniqueSuffix } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { nextBusinessDayOffset } from './helpers/ui';

test.describe('admin request conflict flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the admin request conflict flow.');

  test('admin sees backend conflict feedback when a pending vacation was already reviewed elsewhere', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const comment = `E2E stale admin request ${suffix}`;
    const startDate = nextBusinessDayOffset(20);

    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });
    const employee = await createLocalEmployee(adminApi, suffix);
    const employeeCredentials = {
      username: employee.email,
      password: employee.password,
    };

    try {
      const employeeApi = await createLoggedInApiRequestContext(employeeCredentials);
      const vacationId = await createVacationRequest(employeeApi, {
        startDate,
        endDate: startDate,
        comment,
      });
      await employeeApi.dispose();

      const adminContext = await browser.newContext();
      try {
        await loginInContext(adminContext, adminCredentials);

        const page = await adminContext.newPage();
        await page.goto('/admin/requests');
        await expect(page.locator('app-admin-requests')).toBeVisible();

        const row = page.locator('tr.mat-mdc-row').filter({ hasText: employee.displayName }).first();
        await expect(row).toBeVisible();

        await reviewVacationRequest(adminApi, vacationId, { status: 'approved', comment: 'Background approval' });

        await row.locator('button').filter({
          has: page.locator('mat-icon', { hasText: 'check_circle' }),
        }).click();

        await expect(page.locator('mat-snack-bar-container')).toContainText('already been reviewed');
      } finally {
        await adminContext.close();
      }
    } finally {
      await deleteUser(adminApi, employee.id);
      await adminApi.dispose();
    }
  });
});
