import { expect, test } from '@playwright/test';
import { createBlackout, deleteBlackout } from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';
import { currentWeekIsoDates } from './helpers/ui';

test.describe('time tracking company holiday flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the company-holiday flow.');

  test('employee sees company-holiday days locked in the weekly grid', async ({ browser, request }) => {
    expect(await isLocalLoginEnabled(request)).toBeTruthy();

    const adminApi = await createLoggedInApiRequestContext({ ...getConfiguredCredentials() });
    const weekDates = currentWeekIsoDates(1);
    const holidayDate = weekDates[1];
    const holidayIndex = weekDates.indexOf(holidayDate);
    const blackout = await createBlackout(adminApi, {
      type: 'company_holiday',
      start_date: holidayDate,
      end_date: holidayDate,
      reason: `Current week shutdown ${Date.now()}`,
    });

    const employeeCredentials = {
      username: 'e2e.employee@hournest.local',
      password: 'e2e-password',
    };

    try {
      const employeeContext = await browser.newContext();
      try {
        await loginInContext(employeeContext, employeeCredentials);

        const page = await employeeContext.newPage();
        await page.goto('/time-tracking');
        await expect(page.locator('app-time-tracking')).toBeVisible();
        const nextWeekButton = page.locator('button').filter({
          has: page.locator('mat-icon', { hasText: 'chevron_right' }),
        }).first();
        await nextWeekButton.click();
        await expect(page.locator('.week-label')).toContainText(weekDates[0]);

        const timeCells = page.locator('app-time-tracking .grid-row.time-row .day-col');
        const firstBookingRowCells = page.locator('app-time-tracking .grid-row').filter({
          has: page.locator('.cost-center-label'),
        }).nth(0).locator('.day-col');

        await expect(timeCells.nth(holidayIndex).locator('.absence-chip')).toContainText('Company Holiday');
        await expect(timeCells.nth(holidayIndex).locator('input.time-input')).toHaveCount(0);
        await expect(firstBookingRowCells.nth(holidayIndex).locator('input.pct-input')).toHaveCount(0);
      } finally {
        await employeeContext.close();
      }
    } finally {
      await deleteBlackout(adminApi, blackout.id);
      await adminApi.dispose();
    }
  });
});
