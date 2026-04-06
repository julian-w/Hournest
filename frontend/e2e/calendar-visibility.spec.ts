import { expect, Page, test } from '@playwright/test';
import {
  createLocalEmployee,
  createUserGroup,
  createVacationRequest,
  deleteUser,
  deleteUserGroup,
  reviewVacationRequest,
  setGroupMembers,
  uniqueSuffix,
} from './helpers/admin-api';
import { createLoggedInApiRequestContext, getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';

function nextBusinessDayOffset(baseOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + baseOffset);

  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString().split('T')[0];
}

async function goToMonth(page: Page, isoDate: string): Promise<void> {
  const target = new Date(`${isoDate}T00:00:00`);
  const targetLabel = target.toLocaleString('en', { month: 'long' });
  const targetYear = String(target.getFullYear());
  const header = page.locator('app-calendar h2');

  for (let attempts = 0; attempts < 3; attempts++) {
    const label = await header.textContent();
    if (label?.includes(targetLabel) && label.includes(targetYear)) {
      return;
    }

    await page.getByRole('button').filter({ has: page.locator('mat-icon', { hasText: 'chevron_right' }) }).first().click();
  }
}

test.describe('calendar visibility flow', () => {
  test.skip(!hasAdminE2ECredentials(), 'Set admin or superadmin credentials to run the calendar visibility flow.');

  test('employee sees approved vacations from a shared group but not from unrelated users', async ({ browser, request }) => {
    test.skip(!(await isLocalLoginEnabled(request)), 'This E2E flow needs local login enabled to sign in as generated employees.');

    const adminCredentials = getConfiguredCredentials();
    const suffix = uniqueSuffix();
    const sharedComment = `E2E shared vacation ${suffix}`;
    const outsiderComment = `E2E outsider vacation ${suffix}`;
    const startDate = nextBusinessDayOffset(8);

    const adminContext = await browser.newContext();
    await loginInContext(adminContext, adminCredentials);
    const adminApi = await createLoggedInApiRequestContext({ ...adminCredentials });

    const viewer = await createLocalEmployee(adminApi, `${suffix}-viewer`);
    const teammate = await createLocalEmployee(adminApi, `${suffix}-teammate`);
    const outsider = await createLocalEmployee(adminApi, `${suffix}-outsider`);
    const viewerCredentials = {
      username: viewer.email,
      password: viewer.password,
    };
    const teammateCredentials = {
      username: teammate.email,
      password: teammate.password,
    };
    const outsiderCredentials = {
      username: outsider.email,
      password: outsider.password,
    };
    const group = await createUserGroup(adminApi, {
      name: `E2E Calendar Group ${suffix}`,
      description: 'Shared calendar visibility test group',
    });

    try {
      await setGroupMembers(adminApi, group.id, [viewer.id, teammate.id]);

      const teammateContext = await browser.newContext();
      const outsiderContext = await browser.newContext();
      const viewerContext = await browser.newContext();

      try {
        const teammateApi = await createLoggedInApiRequestContext(teammateCredentials);
        const outsiderApi = await createLoggedInApiRequestContext(outsiderCredentials);
        const viewerApi = await createLoggedInApiRequestContext(viewerCredentials);

        try {
          await loginInContext(teammateContext, teammateCredentials);
          await loginInContext(outsiderContext, outsiderCredentials);
          await loginInContext(viewerContext, viewerCredentials);
          const teammateVacationId = await createVacationRequest(teammateApi, {
            startDate,
            endDate: startDate,
            comment: sharedComment,
          });
          const outsiderVacationId = await createVacationRequest(outsiderApi, {
            startDate,
            endDate: startDate,
            comment: outsiderComment,
          });

          await reviewVacationRequest(adminApi, teammateVacationId, {
            status: 'approved',
            comment: 'E2E approved shared vacation',
          });
          await reviewVacationRequest(adminApi, outsiderVacationId, {
            status: 'approved',
            comment: 'E2E approved outsider vacation',
          });

          const viewerPage = await viewerContext.newPage();
          await viewerPage.goto('/calendar');
          await goToMonth(viewerPage, startDate);

          const legend = viewerPage.locator('.legend');
          await expect(legend).toContainText(teammate.displayName);
          await expect(legend).not.toContainText(outsider.displayName);
        } finally {
          await viewerApi.dispose();
          await outsiderApi.dispose();
          await teammateApi.dispose();
        }
      } finally {
        await viewerContext.close();
        await outsiderContext.close();
        await teammateContext.close();
      }
    } finally {
      await deleteUserGroup(adminApi, group.id);
      await deleteUser(adminApi, outsider.id);
      await deleteUser(adminApi, teammate.id);
      await deleteUser(adminApi, viewer.id);
      await adminApi.dispose();
      await adminContext.close();
    }
  });
});
