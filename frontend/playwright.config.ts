import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const defaultE2EUsername = 'superadmin';
const defaultE2EPassword = 'e2e-password';
const defaultE2ERole = 'superadmin';
const defaultSuperadminHash = '$2y$12$NbknWRuTj0kcQYJFgZA0U.VeyznJPAWpRWyzGwI97jMYx/KUVeFky';
const frontendUrl = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4200';
const backendUrl = process.env.E2E_API_URL ?? 'http://127.0.0.1:8000';
const backendHealthUrl = `${backendUrl}/api/auth/config`;
const configuredWorkers = Number(process.env.E2E_WORKERS ?? (process.env.CI ? '1' : '1'));
const backendRoot = path.resolve(__dirname, '../backend');
const e2eDatabasePath = process.env.E2E_DB_DATABASE ?? path.join(backendRoot, 'database', 'e2e.sqlite');
const reuseExistingServers = process.env.E2E_REUSE_EXISTING_SERVER === 'true';

process.env.E2E_BASE_URL ??= frontendUrl;
process.env.E2E_API_URL ??= backendUrl;
process.env.E2E_USERNAME ??= defaultE2EUsername;
process.env.E2E_PASSWORD ??= defaultE2EPassword;
process.env.E2E_ROLE ??= defaultE2ERole;

const backendEnv = {
  ...process.env,
  APP_ENV: process.env.E2E_APP_ENV ?? 'e2e',
  APP_URL: backendUrl,
  FRONTEND_URL: frontendUrl,
  AUTH_OAUTH_ENABLED: process.env.E2E_AUTH_OAUTH_ENABLED ?? 'false',
  SUPERADMIN_USERNAME: process.env.E2E_SUPERADMIN_USERNAME ?? defaultE2EUsername,
  SUPERADMIN_PASSWORD: process.env.E2E_SUPERADMIN_HASH ?? defaultSuperadminHash,
  DB_CONNECTION: process.env.E2E_DB_CONNECTION ?? 'sqlite',
  DB_DATABASE: e2eDatabasePath,
  CACHE_STORE: process.env.E2E_CACHE_STORE ?? 'file',
  SESSION_DRIVER: process.env.E2E_SESSION_DRIVER ?? 'file',
  SANCTUM_STATEFUL_DOMAINS: process.env.E2E_SANCTUM_STATEFUL_DOMAINS ?? '127.0.0.1:4200',
};

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
      command: 'php -r "file_exists(\'database/e2e.sqlite\') || touch(\'database/e2e.sqlite\');" && php artisan config:clear && php artisan route:clear && php artisan hournest:e2e-prepare && php artisan serve --host=127.0.0.1 --port=8000',
      url: backendHealthUrl,
      cwd: '../backend',
      env: backendEnv,
      reuseExistingServer: reuseExistingServers,
      timeout: 120_000,
    },
    {
      command: 'npx.cmd ng serve --host 127.0.0.1 --port 4200',
      url: `${frontendUrl}/login`,
      cwd: '.',
      reuseExistingServer: reuseExistingServers,
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
