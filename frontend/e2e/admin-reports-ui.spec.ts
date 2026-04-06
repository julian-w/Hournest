import { expect, test } from '@playwright/test';
import { assignUserCostCenters, createAbsenceRequest, createCostCenter, createLocalEmployee, createTimeBookings, createTimeEntry, deleteUser, uniqueSuffix } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { fillNativeDateInput, nextBusinessDayOffset } from './helpers/ui';

test.describe('admin reports ui flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the admin reports UI flow.');

  test('admin filters reports for generated data and can export csv', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const reportDate = nextBusinessDayOffset(26);

    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });
    const employee = await createLocalEmployee(adminApi, suffix);
    const employeeCredentials = {
      username: employee.email,
      password: employee.password,
    };

    const costCenter = await createCostCenter(adminApi, {
      code: `E2E-${suffix}`.slice(0, 20),
      name: `E2E Reports ${suffix}`,
      description: 'Generated for admin reports UI flow',
    });
    await assignUserCostCenters(adminApi, employee.id, [costCenter.id]);

    try {
      const employeeApi = await createLoggedInApiRequestContext(employeeCredentials);
      await createTimeEntry(employeeApi, {
        date: reportDate,
        startTime: '08:00',
        endTime: '16:00',
        breakMinutes: 0,
      });
      await createTimeBookings(employeeApi, {
        date: reportDate,
        bookings: [{ cost_center_id: costCenter.id, percentage: 100, comment: 'E2E report booking' }],
      });
      await createAbsenceRequest(employeeApi, {
        startDate: reportDate,
        endDate: reportDate,
        type: 'special_leave',
        comment: `E2E report absence ${suffix}`,
      });
      await employeeApi.dispose();

      const adminContext = await browser.newContext();
      try {
        await loginInContext(adminContext, adminCredentials);

        const adminPage = await adminContext.newPage();
        await adminPage.goto('/admin/reports');
        await expect(adminPage.locator('app-admin-reports')).toBeVisible();

        await fillNativeDateInput(adminPage.getByRole('textbox', { name: 'From' }), reportDate);
        await fillNativeDateInput(adminPage.getByRole('textbox', { name: 'To' }), reportDate);
        await adminPage.getByRole('combobox', { name: /group by/i }).click();
        await adminPage.getByRole('option', { name: /cost center/i }).click();

        await adminPage.getByRole('button', { name: /load/i }).click();

        await expect(adminPage.locator('mat-card.report-card').nth(0)).toContainText(costCenter.name);
        await expect(adminPage.locator('mat-card.report-card').nth(2)).toContainText(employee.displayName);
        await expect(adminPage.locator('mat-card.report-card').nth(2)).toContainText('Special Leave');
        await expect(adminPage.locator('mat-card.report-card').nth(2)).toContainText('Pending');

        const downloadPromise = adminPage.waitForEvent('download');
        await adminPage.getByRole('button', { name: /export csv/i }).click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe(`time-bookings-${reportDate}-to-${reportDate}.csv`);
        await expect(adminPage.locator('mat-snack-bar-container')).toContainText('CSV export started.');
      } finally {
        await adminContext.close();
      }
    } finally {
      await deleteUser(adminApi, employee.id);
      await adminApi.dispose();
    }
  });
});
