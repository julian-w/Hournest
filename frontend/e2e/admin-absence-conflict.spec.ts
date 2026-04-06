import { expect, test } from '@playwright/test';
import { createAbsenceRequest, createLocalEmployee, deleteUser, reviewAbsenceRequest, uniqueSuffix } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { nextBusinessDayOffset } from './helpers/ui';

test.describe('admin absence conflict flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the admin absence conflict flow.');

  test('admin sees backend conflict feedback when an absence was already reviewed elsewhere', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const comment = `E2E stale admin absence ${suffix}`;
    const startDate = nextBusinessDayOffset(24);

    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });
    const employee = await createLocalEmployee(adminApi, suffix);
    const employeeCredentials = {
      username: employee.email,
      password: employee.password,
    };

    try {
      const employeeApi = await createLoggedInApiRequestContext(employeeCredentials);
      const absenceId = await createAbsenceRequest(employeeApi, {
        startDate,
        endDate: startDate,
        type: 'special_leave',
        comment,
      });
      await employeeApi.dispose();

      const adminContext = await browser.newContext();
      try {
        await loginInContext(adminContext, adminCredentials);

        const page = await adminContext.newPage();
        await page.goto('/admin/absences');
        await expect(page.locator('app-admin-absences')).toBeVisible();

        const row = page.locator('tr.mat-mdc-row').filter({ hasText: employee.displayName }).first();
        await expect(row).toBeVisible();

        await reviewAbsenceRequest(adminApi, absenceId, {
          status: 'approved',
          adminComment: 'Background approval',
        });

        await row.getByRole('button', { name: /approve/i }).click();
        await expect(page.locator('mat-snack-bar-container')).toContainText('Invalid status transition.');
      } finally {
        await adminContext.close();
      }
    } finally {
      await deleteUser(adminApi, employee.id);
      await adminApi.dispose();
    }
  });
});
