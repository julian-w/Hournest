import { expect, test } from '@playwright/test';
import { hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';

test.describe('time tracking save error flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the time-tracking save error flow.');

  test('employee gets visible feedback and no persistence when booking save fails', async ({ browser, request }) => {
    expect(await isLocalLoginEnabled(request)).toBeTruthy();

    const employeeCredentials = {
      username: 'e2e.employee@hournest.local',
      password: 'e2e-password',
    };

    const employeeContext = await browser.newContext();
    try {
      await loginInContext(employeeContext, employeeCredentials);

      const page = await employeeContext.newPage();
      await page.goto('/time-tracking');
      await expect(page.locator('app-time-tracking')).toBeVisible();

      const bookingRows = page.locator('app-time-tracking .grid-row').filter({
        has: page.locator('.cost-center-label'),
      });
      const firstRowInput = bookingRows.nth(0).locator('input.pct-input:not([disabled])').nth(1);
      const secondRowInput = bookingRows.nth(1).locator('input.pct-input:not([disabled])').nth(1);
      const totalCell = page.locator('app-time-tracking .total-row .day-col').nth(1);
      const originalFirstValue = await firstRowInput.inputValue();
      const originalSecondValue = await secondRowInput.inputValue();

      await page.route('**/api/time-bookings/**', async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Synthetic save failure' }),
          });
          return;
        }

        await route.continue();
      });

      await firstRowInput.fill('60');
      await secondRowInput.fill('40');
      await expect(totalCell).toContainText('100%');

      await page.getByRole('button', { name: /save all/i }).click();
      await expect(page.locator('mat-snack-bar-container')).toContainText('Error saving bookings.');

      await page.unroute('**/api/time-bookings/**');
      await page.reload();
      await expect(page.locator('app-time-tracking')).toBeVisible();
      await expect(bookingRows.nth(0).locator('input.pct-input:not([disabled])').nth(1)).toHaveValue(originalFirstValue);
      await expect(bookingRows.nth(1).locator('input.pct-input:not([disabled])').nth(1)).toHaveValue(originalSecondValue);
    } finally {
      await employeeContext.close();
    }
  });
});
