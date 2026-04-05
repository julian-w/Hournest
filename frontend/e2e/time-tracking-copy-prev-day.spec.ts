import { expect, test } from '@playwright/test';
import {
  archiveCostCenter,
  assignUserCostCenters,
  createCostCenter,
  createLocalEmployee,
  createTimeBookings,
  createTimeEntry,
  deleteUser,
  uniqueSuffix,
} from './helpers/admin-api';
import { getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { currentWeekIsoDates } from './helpers/ui';

test.describe('time tracking copy previous day flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the time-tracking copy-previous-day flow.');

  test('employee copies the previous booked day into the selected day', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const weekDates = currentWeekIsoDates();
    const sourceDate = weekDates[0];
    const targetDate = weekDates[1];

    const adminContext = await browser.newContext();
    await loginInContext(adminContext, adminCredentials);
    const employee = await createLocalEmployee(adminContext.request, suffix);
    const costCenterA = await createCostCenter(adminContext.request, {
      code: `E2EC-${suffix}`,
      name: `E2E Copy A ${suffix}`,
    });
    const costCenterB = await createCostCenter(adminContext.request, {
      code: `E2ED-${suffix}`,
      name: `E2E Copy B ${suffix}`,
    });

    await assignUserCostCenters(adminContext.request, employee.id, [costCenterA.id, costCenterB.id]);

    try {
      const employeeContext = await browser.newContext();
      try {
        await loginInContext(employeeContext, {
          username: employee.email,
          password: employee.password,
        });

        await createTimeEntry(employeeContext.request, {
          date: sourceDate,
          startTime: '08:00',
          endTime: '16:00',
          breakMinutes: 30,
        });
        await createTimeEntry(employeeContext.request, {
          date: targetDate,
          startTime: '08:00',
          endTime: '16:00',
          breakMinutes: 30,
        });
        await createTimeBookings(employeeContext.request, {
          date: sourceDate,
          bookings: [
            { cost_center_id: costCenterA.id, percentage: 75 },
            { cost_center_id: costCenterB.id, percentage: 25 },
          ],
        });

        const page = await employeeContext.newPage();
        await page.goto('/time-tracking');
        await expect(page.locator('app-time-tracking')).toBeVisible();

        await page.locator('mat-select').nth(0).click();
        await page.locator(`mat-option[value="${targetDate}"]`).click();

        await page.getByRole('button').filter({
          has: page.locator('mat-icon', { hasText: 'redo' }),
        }).click();

        const firstRowInputs = page.locator('.grid-row').filter({ has: page.locator('.pct-input') }).nth(0).locator('.pct-input:not([disabled])');
        const secondRowInputs = page.locator('.grid-row').filter({ has: page.locator('.pct-input') }).nth(1).locator('.pct-input:not([disabled])');

        await expect(firstRowInputs.nth(1)).toHaveValue('75');
        await expect(secondRowInputs.nth(1)).toHaveValue('25');
      } finally {
        await employeeContext.close();
      }
    } finally {
      await archiveCostCenter(adminContext.request, costCenterA.id);
      await archiveCostCenter(adminContext.request, costCenterB.id);
      await deleteUser(adminContext.request, employee.id);
      await adminContext.close();
    }
  });
});
