import { expect, test } from '@playwright/test';
import { createAbsenceRequest, createLocalEmployee, deleteUser, uniqueSuffix } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';

function nextBusinessDayOffset(baseOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + baseOffset);

  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString().split('T')[0];
}

test.describe('absence approval flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the absence approval flow.');

  test('admin approves a special-leave request and the employee sees the approved status', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const comment = `E2E absence ${suffix}`;
    const startDate = nextBusinessDayOffset(14);

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

        try {
          await loginInContext(employeeContext, employeeCredentials);
          await createAbsenceRequest(employeeApi, {
            startDate,
            endDate: startDate,
            type: 'special_leave',
            comment,
          });

          const adminPage = await adminContext.newPage();
          await adminPage.goto('/admin/absences');

          const pendingRow = adminPage.locator('tr.mat-mdc-row').filter({ hasText: employee.displayName }).filter({ hasText: comment }).first();
          await expect(pendingRow).toBeVisible();
          await pendingRow.getByRole('button').filter({ hasText: /approve|genehmigen/i }).click();
          await expect(pendingRow).toHaveCount(0);

          const employeePage = await employeeContext.newPage();
          await employeePage.goto('/my-absences');

          const row = employeePage.locator('tr.mat-mdc-row').filter({ hasText: comment }).first();
          await expect(row).toBeVisible();
          await expect(row).toContainText(/approved|genehmigt/i);
        } finally {
          await employeeApi.dispose();
        }
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
