<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Absence;
use App\Models\CostCenter;
use App\Models\TimeBooking;
use App\Models\TimeEntry;
use App\Models\TimeLock;
use App\Models\User;
use App\Models\Vacation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeBookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_list_own_bookings(): void
    {
        $employee = User::factory()->create();
        $costCenter = CostCenter::factory()->create();
        $employee->costCenters()->attach($costCenter->id);

        TimeBooking::create([
            'user_id' => $employee->id,
            'date' => '2026-03-10',
            'cost_center_id' => $costCenter->id,
            'percentage' => 100,
        ]);

        $response = $this->actingAs($employee)->getJson('/api/time-bookings?from=2026-03-01&to=2026-03-31');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_employee_can_save_bookings_for_day(): void
    {
        $employee = User::factory()->create();
        $cc1 = CostCenter::factory()->create();
        $cc2 = CostCenter::factory()->create();
        $employee->costCenters()->attach([$cc1->id, $cc2->id]);

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        $response = $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-06', [
            'bookings' => [
                ['cost_center_id' => $cc1->id, 'percentage' => 60],
                ['cost_center_id' => $cc2->id, 'percentage' => 40],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Time bookings saved.');

        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'cost_center_id' => $cc1->id,
            'percentage' => 60,
        ]);
        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'cost_center_id' => $cc2->id,
            'percentage' => 40,
        ]);
    }

    public function test_bookings_must_sum_to_100_percent(): void
    {
        $employee = User::factory()->create();
        $costCenter = CostCenter::factory()->create();
        $employee->costCenters()->attach($costCenter->id);

        $response = $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-06', [
            'bookings' => [
                ['cost_center_id' => $costCenter->id, 'percentage' => 50],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['bookings']);
    }

    public function test_employee_cannot_book_system_cost_center(): void
    {
        $employee = User::factory()->create();
        $systemCc = CostCenter::where('code', 'VACATION')->first();

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        $response = $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-06', [
            'bookings' => [
                ['cost_center_id' => $systemCc->id, 'percentage' => 100],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'System cost centers cannot be booked manually.');
    }

    public function test_employee_cannot_book_unassigned_cost_center(): void
    {
        $employee = User::factory()->create();
        $unassigned = CostCenter::factory()->create();

        // Do NOT attach to employee

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        $response = $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-06', [
            'bookings' => [
                ['cost_center_id' => $unassigned->id, 'percentage' => 100],
            ],
        ]);

        $response->assertStatus(422);
    }

    public function test_locked_day_cannot_be_booked(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $costCenter = CostCenter::factory()->create();
        $employee->costCenters()->attach($costCenter->id);

        TimeLock::create([
            'year' => 2026,
            'month' => 4,
            'locked_by' => $admin->id,
            'locked_at' => now(),
        ]);

        $response = $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-06', [
            'bookings' => [
                ['cost_center_id' => $costCenter->id, 'percentage' => 100],
            ],
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'This date is locked and cannot be edited.');
    }

    public function test_booking_replaces_existing_for_day(): void
    {
        $employee = User::factory()->create();
        $cc1 = CostCenter::factory()->create();
        $cc2 = CostCenter::factory()->create();
        $employee->costCenters()->attach([$cc1->id, $cc2->id]);

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        // First booking
        $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-06', [
            'bookings' => [
                ['cost_center_id' => $cc1->id, 'percentage' => 100],
            ],
        ]);

        // Replace with new booking
        $response = $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-06', [
            'bookings' => [
                ['cost_center_id' => $cc2->id, 'percentage' => 100],
            ],
        ]);

        $response->assertOk();

        // Old booking should be gone
        $this->assertDatabaseMissing('time_bookings', [
            'user_id' => $employee->id,
            'cost_center_id' => $cc1->id,
        ]);

        // New booking should exist
        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'cost_center_id' => $cc2->id,
            'percentage' => 100,
        ]);
    }

    public function test_booking_response_has_correct_structure(): void
    {
        $employee = User::factory()->create();
        $costCenter = CostCenter::factory()->create();
        $employee->costCenters()->attach($costCenter->id);

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        $response = $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-06', [
            'bookings' => [
                ['cost_center_id' => $costCenter->id, 'percentage' => 100],
            ],
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'user_id', 'date', 'cost_center_id', 'cost_center_name', 'cost_center_code', 'percentage', 'comment'],
                ],
                'message',
            ]);
    }

    public function test_booking_validates_required_fields(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-06', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['bookings']);
    }

    public function test_unauthenticated_user_cannot_list_bookings(): void
    {
        $response = $this->getJson('/api/time-bookings?from=2026-03-01&to=2026-03-31');

        $response->assertStatus(401);
    }

    public function test_booking_with_comment(): void
    {
        $employee = User::factory()->create();
        $costCenter = CostCenter::factory()->create();
        $employee->costCenters()->attach($costCenter->id);

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        $response = $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-06', [
            'bookings' => [
                ['cost_center_id' => $costCenter->id, 'percentage' => 100, 'comment' => 'Sprint work'],
            ],
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'cost_center_id' => $costCenter->id,
            'comment' => 'Sprint work',
        ]);
    }

    public function test_cannot_book_on_full_day_absence(): void
    {
        $employee = User::factory()->create();
        $cc = CostCenter::factory()->create();
        $employee->costCenters()->attach($cc->id);

        Absence::factory()->for($employee, 'user')->create([
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => 'full_day',
            'status' => 'approved',
        ]);

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        $response = $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-06', [
            'bookings' => [
                ['cost_center_id' => $cc->id, 'percentage' => 100],
            ],
        ]);
        $response->assertStatus(422)
            ->assertJsonPath('message', 'Cannot book time on a day with a full-day absence.');
    }

    public function test_cannot_book_on_vacation_day(): void
    {
        $employee = User::factory()->create();
        $cc = CostCenter::factory()->create();
        $employee->costCenters()->attach($cc->id);

        Vacation::factory()->approved()->create([
            'user_id' => $employee->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-10',
        ]);

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        $response = $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-06', [
            'bookings' => [
                ['cost_center_id' => $cc->id, 'percentage' => 100],
            ],
        ]);
        $response->assertStatus(422)
            ->assertJsonPath('message', 'Cannot book time on a vacation day.');
    }

    public function test_cannot_book_without_time_entry(): void
    {
        $employee = User::factory()->create();
        $cc = CostCenter::factory()->create();
        $employee->costCenters()->attach($cc->id);

        // No time entry created!
        $response = $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-06', [
            'bookings' => [
                ['cost_center_id' => $cc->id, 'percentage' => 100],
            ],
        ]);
        $response->assertStatus(422)
            ->assertJsonPath('message', 'You must record working hours before booking time.');
    }

    public function test_percentage_must_be_multiple_of_5(): void
    {
        $employee = User::factory()->create();
        $cc1 = CostCenter::factory()->create();
        $cc2 = CostCenter::factory()->create();
        $employee->costCenters()->attach([$cc1->id, $cc2->id]);

        $response = $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-06', [
            'bookings' => [
                ['cost_center_id' => $cc1->id, 'percentage' => 67],
                ['cost_center_id' => $cc2->id, 'percentage' => 33],
            ],
        ]);
        $response->assertStatus(422);
    }

    public function test_duplicate_cost_centers_rejected(): void
    {
        $employee = User::factory()->create();
        $cc = CostCenter::factory()->create();
        $employee->costCenters()->attach($cc->id);

        $response = $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-06', [
            'bookings' => [
                ['cost_center_id' => $cc->id, 'percentage' => 50],
                ['cost_center_id' => $cc->id, 'percentage' => 50],
            ],
        ]);
        $response->assertStatus(422);
    }
}
