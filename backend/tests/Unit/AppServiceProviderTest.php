<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Demo\DemoSafety;
use App\Providers\AppServiceProvider;
use App\System\SchemaCompatibilityGuard;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class AppServiceProviderTest extends TestCase
{
    public function test_app_service_provider_invokes_runtime_safety_guards(): void
    {
        $demoSafety = Mockery::mock(DemoSafety::class);
        $demoSafety->shouldReceive('assertRuntimeSafety')
            ->once()
            ->with('testing');

        $schemaGuard = Mockery::mock(SchemaCompatibilityGuard::class);
        $schemaGuard->shouldReceive('assertNoDowngradeRisk')
            ->once();

        $this->app->instance(DemoSafety::class, $demoSafety);
        $this->app->instance(SchemaCompatibilityGuard::class, $schemaGuard);

        (new AppServiceProvider($this->app))->boot();

        $this->assertTrue(true);
    }

    public function test_app_service_provider_does_not_hide_downgrade_errors(): void
    {
        $demoSafety = Mockery::mock(DemoSafety::class);
        $demoSafety->shouldReceive('assertRuntimeSafety')
            ->once()
            ->with('testing');

        $schemaGuard = Mockery::mock(SchemaCompatibilityGuard::class);
        $schemaGuard->shouldReceive('assertNoDowngradeRisk')
            ->once()
            ->andThrow(new RuntimeException('Database schema is newer than this application package.'));

        $this->app->instance(DemoSafety::class, $demoSafety);
        $this->app->instance(SchemaCompatibilityGuard::class, $schemaGuard);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Database schema is newer than this application package.');

        (new AppServiceProvider($this->app))->boot();
    }
}
