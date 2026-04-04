<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\LedgerEntryType;
use App\Models\Setting;
use App\Models\User;
use App\Models\VacationLedgerEntry;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class YearlyMaintenanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_books_entitlement_for_all_users(): void
    {
        $user1 = User::factory()->create(['vacation_days_per_year' => 30]);
        $user2 = User::factory()->create(['vacation_days_per_year' => 25]);

        $this->artisan('hournest:yearly-maintenance', ['--year' => 2026])
            ->assertExitCode(0);

        $this->assertDatabaseHas('vacation_ledger_entries', [
            'user_id' => $user1->id,
            'year' => 2026,
            'type' => 'entitlement',
            'days' => 30,
        ]);

        $this->assertDatabaseHas('vacation_ledger_entries', [
            'user_id' => $user2->id,
            'year' => 2026,
            'type' => 'entitlement',
            'days' => 25,
        ]);
    }

    public function test_does_not_duplicate_entitlement(): void
    {
        $user = User::factory()->create(['vacation_days_per_year' => 30]);

        $this->artisan('hournest:yearly-maintenance', ['--year' => 2026])
            ->assertExitCode(0);
        $this->artisan('hournest:yearly-maintenance', ['--year' => 2026])
            ->assertExitCode(0);

        $count = VacationLedgerEntry::where('user_id', $user->id)
            ->where('year', 2026)
            ->where('type', LedgerEntryType::Entitlement)
            ->count();

        $this->assertEquals(1, $count);
    }

    public function test_books_carryover_from_previous_year(): void
    {
        Setting::set('carryover_enabled', true);

        $user = User::factory()->create(['vacation_days_per_year' => 30]);

        // Previous year: 30 entitlement - 10 taken = 20 remaining
        VacationLedgerEntry::create([
            'user_id' => $user->id,
            'year' => 2025,
            'type' => LedgerEntryType::Entitlement,
            'days' => 30,
            'comment' => 'Entitlement 2025',
        ]);
        VacationLedgerEntry::create([
            'user_id' => $user->id,
            'year' => 2025,
            'type' => LedgerEntryType::Taken,
            'days' => -10,
            'comment' => 'Vacation taken',
        ]);

        $this->artisan('hournest:yearly-maintenance', ['--year' => 2026])
            ->assertExitCode(0);

        $this->assertDatabaseHas('vacation_ledger_entries', [
            'user_id' => $user->id,
            'year' => 2026,
            'type' => 'carryover',
            'days' => 20,
        ]);
    }

    public function test_skips_carryover_when_disabled(): void
    {
        Setting::set('carryover_enabled', false);

        $user = User::factory()->create(['vacation_days_per_year' => 30]);

        VacationLedgerEntry::create([
            'user_id' => $user->id,
            'year' => 2025,
            'type' => LedgerEntryType::Entitlement,
            'days' => 30,
            'comment' => 'Entitlement 2025',
        ]);

        $this->artisan('hournest:yearly-maintenance', ['--year' => 2026])
            ->assertExitCode(0);

        $this->assertDatabaseMissing('vacation_ledger_entries', [
            'user_id' => $user->id,
            'year' => 2026,
            'type' => 'carryover',
        ]);
    }

    public function test_dry_run_makes_no_changes(): void
    {
        $user = User::factory()->create(['vacation_days_per_year' => 30]);

        $this->artisan('hournest:yearly-maintenance', ['--year' => 2026, '--dry-run' => true])
            ->assertExitCode(0);

        $count = VacationLedgerEntry::where('user_id', $user->id)
            ->where('year', 2026)
            ->count();

        $this->assertEquals(0, $count);
    }

    public function test_does_not_duplicate_carryover(): void
    {
        Setting::set('carryover_enabled', true);

        $user = User::factory()->create(['vacation_days_per_year' => 30]);

        VacationLedgerEntry::create([
            'user_id' => $user->id,
            'year' => 2025,
            'type' => LedgerEntryType::Entitlement,
            'days' => 30,
            'comment' => 'Entitlement 2025',
        ]);

        $this->artisan('hournest:yearly-maintenance', ['--year' => 2026])->assertExitCode(0);
        $this->artisan('hournest:yearly-maintenance', ['--year' => 2026])->assertExitCode(0);

        $count = VacationLedgerEntry::where('user_id', $user->id)
            ->where('year', 2026)
            ->where('type', LedgerEntryType::Carryover)
            ->count();

        $this->assertEquals(1, $count);
    }

    public function test_books_expired_entry_when_carryover_expiry_has_passed(): void
    {
        Carbon::setTestNow('2026-04-04');
        Setting::set('carryover_expiry_date', '31.03');

        $user = User::factory()->create(['vacation_days_per_year' => 30]);

        VacationLedgerEntry::create([
            'user_id' => $user->id,
            'year' => 2026,
            'type' => LedgerEntryType::Carryover,
            'days' => 5,
            'comment' => 'Carried over from 2025',
        ]);

        $this->artisan('hournest:yearly-maintenance', ['--year' => 2026])
            ->assertExitCode(0);

        $this->assertDatabaseHas('vacation_ledger_entries', [
            'user_id' => $user->id,
            'year' => 2026,
            'type' => 'expired',
            'days' => -5,
            'comment' => 'Carryover expired on 31.03',
        ]);

        Carbon::setTestNow();
    }

    public function test_does_not_expire_carryover_before_expiry_date(): void
    {
        Carbon::setTestNow('2026-03-15');
        Setting::set('carryover_expiry_date', '31.03');

        $user = User::factory()->create(['vacation_days_per_year' => 30]);

        VacationLedgerEntry::create([
            'user_id' => $user->id,
            'year' => 2026,
            'type' => LedgerEntryType::Carryover,
            'days' => 5,
            'comment' => 'Carried over from 2025',
        ]);

        $this->artisan('hournest:yearly-maintenance', ['--year' => 2026])
            ->assertExitCode(0);

        $this->assertDatabaseMissing('vacation_ledger_entries', [
            'user_id' => $user->id,
            'year' => 2026,
            'type' => 'expired',
        ]);

        Carbon::setTestNow();
    }

    public function test_does_not_duplicate_expired_entry(): void
    {
        Carbon::setTestNow('2026-04-04');
        Setting::set('carryover_expiry_date', '31.03');

        $user = User::factory()->create(['vacation_days_per_year' => 30]);

        VacationLedgerEntry::create([
            'user_id' => $user->id,
            'year' => 2026,
            'type' => LedgerEntryType::Carryover,
            'days' => 5,
            'comment' => 'Carried over from 2025',
        ]);

        $this->artisan('hournest:yearly-maintenance', ['--year' => 2026])->assertExitCode(0);
        $this->artisan('hournest:yearly-maintenance', ['--year' => 2026])->assertExitCode(0);

        $count = VacationLedgerEntry::where('user_id', $user->id)
            ->where('year', 2026)
            ->where('type', LedgerEntryType::Expired)
            ->count();

        $this->assertEquals(1, $count);

        Carbon::setTestNow();
    }
}
