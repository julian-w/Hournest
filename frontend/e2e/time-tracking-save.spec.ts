import { expect, test } from '@playwright/test';
import { hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';

test.describe('time tracking save flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the time-tracking save flow.');

  test('employee saves weekly bookings in the UI for an existing workday', async ({ browser, request }) => {
    expect(await isLocalLoginEnabled(request)).toBeTruthy();

    const employeeCredentials = {
      username: 'e2e.employee@hournest.local',
      password: 'e2e-password',
    };

    const employeeContext = await browser.newContext();
    try {
      await loginInContext(employeeContext, employeeCredentials);

      const employeePage = await employeeContext.newPage();
      await employeePage.goto('/time-tracking');
      await expect(employeePage.locator('app-time-tracking')).toBeVisible();

      const bookingRows = employeePage.locator('app-time-tracking .grid-row').filter({
        has: employeePage.locator('.cost-center-label'),
      });
      const firstCostCenterRow = bookingRows.nth(0);
      const secondCostCenterRow = bookingRows.nth(1);
      const seededDayFirstRowInput = firstCostCenterRow.locator('input.pct-input:not([disabled])').nth(1);
      const seededDaySecondRowInput = secondCostCenterRow.locator('input.pct-input:not([disabled])').nth(1);
      const timeBookingSaveMatcher = (response: { url(): string; request(): { method(): string }; ok(): boolean }) =>
        response.url().includes('/api/time-bookings/') && response.request().method() === 'PUT' && response.ok();

      expect(await bookingRows.count()).toBeGreaterThanOrEqual(2);
      await expect(employeePage.locator('app-time-tracking .net-hours')).toContainText('8:00');

      await seededDayFirstRowInput.fill('60');
      await seededDaySecondRowInput.fill('40');

      const saveButton = employeePage.locator('button').filter({
        has: employeePage.locator('mat-icon', { hasText: 'save' }),
      }).first();

      const bookingSaveResponse = employeePage.waitForResponse(timeBookingSaveMatcher);
      await saveButton.click();
      await bookingSaveResponse;

      await employeePage.reload();
      await expect(employeePage.locator('app-time-tracking')).toBeVisible();
      await expect(employeePage.locator('app-time-tracking .grid-row').filter({
        has: employeePage.locator('.cost-center-label'),
      }).nth(0).locator('input.pct-input:not([disabled])').nth(1)).toHaveValue('60');
      await expect(employeePage.locator('app-time-tracking .grid-row').filter({
        has: employeePage.locator('.cost-center-label'),
      }).nth(1).locator('input.pct-input:not([disabled])').nth(1)).toHaveValue('40');
    } finally {
      await employeeContext.close();
    }
  });
});
