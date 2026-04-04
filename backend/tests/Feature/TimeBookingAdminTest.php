<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CostCenter;
use App\Models\TimeLock;
use App\Models\TimeBooking;
use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeBookingAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_time_entries_and_bookings_for_user(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $costCenter = CostCenter::factory()->create();

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        TimeBooking::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'cost_center_id' => $costCenter->id,
            'percentage' => 100,
        ]);

        $response = $this->actingAs($admin)->getJson("/api/admin/time-bookings?user_id={$employee->id}&from=2026-04-01&to=2026-04-30");

        $response->assertOk()
            ->assertJsonCount(1, 'data.time_entries')
            ->assertJsonCount(1, 'data.time_bookings')
            ->assertJsonPath('data.time_entries.0.date', '2026-04-06')
            ->assertJsonPath('data.time_bookings.0.cost_center_id', $costCenter->id);
    }

    public function test_admin_time_booking_index_validates_required_fields(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/time-bookings');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user_id', 'from', 'to']);
    }

    public function test_admin_can_store_time_entry_for_user(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();

        $response = $this->actingAs($admin)->putJson("/api/admin/time-bookings/{$employee->id}/2026-04-06/entry", [
            'start_time' => '08:15',
            'end_time' => '16:45',
            'break_minutes' => 45,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Time entry saved.')
            ->assertJsonPath('data.user_id', $employee->id)
            ->assertJsonPath('data.date', '2026-04-06');

        $this->assertDatabaseHas('time_entries', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'start_time' => '08:15',
            'end_time' => '16:45',
            'break_minutes' => 45,
        ]);
    }

    public function test_admin_store_time_entry_for_unknown_user_returns_404(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->putJson('/api/admin/time-bookings/999999/2026-04-06/entry', [
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        $response->assertStatus(404);
    }

    public function test_admin_can_store_bookings_for_user(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $first = CostCenter::factory()->create();
        $second = CostCenter::factory()->create();

        $response = $this->actingAs($admin)->putJson("/api/admin/time-bookings/{$employee->id}/2026-04-06/bookings", [
            'bookings' => [
                ['cost_center_id' => $first->id, 'percentage' => 55, 'comment' => 'Project work'],
                ['cost_center_id' => $second->id, 'percentage' => 45],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Time bookings saved.')
            ->assertJsonCount(2, 'data');

        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $first->id,
            'percentage' => 55,
            'comment' => 'Project work',
        ]);
        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $second->id,
            'percentage' => 45,
        ]);
    }

    public function test_admin_store_bookings_for_unknown_user_returns_404(): void
    {
        $admin = User::factory()->admin()->create();
        $costCenter = CostCenter::factory()->create();

        $response = $this->actingAs($admin)->putJson('/api/admin/time-bookings/999999/2026-04-06/bookings', [
            'bookings' => [
                ['cost_center_id' => $costCenter->id, 'percentage' => 100],
            ],
        ]);

        $response->assertStatus(404);
    }

    public function test_admin_can_view_and_set_direct_user_cost_centers(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $first = CostCenter::factory()->create();
        $second = CostCenter::factory()->create();

        $updateResponse = $this->actingAs($admin)->putJson("/api/admin/users/{$employee->id}/cost-centers", [
            'cost_center_ids' => [$first->id, $second->id],
        ]);

        $updateResponse->assertOk()
            ->assertJsonPath('message', 'User cost centers updated.')
            ->assertJsonCount(2, 'data');

        $this->assertDatabaseHas('user_cost_centers', [
            'user_id' => $employee->id,
            'cost_center_id' => $first->id,
        ]);
        $this->assertDatabaseHas('user_cost_centers', [
            'user_id' => $employee->id,
            'cost_center_id' => $second->id,
        ]);

        $listResponse = $this->actingAs($admin)->getJson("/api/admin/users/{$employee->id}/cost-centers");

        $listResponse->assertOk();
        $listedIds = array_column($listResponse->json('data'), 'id');
        sort($listedIds);
        $expectedIds = [$first->id, $second->id];
        sort($expectedIds);

        $this->assertSame($expectedIds, $listedIds);
    }

    public function test_employee_cannot_access_admin_time_booking_routes(): void
    {
        $employee = User::factory()->create();
        $target = User::factory()->create();
        $costCenter = CostCenter::factory()->create();

        $this->actingAs($employee)->getJson("/api/admin/time-bookings?user_id={$target->id}&from=2026-04-01&to=2026-04-30")
            ->assertStatus(403);

        $this->actingAs($employee)->putJson("/api/admin/time-bookings/{$target->id}/2026-04-06/entry", [
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ])->assertStatus(403);

        $this->actingAs($employee)->putJson("/api/admin/time-bookings/{$target->id}/2026-04-06/bookings", [
            'bookings' => [
                ['cost_center_id' => $costCenter->id, 'percentage' => 100],
            ],
        ])->assertStatus(403);

        $this->actingAs($employee)->getJson("/api/admin/users/{$target->id}/cost-centers")
            ->assertStatus(403);

        $this->actingAs($employee)->putJson("/api/admin/users/{$target->id}/cost-centers", [
            'cost_center_ids' => [$costCenter->id],
        ])->assertStatus(403);
    }

    public function test_admin_can_store_time_entry_even_when_period_is_locked(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();

        TimeLock::create([
            'year' => 2026,
            'month' => 4,
            'locked_by' => $admin->id,
            'locked_at' => now(),
        ]);

        $response = $this->actingAs($admin)->putJson("/api/admin/time-bookings/{$employee->id}/2026-04-06/entry", [
            'start_time' => '07:30',
            'end_time' => '16:00',
            'break_minutes' => 30,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.date', '2026-04-06');

        $this->assertDatabaseHas('time_entries', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'start_time' => '07:30',
            'end_time' => '16:00',
        ]);
    }

    public function test_admin_can_store_system_cost_center_bookings_even_when_period_is_locked(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $systemCostCenter = CostCenter::where('code', 'VACATION')->firstOrFail();

        TimeLock::create([
            'year' => 2026,
            'month' => 4,
            'locked_by' => $admin->id,
            'locked_at' => now(),
        ]);

        $response = $this->actingAs($admin)->putJson("/api/admin/time-bookings/{$employee->id}/2026-04-06/bookings", [
            'bookings' => [
                ['cost_center_id' => $systemCostCenter->id, 'percentage' => 100, 'comment' => 'Admin override'],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.0.cost_center_id', $systemCostCenter->id)
            ->assertJsonPath('data.0.percentage', 100);

        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $systemCostCenter->id,
            'percentage' => 100,
            'comment' => 'Admin override',
        ]);
    }
}
