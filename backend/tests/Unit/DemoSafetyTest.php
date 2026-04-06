<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Demo\DemoSafety;
use RuntimeException;
use Tests\TestCase;

class DemoSafetyTest extends TestCase
{
    public function test_default_demo_passwords_are_detected(): void
    {
        config()->set('demo.login_password', DemoSafety::DEFAULT_LOGIN_PASSWORD);

        $issues = app(DemoSafety::class)->defaultPasswordIssues();

        $this->assertSame(['DEMO_LOGIN_PASSWORD'], $issues);
    }

    public function test_runtime_safety_rejects_default_passwords_in_demo_environment(): void
    {
        config()->set('demo.enabled', true);
        config()->set('auth.oauth_enabled', false);
        config()->set('demo.allow_default_passwords', false);
        config()->set('demo.require_dedicated_database', false);
        config()->set('demo.login_password', DemoSafety::DEFAULT_LOGIN_PASSWORD);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Demo mode must not run with default credentials');

        app(DemoSafety::class)->assertRuntimeSafety('demo');
    }

    public function test_runtime_safety_requires_a_dedicated_demo_database(): void
    {
        config()->set('demo.enabled', true);
        config()->set('auth.oauth_enabled', false);
        config()->set('demo.allow_default_passwords', true);
        config()->set('demo.require_dedicated_database', true);
        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', database_path('database.sqlite'));

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('dedicated database');

        app(DemoSafety::class)->assertRuntimeSafety('demo');
    }

    public function test_demo_database_detection_accepts_demo_named_sqlite_database(): void
    {
        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', database_path('demo.sqlite'));

        $this->assertTrue(app(DemoSafety::class)->usesDedicatedDatabase());
    }

    public function test_demo_database_detection_accepts_demo_named_server_database(): void
    {
        config()->set('database.default', 'pgsql');
        config()->set('database.connections.pgsql.database', 'hournest_demo');

        $this->assertTrue(app(DemoSafety::class)->usesDedicatedDatabase());
    }

    public function test_runtime_safety_rejects_oauth_in_demo_mode(): void
    {
        config()->set('demo.enabled', true);
        config()->set('auth.oauth_enabled', true);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('AUTH_OAUTH_ENABLED=false');

        app(DemoSafety::class)->assertRuntimeSafety('demo');
    }
}
