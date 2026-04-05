import { defineConfig, devices } from '@playwright/test';

const frontendUrl = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4200';
const backendUrl = process.env.E2E_API_URL ?? 'http://127.0.0.1:8000';
const backendHealthUrl = `${backendUrl}/api/auth/config`;
const configuredWorkers = Number(process.env.E2E_WORKERS ?? (process.env.CI ? '1' : '1'));

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: Number.isFinite(configuredWorkers) && configuredWorkers > 0 ? configuredWorkers : 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: frontendUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'php artisan serve --host=127.0.0.1 --port=8000',
      url: backendHealthUrl,
      cwd: '../backend',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npx.cmd ng serve --host 127.0.0.1 --port 4200',
      url: `${frontendUrl}/login`,
      cwd: '.',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
