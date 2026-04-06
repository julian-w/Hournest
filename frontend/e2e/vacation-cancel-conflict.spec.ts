import { expect, test } from '@playwright/test';
import { createLocalEmployee, createVacationRequest, deleteUser, reviewVacationRequest, uniqueSuffix } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { nextBusinessDayOffset } from './helpers/ui';

test.describe('vacation cancel conflict flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the vacation cancel conflict flow.');

  test('employee sees a conflict when cancelling a vacation that an admin approved in the meantime', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const comment = `E2E vacation cancel conflict ${suffix}`;
    const adminComment = `Approved in race ${suffix}`;
    const startDate = nextBusinessDayOffset(12);

    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });
    const employee = await createLocalEmployee(adminApi, suffix);
    const employeeCredentials = {
      username: employee.email,
      password: employee.password,
    };

    try {
      const employeeApi = await createLoggedInApiRequestContext(employeeCredentials);
      try {
        const vacationId = await createVacationRequest(employeeApi, {
          startDate,
          endDate: startDate,
          comment,
        });

        const employeeContext = await browser.newContext();
        try {
          await loginInContext(employeeContext, employeeCredentials);

          const page = await employeeContext.newPage();
          const snackBar = page.locator('mat-snack-bar-container').last();
          await page.goto('/my-vacations');
          await expect(page.locator('app-my-vacations')).toBeVisible();

          const row = page.locator('tr.mat-mdc-row').filter({ hasText: comment }).first();
          await expect(row).toBeVisible();
          await expect(row).toContainText(/pending|ausstehend|offen/i);

          await reviewVacationRequest(adminApi, vacationId, {
            status: 'approved',
            comment: adminComment,
          });

          await row.locator('button[color="warn"]').click();

          await expect(snackBar).toContainText('Only pending requests can be cancelled.');
          const approvedRow = page.locator('tr.mat-mdc-row').filter({ hasText: adminComment }).first();
          await expect(approvedRow).toBeVisible();
          await expect(approvedRow).toContainText(/approved|genehmigt/i);
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
