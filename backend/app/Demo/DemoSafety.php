<?php

declare(strict_types=1);

namespace App\Demo;

use RuntimeException;

class DemoSafety
{
    public const DEFAULT_LOGIN_PASSWORD = 'demo-password';

    public const DEFAULT_USER_PASSWORD = self::DEFAULT_LOGIN_PASSWORD;

    public const DEFAULT_ADMIN_PASSWORD = self::DEFAULT_LOGIN_PASSWORD;

    public function assertRuntimeSafety(string $environment): void
    {
        if (!$this->isDemoEnabled()) {
            return;
        }

        $this->assertOAuthDisabled();

        if ($this->shouldSkipStrictChecks($environment)) {
            return;
        }

        if ($this->requiresDedicatedDatabase() && !$this->usesDedicatedDatabase()) {
            throw new RuntimeException(
                'Demo mode requires a dedicated database. Use a database name or path containing "demo" or "e2e".'
            );
        }

        $this->assertNonDefaultPasswords();
    }

    public function assertRefreshAllowed(string $environment, bool $forceDemo = false): void
    {
        if (!$this->isDemoEnabled()) {
            throw new RuntimeException('Demo refresh requires DEMO_ENABLED=true.');
        }

        $this->assertOAuthDisabled();

        if (!$forceDemo && $environment !== 'demo') {
            throw new RuntimeException(
                'Demo refresh only runs automatically in APP_ENV=demo. Use --force-demo to override deliberately.'
            );
        }

        if (!$forceDemo && $this->requiresDedicatedDatabase() && !$this->usesDedicatedDatabase()) {
            throw new RuntimeException(
                'Demo refresh requires a dedicated database. Use a database name or path containing "demo" or "e2e", or pass --force-demo if you have verified the target.'
            );
        }

        if (!$this->shouldSkipStrictChecks($environment)) {
            $this->assertNonDefaultPasswords();
        }
    }

    /**
     * @return array<int, string>
     */
    public function defaultPasswordIssues(): array
    {
        $issues = [];

        if ((string) config('demo.login_password', self::DEFAULT_LOGIN_PASSWORD) === self::DEFAULT_LOGIN_PASSWORD) {
            $issues[] = 'DEMO_LOGIN_PASSWORD';
        }

        return $issues;
    }

    public function usesDedicatedDatabase(): bool
    {
        $connectionName = (string) config('database.default');
        $database = config("database.connections.{$connectionName}.database");

        if (!is_string($database) || trim($database) === '') {
            return false;
        }

        if ($database === ':memory:') {
            return true;
        }

        $normalized = strtolower(str_replace('\\', '/', $database));

        return str_contains($normalized, 'demo') || str_contains($normalized, 'e2e');
    }

    private function assertNonDefaultPasswords(): void
    {
        if ($this->allowsDefaultPasswords()) {
            return;
        }

        $issues = $this->defaultPasswordIssues();
        if ($issues === []) {
            return;
        }

        throw new RuntimeException(sprintf(
            'Demo mode must not run with default credentials. Configure custom values for %s or explicitly set DEMO_ALLOW_DEFAULT_PASSWORDS=true for local/testing usage.',
            implode(', ', $issues)
        ));
    }

    private function assertOAuthDisabled(): void
    {
        if ((bool) config('auth.oauth_enabled', true)) {
            throw new RuntimeException(
                'Demo mode requires AUTH_OAUTH_ENABLED=false. OAuth/OIDC must not run in parallel with demo mode.'
            );
        }
    }

    private function isDemoEnabled(): bool
    {
        return (bool) config('demo.enabled');
    }

    private function allowsDefaultPasswords(): bool
    {
        return (bool) config('demo.allow_default_passwords', false);
    }

    private function requiresDedicatedDatabase(): bool
    {
        return (bool) config('demo.require_dedicated_database', true);
    }

    private function shouldSkipStrictChecks(string $environment): bool
    {
        return in_array($environment, ['local', 'testing', 'e2e'], true);
    }
}
