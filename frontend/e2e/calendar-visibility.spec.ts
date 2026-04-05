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
import { getConfiguredCredentials, hasAdminE2ECredentials, isLocalLoginEnabled, loginInContext } from './helpers/auth';

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

    const viewer = await createLocalEmployee(adminContext.request, `${suffix}-viewer`);
    const teammate = await createLocalEmployee(adminContext.request, `${suffix}-teammate`);
    const outsider = await createLocalEmployee(adminContext.request, `${suffix}-outsider`);
    const group = await createUserGroup(adminContext.request, {
      name: `E2E Calendar Group ${suffix}`,
      description: 'Shared calendar visibility test group',
    });

    try {
      await setGroupMembers(adminContext.request, group.id, [viewer.id, teammate.id]);

      const teammateContext = await browser.newContext();
      const outsiderContext = await browser.newContext();
      const viewerContext = await browser.newContext();

      try {
        await loginInContext(teammateContext, {
          username: teammate.email,
          password: teammate.password,
        });
        await loginInContext(outsiderContext, {
          username: outsider.email,
          password: outsider.password,
        });
        await loginInContext(viewerContext, {
          username: viewer.email,
          password: viewer.password,
        });

        const teammateVacationId = await createVacationRequest(teammateContext.request, {
          startDate,
          endDate: startDate,
          comment: sharedComment,
        });
        const outsiderVacationId = await createVacationRequest(outsiderContext.request, {
          startDate,
          endDate: startDate,
          comment: outsiderComment,
        });

        await reviewVacationRequest(adminContext.request, teammateVacationId, {
          status: 'approved',
          comment: 'E2E approved shared vacation',
        });
        await reviewVacationRequest(adminContext.request, outsiderVacationId, {
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
        await viewerContext.close();
        await outsiderContext.close();
        await teammateContext.close();
      }
    } finally {
      await deleteUserGroup(adminContext.request, group.id);
      await deleteUser(adminContext.request, outsider.id);
      await deleteUser(adminContext.request, teammate.id);
      await deleteUser(adminContext.request, viewer.id);
      await adminContext.close();
    }
  });
});
