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

test.describe('time tracking template flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the time-tracking template flow.');

  test('employee saves a template from one day and applies it to another day', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const templateName = `E2E template ${suffix}`;
    const weekDates = currentWeekIsoDates();
    const sourceDate = weekDates[0];
    const targetDate = weekDates[1];

    const adminContext = await browser.newContext();
    await loginInContext(adminContext, adminCredentials);
    const employee = await createLocalEmployee(adminContext.request, suffix);
    const costCenterA = await createCostCenter(adminContext.request, {
      code: `E2EA-${suffix}`,
      name: `E2E Alpha ${suffix}`,
    });
    const costCenterB = await createCostCenter(adminContext.request, {
      code: `E2EB-${suffix}`,
      name: `E2E Beta ${suffix}`,
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
            { cost_center_id: costCenterA.id, percentage: 60 },
            { cost_center_id: costCenterB.id, percentage: 40 },
          ],
        });

        const page = await employeeContext.newPage();
        await page.goto('/time-tracking');
        await expect(page.locator('app-time-tracking')).toBeVisible();

        await page.locator('mat-select').nth(0).click();
        await page.locator(`mat-option[value="${sourceDate}"]`).click();

        await page.getByRole('button').filter({
          has: page.locator('mat-icon', { hasText: 'bookmark_add' }),
        }).click();

        const dialog = page.locator('mat-dialog-container app-time-booking-template-dialog');
        await expect(dialog).toBeVisible();
        await dialog.locator('input[matinput]').fill(templateName);
        await dialog.getByRole('button', { name: /save|speichern/i }).click();

        await expect(page.locator('mat-dialog-container')).toHaveCount(0);

        await page.locator('mat-select').nth(0).click();
        await page.locator(`mat-option[value="${targetDate}"]`).click();

        await page.getByRole('button').filter({
          has: page.locator('mat-icon', { hasText: 'play_arrow' }),
        }).click();

        const firstRowInputs = page.locator('.grid-row').filter({ has: page.locator('.pct-input') }).nth(0).locator('.pct-input:not([disabled])');
        const secondRowInputs = page.locator('.grid-row').filter({ has: page.locator('.pct-input') }).nth(1).locator('.pct-input:not([disabled])');

        await expect(firstRowInputs.nth(1)).toHaveValue('60');
        await expect(secondRowInputs.nth(1)).toHaveValue('40');
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
