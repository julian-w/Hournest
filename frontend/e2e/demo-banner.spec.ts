import { expect, test } from '@playwright/test';
import { createAuthenticatedRequestContext, getConfiguredCredentials, loginAsConfiguredUser } from './helpers/auth';

test.describe('demo mode banner', () => {
  test('shows the demo banner on login and after login, and hides password actions when disabled', async ({ page }) => {
    await page.goto('/login');

    const banner = page.getByTestId('demo-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Public demo preview');
    await expect(page.getByTestId('change-password-button')).toHaveCount(0);

    const bannerBox = await banner.boundingBox();
    const loginCard = page.locator('mat-card.login-card');
    const loginCardBox = await loginCard.boundingBox();

    expect(bannerBox).not.toBeNull();
    expect(loginCardBox).not.toBeNull();
    expect(loginCardBox!.y).toBeGreaterThanOrEqual(bannerBox!.y + bannerBox!.height - 1);

    await page.screenshot({
      path: 'test-results/demo-banner-login.png',
      fullPage: true,
    });

    await loginAsConfiguredUser(page);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Public demo preview');
    await expect(page.getByTestId('change-password-button')).toHaveCount(0);
  });

  test('keeps the password change API blocked in demo mode even for authenticated admins', async ({ page }) => {
    await loginAsConfiguredUser(page);

    const request = await createAuthenticatedRequestContext(page.context());
    const { password } = getConfiguredCredentials();

    const response = await request.post('/api/auth/change-password', {
      data: {
        current_password: password,
        new_password: 'demo-blocked-password',
        new_password_confirmation: 'demo-blocked-password',
      },
    });

    const body = await response.json();

    expect(response.status()).toBe(403);
    expect(body).toMatchObject({
      demo_blocked: true,
      demo_capability: 'password_change',
    });

    await request.dispose();
  });
});
