<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\BlackoutPeriod;
use App\Models\CostCenter;
use App\Models\TimeBooking;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\VacationLedgerEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlackoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_create_update_and_delete_blackouts(): void
    {
        $admin = User::factory()->admin()->create();
        $blackout = BlackoutPeriod::create([
            'type' => 'freeze',
            'start_date' => '2026-12-21',
            'end_date' => '2026-12-31',
            'reason' => 'Inventory',
        ]);

        $this->actingAs($admin)->getJson('/api/admin/blackouts')
            ->assertOk()
            ->assertJsonPath('data.0.reason', 'Inventory');

        $this->actingAs($admin)->postJson('/api/admin/blackouts', [
            'type' => 'company_holiday',
            'start_date' => '2026-08-10',
            'end_date' => '2026-08-14',
            'reason' => 'Summer shutdown',
        ])->assertStatus(201)
            ->assertJsonPath('data.type', 'company_holiday');

        $this->actingAs($admin)->patchJson("/api/admin/blackouts/{$blackout->id}", [
            'type' => 'freeze',
            'start_date' => '2026-12-20',
            'end_date' => '2026-12-31',
            'reason' => 'Year-end freeze',
        ])->assertOk()
            ->assertJsonPath('data.reason', 'Year-end freeze');

        $this->actingAs($admin)->deleteJson("/api/admin/blackouts/{$blackout->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Blackout deleted.');

        $this->assertDatabaseMissing('blackout_periods', ['id' => $blackout->id]);
    }

    public function test_employee_cannot_manage_blackouts(): void
    {
        $employee = User::factory()->create();

        $this->actingAs($employee)->getJson('/api/admin/blackouts')->assertForbidden();
        $this->actingAs($employee)->postJson('/api/admin/blackouts', [
            'type' => 'freeze',
            'start_date' => '2026-12-21',
            'end_date' => '2026-12-31',
            'reason' => 'Inventory',
        ])->assertForbidden();
    }

    public function test_blackout_check_returns_matching_entries_with_freeze_first(): void
    {
        $user = User::factory()->create();

        BlackoutPeriod::create([
            'type' => 'company_holiday',
            'start_date' => '2026-12-24',
            'end_date' => '2026-12-31',
            'reason' => 'Christmas shutdown',
        ]);
        BlackoutPeriod::create([
            'type' => 'freeze',
            'start_date' => '2026-12-20',
            'end_date' => '2026-12-27',
            'reason' => 'Inventory',
        ]);

        $this->actingAs($user)->getJson('/api/blackouts/check?start_date=2026-12-24&end_date=2026-12-26')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.type', 'freeze')
            ->assertJsonPath('data.1.type', 'company_holiday');
    }

    public function test_blackout_check_validates_dates(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/blackouts/check?start_date=2026-12-26&end_date=2026-12-24')
            ->assertStatus(422);
    }

    public function test_vacation_request_is_blocked_by_freeze(): void
    {
        $user = User::factory()->create();

        BlackoutPeriod::create([
            'type' => 'freeze',
            'start_date' => '2026-12-21',
            'end_date' => '2026-12-31',
            'reason' => 'Inventory',
        ]);

        $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => '2026-12-22',
            'end_date' => '2026-12-23',
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Vacation request falls within a vacation freeze.');
    }

    public function test_company_holiday_blocks_overlapping_vacation_request(): void
    {
        $user = User::factory()->create();

        BlackoutPeriod::create([
            'type' => 'company_holiday',
            'start_date' => '2026-12-24',
            'end_date' => '2026-12-31',
            'reason' => 'Christmas shutdown',
        ]);

        $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => '2026-12-28',
            'end_date' => '2026-12-29',
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Vacation request overlaps with a company holiday.');
    }

    public function test_creating_company_holiday_creates_ledger_entry_and_vacation_system_booking(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $vacationCostCenterId = CostCenter::query()->where('code', 'VACATION')->value('id');

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-12-28',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'break_minutes' => 0,
        ]);

        TimeBooking::create([
            'user_id' => $employee->id,
            'date' => '2026-12-28',
            'cost_center_id' => CostCenter::factory()->create()->id,
            'percentage' => 100,
        ]);

        $response = $this->actingAs($admin)->postJson('/api/admin/blackouts', [
            'type' => 'company_holiday',
            'start_date' => '2026-12-28',
            'end_date' => '2026-12-28',
            'reason' => 'Christmas shutdown',
        ]);

        $blackoutId = $response->json('data.id');

        $this->assertDatabaseHas('vacation_ledger_entries', [
            'user_id' => $employee->id,
            'blackout_period_id' => $blackoutId,
            'type' => 'taken',
            'days' => '-1.0',
        ]);
        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-12-28 00:00:00',
            'cost_center_id' => $vacationCostCenterId,
            'percentage' => 100,
        ]);
        $this->assertDatabaseMissing('time_entries', [
            'user_id' => $employee->id,
            'date' => '2026-12-28 00:00:00',
        ]);
    }

    public function test_updating_company_holiday_rebuilds_ledger_entry_for_new_dates(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $blackout = BlackoutPeriod::create([
            'type' => 'company_holiday',
            'start_date' => '2026-12-28',
            'end_date' => '2026-12-28',
            'reason' => 'Shutdown',
        ]);

        app(\App\Services\SystemTimeBookingService::class)->syncCompanyHoliday($blackout);

        $this->actingAs($admin)->patchJson("/api/admin/blackouts/{$blackout->id}", [
            'type' => 'company_holiday',
            'start_date' => '2026-12-29',
            'end_date' => '2026-12-29',
            'reason' => 'Moved shutdown',
        ])->assertOk();

        $entry = VacationLedgerEntry::query()
            ->where('blackout_period_id', $blackout->id)
            ->where('user_id', $employee->id)
            ->first();

        $this->assertNotNull($entry);
        $this->assertSame('Moved shutdown', BlackoutPeriod::findOrFail($blackout->id)->reason);
        $this->assertSame(2026, $entry->year);
        $this->assertSame('-1.0', $entry->days);
    }

    public function test_deleting_company_holiday_removes_related_ledger_entries_and_system_bookings(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $blackout = BlackoutPeriod::create([
            'type' => 'company_holiday',
            'start_date' => '2026-12-28',
            'end_date' => '2026-12-28',
            'reason' => 'Shutdown',
        ]);

        app(\App\Services\SystemTimeBookingService::class)->syncCompanyHoliday($blackout);

        $this->actingAs($admin)->deleteJson("/api/admin/blackouts/{$blackout->id}")
            ->assertOk();

        $this->assertDatabaseMissing('vacation_ledger_entries', [
            'blackout_period_id' => $blackout->id,
        ]);
        $this->assertSame(0, TimeBooking::query()
            ->where('user_id', $employee->id)
            ->whereDate('date', '2026-12-28')
            ->count());
    }
}
