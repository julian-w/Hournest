<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\BlackoutPeriod;
use App\Models\Holiday;
use App\Models\TimeBookingTemplate;
use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DemoRefreshCommandTest extends TestCase
{
    /**
     * Sync rule:
     * If DemoScenarioBuilder changes its seeded scenario catalog, update this coverage test
     * and the developer documentation in documentation/docs/dev/demo-mode*.md in the same change.
     */
    use RefreshDatabase;

    public function test_demo_refresh_command_requires_demo_enabled(): void
    {
        config()->set('demo.enabled', false);
        config()->set('auth.oauth_enabled', false);

        $this->artisan('hournest:demo:refresh')
            ->expectsOutputToContain('Demo refresh requires DEMO_ENABLED=true.')
            ->assertExitCode(1);
    }

    public function test_demo_refresh_command_requires_demo_environment_without_force_flag(): void
    {
        config()->set('demo.enabled', true);
        config()->set('auth.oauth_enabled', false);
        config()->set('demo.allow_default_passwords', true);
        config()->set('demo.require_dedicated_database', false);

        $this->artisan('hournest:demo:refresh')
            ->expectsOutputToContain('APP_ENV=demo')
            ->assertExitCode(1);
    }

    public function test_demo_refresh_command_seeds_date_relative_demo_data(): void
    {
        config()->set('demo.reference_date', '2026-04-06');

        $this->artisan('db:seed', [
            '--class' => 'Database\\Seeders\\DemoDatabaseSeeder',
        ])->assertExitCode(0);

        $this->assertDatabaseHas('users', [
            'email' => 'anna.admin@demo.hournest.local',
            'role' => 'admin',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'mona.keller@demo.hournest.local',
            'vacation_days_per_year' => 24,
        ]);

        $this->assertDatabaseHas('vacations', [
            'status' => 'approved',
            'scope' => 'morning',
        ]);

        $this->assertDatabaseHas('vacations', [
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('absences', [
            'status' => 'acknowledged',
            'type' => 'illness',
        ]);

        $this->assertDatabaseHas('blackout_periods', [
            'type' => 'freeze',
            'reason' => 'Quarter-end delivery freeze',
        ]);

        $this->assertTrue(
            BlackoutPeriod::query()
                ->where('type', 'company_holiday')
                ->whereDate('start_date', '2026-12-24')
                ->whereDate('end_date', '2026-12-31')
                ->exists()
        );

        $this->assertTrue(
            Holiday::query()
                ->where('name', 'Good Friday')
                ->whereDate('date', '2026-04-03')
                ->exists()
        );

        $this->assertDatabaseHas('time_booking_templates', [
            'name' => 'Customer Sprint',
        ]);

        $lisa = User::where('email', 'lisa.braun@demo.hournest.local')->firstOrFail();
        $this->assertDatabaseHas('time_entries', [
            'user_id' => $lisa->id,
        ]);

        $this->assertDatabaseHas('time_locks', [
            'year' => 2026,
            'month' => 3,
        ]);

        $this->assertDatabaseHas('vacation_ledger_entries', [
            'year' => 2026,
            'type' => 'carryover',
        ]);
    }

    public function test_standard_demo_dataset_covers_all_documented_statuses_and_scopes(): void
    {
        config()->set('demo.reference_date', '2026-04-06');

        $this->artisan('db:seed', [
            '--class' => 'Database\\Seeders\\DemoDatabaseSeeder',
        ])->assertExitCode(0);

        $this->assertEqualsCanonicalizing(
            ['approved', 'pending', 'rejected'],
            DB::table('vacations')->distinct()->pluck('status')->all()
        );
        $this->assertEqualsCanonicalizing(
            ['full_day', 'morning', 'afternoon'],
            DB::table('vacations')->distinct()->pluck('scope')->all()
        );

        $this->assertEqualsCanonicalizing(
            ['pending', 'approved', 'rejected', 'acknowledged', 'admin_created'],
            DB::table('absences')->distinct()->pluck('status')->all()
        );
        $this->assertEqualsCanonicalizing(
            ['illness', 'special_leave'],
            DB::table('absences')->distinct()->pluck('type')->all()
        );
        $this->assertEqualsCanonicalizing(
            ['full_day', 'morning', 'afternoon'],
            DB::table('absences')->distinct()->pluck('scope')->all()
        );

        $this->assertEqualsCanonicalizing(
            ['entitlement', 'carryover', 'bonus', 'taken', 'expired', 'adjustment'],
            DB::table('vacation_ledger_entries')->distinct()->pluck('type')->all()
        );
        $this->assertEqualsCanonicalizing(
            ['freeze', 'company_holiday'],
            DB::table('blackout_periods')->distinct()->pluck('type')->all()
        );
        $this->assertEqualsCanonicalizing(
            ['fixed', 'variable'],
            DB::table('holidays')->distinct()->pluck('type')->all()
        );
    }

    public function test_full_demo_dataset_variant_adds_density(): void
    {
        config()->set('demo.reference_date', '2026-04-06');
        config()->set('demo.dataset_variant', 'full');

        $this->artisan('db:seed', [
            '--class' => 'Database\\Seeders\\DemoDatabaseSeeder',
        ])->assertExitCode(0);

        $this->assertDatabaseHas('time_booking_templates', [
            'name' => 'Leadership Review Week',
        ]);
        $this->assertDatabaseHas('time_booking_templates', [
            'name' => 'Weekend Support Mix',
        ]);
        $this->assertDatabaseHas('absences', [
            'status' => 'approved',
            'scope' => 'morning',
            'comment' => 'Parent-teacher conference',
        ]);
        $this->assertDatabaseHas('vacations', [
            'status' => 'pending',
            'scope' => 'morning',
            'comment' => 'School event',
        ]);

        $this->assertGreaterThanOrEqual(8, TimeEntry::query()->count());
        $this->assertGreaterThanOrEqual(5, TimeBookingTemplate::query()->count());
        $this->assertDatabaseCount('time_locks', 2);
    }
}
