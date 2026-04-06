import { expect, test } from '@playwright/test';
import { createAbsenceRequest, createLocalEmployee, deleteUser, reviewAbsenceRequest, uniqueSuffix } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { nextBusinessDayOffset } from './helpers/ui';

test.describe('absence cancel conflict flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the absence cancel conflict flow.');

  test('employee sees a conflict when cancelling a special-leave request that an admin approved in the meantime', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const comment = `E2E absence cancel conflict ${suffix}`;
    const startDate = nextBusinessDayOffset(10);

    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });
    const employee = await createLocalEmployee(adminApi, suffix);
    const employeeCredentials = {
      username: employee.email,
      password: employee.password,
    };

    try {
      const employeeApi = await createLoggedInApiRequestContext(employeeCredentials);
      try {
        const absenceId = await createAbsenceRequest(employeeApi, {
          startDate,
          endDate: startDate,
          type: 'special_leave',
          comment,
        });

        const employeeContext = await browser.newContext();
        try {
          await loginInContext(employeeContext, employeeCredentials);

          const page = await employeeContext.newPage();
          const snackBar = page.locator('mat-snack-bar-container').last();
          await page.goto('/my-absences');
          await expect(page.locator('app-my-absences')).toBeVisible();

          const row = page.locator('tr.mat-mdc-row').filter({ hasText: comment }).first();
          await expect(row).toBeVisible();
          await expect(row).toContainText(/pending|ausstehend|offen/i);

          await reviewAbsenceRequest(adminApi, absenceId, {
            status: 'approved',
            adminComment: `Approved in absence race ${suffix}`,
          });

          await row.locator('button[color="warn"]').click();

          await expect(snackBar).toContainText('Only pending or reported absences can be cancelled.');
          await expect(page.locator('tr.mat-mdc-row').filter({ hasText: comment }).first()).toContainText(/approved|genehmigt/i);
        } finally {
          await employeeContext.close();
        }
      } finally {
        await employeeApi.dispose();
      }
    } finally {
      await deleteUser(adminApi, employee.id);
      await adminApi.dispose();
    }
  });
});
