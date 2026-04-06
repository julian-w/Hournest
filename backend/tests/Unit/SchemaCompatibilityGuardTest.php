<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\System\SchemaCompatibilityGuard;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

class SchemaCompatibilityGuardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guard_allows_missing_migration_table(): void
    {
        config()->set('app.allow_schema_downgrade', false);

        \Illuminate\Support\Facades\Schema::drop('migrations');

        app(SchemaCompatibilityGuard::class)->assertNoDowngradeRisk();

        $this->assertTrue(true);
    }

    public function test_guard_allows_current_schema(): void
    {
        config()->set('app.allow_schema_downgrade', false);

        app(SchemaCompatibilityGuard::class)->assertNoDowngradeRisk();

        $this->assertTrue(true);
    }

    public function test_guard_blocks_unknown_applied_migrations(): void
    {
        config()->set('app.allow_schema_downgrade', false);

        DB::table('migrations')->insert([
            'migration' => '2099_12_31_999999_future_schema_change',
            'batch' => 999,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Downgrades are blocked');

        app(SchemaCompatibilityGuard::class)->assertNoDowngradeRisk();
    }

    public function test_guard_respects_custom_migration_table_configuration(): void
    {
        config()->set('app.allow_schema_downgrade', false);
        config()->set('database.migrations.table', 'custom_migrations');

        \Illuminate\Support\Facades\Schema::rename('migrations', 'custom_migrations');

        DB::table('custom_migrations')->insert([
            'migration' => '2099_12_31_999999_future_schema_change',
            'batch' => 999,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('future_schema_change');

        app(SchemaCompatibilityGuard::class)->assertNoDowngradeRisk();
    }

    public function test_guard_can_be_overridden_explicitly(): void
    {
        config()->set('app.allow_schema_downgrade', true);

        DB::table('migrations')->insert([
            'migration' => '2099_12_31_999999_future_schema_change',
            'batch' => 999,
        ]);

        app(SchemaCompatibilityGuard::class)->assertNoDowngradeRisk();

        $this->assertTrue(true);
    }
}
