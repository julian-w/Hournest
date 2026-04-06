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
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { currentWeekIsoDates, isWeekendIsoDate, toTemplateDayLabel } from './helpers/ui';

test.describe('time tracking copy previous day flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the time-tracking copy-previous-day flow.');

  test('employee copies the previous booked day into the selected day', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as a generated employee.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();

    const adminContext = await browser.newContext();
    await loginInContext(adminContext, adminCredentials);
    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });
    const employee = await createLocalEmployee(adminApi, suffix);
    const employeeCredentials = {
      username: employee.email,
      password: employee.password,
    };
    const costCenterA = await createCostCenter(adminApi, {
      code: `E2EC-${suffix}`,
      name: `E2E Copy A ${suffix}`,
    });
    const costCenterB = await createCostCenter(adminApi, {
      code: `E2ED-${suffix}`,
      name: `E2E Copy B ${suffix}`,
    });

    await assignUserCostCenters(adminApi, employee.id, [costCenterA.id, costCenterB.id]);

    try {
      const employeeContext = await browser.newContext();
      try {
        const employeeApi = await createLoggedInApiRequestContext(employeeCredentials);

        try {
          await loginInContext(employeeContext, employeeCredentials);
          const editableDates: string[] = [];
          for (const candidateDate of currentWeekIsoDates().filter(date => !isWeekendIsoDate(date))) {
            try {
              await createTimeEntry(employeeApi, {
                date: candidateDate,
                startTime: '08:00',
                endTime: '16:00',
                breakMinutes: 30,
              });
              editableDates.push(candidateDate);
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              if (message.includes('This is not a working day for you.') || message.includes('company holiday')) {
                continue;
              }
              throw error;
            }

            if (editableDates.length === 2) {
              break;
            }
          }

          expect(editableDates.length).toBeGreaterThanOrEqual(2);
          const [sourceDate, targetDate] = editableDates;
          const targetDayIndex = currentWeekIsoDates().indexOf(targetDate);
          await createTimeBookings(employeeApi, {
            date: sourceDate,
            bookings: [
              { cost_center_id: costCenterA.id, percentage: 75 },
              { cost_center_id: costCenterB.id, percentage: 25 },
            ],
          });

        const page = await employeeContext.newPage();
        await page.goto('/time-tracking');
        await expect(page.locator('app-time-tracking')).toBeVisible();

        const templateDaySelect = page.locator('mat-form-field').filter({ hasText: /template day/i }).locator('mat-select');
        await templateDaySelect.click();
        await page.getByRole('option', { name: toTemplateDayLabel(targetDate), exact: true }).click();
        await expect(templateDaySelect).toContainText(toTemplateDayLabel(targetDate));

        const copyPreviousDayResponse = page.waitForResponse(response =>
          response.url().includes('/api/time-bookings?')
          && response.request().method() === 'GET'
          && response.ok(),
        );
        await page.getByRole('button').filter({
          has: page.locator('mat-icon', { hasText: 'redo' }),
        }).click();
        const copyPreviousDayResult = await copyPreviousDayResponse;
        const copyPreviousDayPayload = await copyPreviousDayResult.json();
        expect(copyPreviousDayPayload.data.some((booking: { date: string }) => booking.date === sourceDate)).toBeTruthy();

        const bookingRows = page.locator('.grid-row').filter({ has: page.locator('.pct-input') });
        const firstTargetInput = bookingRows.nth(0).locator('.day-col').nth(targetDayIndex).locator('.pct-input:not([disabled])');
        const secondTargetInput = bookingRows.nth(1).locator('.day-col').nth(targetDayIndex).locator('.pct-input:not([disabled])');

        await expect(firstTargetInput).toHaveValue('75');
          await expect(secondTargetInput).toHaveValue('25');
        } finally {
          await employeeApi.dispose();
        }
      } finally {
        await employeeContext.close();
      }
    } finally {
      await archiveCostCenter(adminApi, costCenterA.id);
      await archiveCostCenter(adminApi, costCenterB.id);
      await deleteUser(adminApi, employee.id);
      await adminApi.dispose();
      await adminContext.close();
    }
  });
});
