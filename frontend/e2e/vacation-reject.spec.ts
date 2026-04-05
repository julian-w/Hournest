import { expect, test } from '@playwright/test';
import { createLocalEmployee, createVacationRequest, deleteUser, uniqueSuffix } from './helpers/admin-api';
import { getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { nextBusinessDayOffset } from './helpers/ui';

test.describe('vacation rejection flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the vacation rejection flow.');

  test('admin rejects a vacation request and the employee sees the rejected status', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const comment = `E2E vacation reject ${suffix}`;
    const startDate = nextBusinessDayOffset(12);

    const adminContext = await browser.newContext();
    await loginInContext(adminContext, adminCredentials);
    const employee = await createLocalEmployee(adminContext.request, suffix);

    try {
      const employeeContext = await browser.newContext();
      try {
        await loginInContext(employeeContext, {
          username: employee.email,
          password: employee.password,
        });

        await createVacationRequest(employeeContext.request, {
          startDate,
          endDate: startDate,
          comment,
        });

        const adminPage = await adminContext.newPage();
        await adminPage.goto('/admin/requests');
        await expect(adminPage.locator('app-admin-requests')).toBeVisible();

        const matchingRow = adminPage.locator('tr.mat-mdc-row').filter({
          hasText: employee.displayName,
        }).filter({
          hasText: comment,
        }).first();

        await expect(matchingRow).toBeVisible();
        await matchingRow.locator('input[matinput]').fill('Capacity issue');
        await matchingRow.locator('button[color="warn"]').click();
        await expect(matchingRow).toHaveCount(0);

        const employeePage = await employeeContext.newPage();
        await employeePage.goto('/my-vacations');
        await expect(employeePage.locator('app-my-vacations')).toBeVisible();

        const employeeRow = employeePage.locator('tr.mat-mdc-row').filter({
          hasText: comment,
        }).first();

        await expect(employeeRow).toBeVisible();
        await expect(employeeRow).toContainText(/rejected|abgelehnt/i);
      } finally {
        await employeeContext.close();
      }
    } finally {
      await deleteUser(adminContext.request, employee.id);
      await adminContext.close();
    }
  });
});
