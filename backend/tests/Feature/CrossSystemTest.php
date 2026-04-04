<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\VacationStatus;
use App\Models\Holiday;
use App\Models\Absence;
use App\Models\CostCenter;
use App\Models\TimeBooking;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\Vacation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrossSystemTest extends TestCase
{
    use RefreshDatabase;

    // --- EC-01: Vacation approval cleans up time data ---

    public function test_approving_vacation_removes_time_entries_for_vacation_days(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();

        // Employee has time entries for Mon-Fri
        foreach (['2026-04-06', '2026-04-07', '2026-04-08', '2026-04-09', '2026-04-10'] as $date) {
            TimeEntry::create([
                'user_id' => $employee->id,
                'date' => $date,
                'start_time' => '08:00',
                'end_time' => '17:00',
                'break_minutes' => 30,
            ]);
        }

        // Vacation request covers Wed-Fri
        $vacation = Vacation::factory()->create([
            'user_id' => $employee->id,
            'start_date' => '2026-04-08',
            'end_date' => '2026-04-10',
        ]);

        $this->actingAs($admin)->patchJson("/api/admin/vacations/{$vacation->id}", [
            'status' => 'approved',
        ]);

        // Mon, Tue entries should remain
        $this->assertTrue(
            TimeEntry::where('user_id', $employee->id)->whereDate('date', '2026-04-06')->exists()
        );
        $this->assertTrue(
            TimeEntry::where('user_id', $employee->id)->whereDate('date', '2026-04-07')->exists()
        );

        // Wed, Thu, Fri entries should be deleted
        $remaining = TimeEntry::where('user_id', $employee->id)
            ->whereDate('date', '>=', '2026-04-08')
            ->whereDate('date', '<=', '2026-04-10')
            ->count();
        $this->assertEquals(0, $remaining);
    }

    public function test_approving_vacation_removes_time_bookings_for_vacation_days(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $cc = CostCenter::factory()->create();

        TimeBooking::create([
            'user_id' => $employee->id,
            'date' => '2026-04-08',
            'cost_center_id' => $cc->id,
            'percentage' => 100,
        ]);

        $vacation = Vacation::factory()->create([
            'user_id' => $employee->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-10',
        ]);

        $this->actingAs($admin)->patchJson("/api/admin/vacations/{$vacation->id}", [
            'status' => 'approved',
        ]);

        $this->assertDatabaseMissing('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-08',
        ]);
    }

    public function test_approving_vacation_creates_vacation_system_bookings_for_workdays(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $vacationCc = CostCenter::where('code', 'VACATION')->firstOrFail();

        $vacation = Vacation::factory()->create([
            'user_id' => $employee->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-08',
        ]);

        $this->actingAs($admin)->patchJson("/api/admin/vacations/{$vacation->id}", [
            'status' => 'approved',
        ])->assertOk();

        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $vacationCc->id,
            'percentage' => 100,
        ]);
        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-07 00:00:00',
            'cost_center_id' => $vacationCc->id,
            'percentage' => 100,
        ]);
        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-08 00:00:00',
            'cost_center_id' => $vacationCc->id,
            'percentage' => 100,
        ]);
    }

    public function test_rejecting_vacation_does_not_remove_time_entries(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-08',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        $vacation = Vacation::factory()->create([
            'user_id' => $employee->id,
            'start_date' => '2026-04-08',
            'end_date' => '2026-04-10',
        ]);

        $this->actingAs($admin)->patchJson("/api/admin/vacations/{$vacation->id}", [
            'status' => 'rejected',
            'comment' => 'Sorry',
        ]);

        $this->assertTrue(
            TimeEntry::where('user_id', $employee->id)->whereDate('date', '2026-04-08')->exists()
        );
    }

    // --- EC-12: Deleting time entry cascades to bookings ---

    public function test_deleting_time_entry_also_deletes_bookings(): void
    {
        $employee = User::factory()->create();
        $cc = CostCenter::factory()->create();

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
            'cost_center_id' => $cc->id,
            'percentage' => 100,
        ]);

        $response = $this->actingAs($employee)->deleteJson('/api/time-entries/2026-04-06');
        $response->assertOk();

        $this->assertDatabaseMissing('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06',
        ]);
    }

    // --- EC-14: Half-day absence combinations ---

    public function test_can_create_morning_and_afternoon_absence_on_same_day(): void
    {
        $employee = User::factory()->create();

        // Morning absence
        $this->actingAs($employee)->postJson('/api/absences', [
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => 'illness',
            'scope' => 'morning',
        ])->assertStatus(201);

        // Afternoon absence (different scope, should be allowed)
        $this->actingAs($employee)->postJson('/api/absences', [
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => 'illness',
            'scope' => 'afternoon',
        ])->assertStatus(201);
    }

    public function test_cannot_create_two_morning_absences_on_same_day(): void
    {
        $employee = User::factory()->create();

        $this->actingAs($employee)->postJson('/api/absences', [
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => 'illness',
            'scope' => 'morning',
        ])->assertStatus(201);

        $this->actingAs($employee)->postJson('/api/absences', [
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => 'special_leave',
            'scope' => 'morning',
        ])->assertStatus(422);
    }

    public function test_cannot_create_half_day_absence_when_full_day_exists(): void
    {
        $employee = User::factory()->create();

        Absence::factory()->for($employee, 'user')->create([
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => 'full_day',
            'status' => 'reported',
        ]);

        $this->actingAs($employee)->postJson('/api/absences', [
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => 'illness',
            'scope' => 'morning',
        ])->assertStatus(422);
    }

    // --- Vacation blocks absence creation ---

    public function test_cannot_create_absence_partially_overlapping_vacation(): void
    {
        $employee = User::factory()->create();

        Vacation::factory()->approved()->create([
            'user_id' => $employee->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-08',
        ]);

        $this->actingAs($employee)->postJson('/api/absences', [
            'start_date' => '2026-04-07',
            'end_date' => '2026-04-09',
            'type' => 'illness',
            'scope' => 'full_day',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['start_date']);
    }

    // --- Vacation blocks time booking ---

    public function test_cannot_book_time_for_day_within_approved_vacation_range(): void
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
            'date' => '2026-04-07',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        $response = $this->actingAs($employee)->putJson('/api/time-bookings/2026-04-07', [
            'bookings' => [
                ['cost_center_id' => $cc->id, 'percentage' => 100],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Cannot book time on a vacation day.');
    }

    // --- Absence blocks time entry ---

    public function test_cannot_create_time_entry_on_acknowledged_illness_day(): void
    {
        $employee = User::factory()->create();

        Absence::factory()->acknowledged()->for($employee, 'user')->create([
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => 'full_day',
        ]);

        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-04-06', [
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Cannot create time entry on a day with a full-day absence.');
    }

    public function test_cannot_create_time_entry_on_admin_created_absence_day(): void
    {
        $employee = User::factory()->create();

        Absence::factory()->adminCreated()->for($employee, 'user')->create([
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => 'full_day',
        ]);

        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-04-06', [
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        $response->assertStatus(422);
    }

    // --- Pending/reported absence does NOT block time entry (only effective ones do) ---

    public function test_reported_illness_does_not_block_time_entry(): void
    {
        $employee = User::factory()->create();

        Absence::factory()->for($employee, 'user')->create([
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => 'full_day',
            'status' => 'reported',
        ]);

        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-04-06', [
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        // reported (not yet acknowledged) should not block
        $response->assertOk();
    }

    // --- Multi-day absence with range correctly blocks individual days ---

    public function test_absence_range_blocks_middle_day_time_entry(): void
    {
        $employee = User::factory()->create();

        Absence::factory()->acknowledged()->for($employee, 'user')->create([
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-10',
            'scope' => 'full_day',
        ]);

        // Try to create entry for Wednesday (middle of range)
        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-04-08', [
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        $response->assertStatus(422);
    }

    // --- Admin can create absence overlapping with existing time data (by design) ---

    public function test_admin_absence_creation_does_not_fail_when_time_entries_exist(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        // Admin can still create absence (time data exists but admin overrides)
        $response = $this->actingAs($admin)->postJson('/api/admin/absences', [
            'user_id' => $employee->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => 'illness',
            'scope' => 'full_day',
        ]);

        $response->assertStatus(201);
    }

    public function test_acknowledging_illness_creates_illness_system_booking(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $illnessCc = CostCenter::where('code', 'ILLNESS')->firstOrFail();

        $absence = Absence::factory()->for($employee, 'user')->create([
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => 'illness',
            'scope' => 'full_day',
            'status' => 'reported',
        ]);

        $this->actingAs($admin)->patchJson("/api/admin/absences/{$absence->id}", [
            'status' => 'acknowledged',
        ])->assertOk();

        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $illnessCc->id,
            'percentage' => 100,
        ]);
    }

    public function test_approving_half_day_special_leave_creates_50_percent_system_booking(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $specialLeaveCc = CostCenter::where('code', 'SPECIAL_LEAVE')->firstOrFail();

        $absence = Absence::factory()->specialLeave()->for($employee, 'user')->create([
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => 'morning',
        ]);

        $this->actingAs($admin)->patchJson("/api/admin/absences/{$absence->id}", [
            'status' => 'approved',
        ])->assertOk();

        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $specialLeaveCc->id,
            'percentage' => 50,
        ]);
    }

    public function test_admin_created_full_day_illness_removes_time_entry_and_creates_system_booking(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $illnessCc = CostCenter::where('code', 'ILLNESS')->firstOrFail();

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 30,
        ]);

        $this->actingAs($admin)->postJson('/api/admin/absences', [
            'user_id' => $employee->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => 'illness',
            'scope' => 'full_day',
        ])->assertStatus(201);

        $this->assertDatabaseMissing('time_entries', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
        ]);
        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $illnessCc->id,
            'percentage' => 100,
        ]);
    }

    public function test_deleting_admin_created_absence_removes_system_booking(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $specialLeaveCc = CostCenter::where('code', 'SPECIAL_LEAVE')->firstOrFail();

        $response = $this->actingAs($admin)->postJson('/api/admin/absences', [
            'user_id' => $employee->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => 'special_leave',
            'scope' => 'full_day',
        ]);

        $response->assertStatus(201);
        $absenceId = $response->json('data.id');

        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $specialLeaveCc->id,
            'percentage' => 100,
        ]);

        $this->actingAs($admin)->deleteJson("/api/admin/absences/{$absenceId}")
            ->assertOk();

        $this->assertDatabaseMissing('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $specialLeaveCc->id,
        ]);
    }

    public function test_deleting_absence_restores_holiday_booking_when_holiday_still_exists(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $illnessCc = CostCenter::where('code', 'ILLNESS')->firstOrFail();
        $holidayCc = CostCenter::where('code', 'HOLIDAY')->firstOrFail();

        $this->actingAs($admin)->postJson('/api/admin/holidays', [
            'name' => 'Restore Holiday',
            'date' => '2026-04-06',
            'type' => 'fixed',
        ])->assertStatus(201);

        $response = $this->actingAs($admin)->postJson('/api/admin/absences', [
            'user_id' => $employee->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => 'illness',
            'scope' => 'full_day',
        ]);

        $response->assertStatus(201);
        $absenceId = $response->json('data.id');

        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $illnessCc->id,
            'percentage' => 100,
        ]);

        $this->actingAs($admin)->deleteJson("/api/admin/absences/{$absenceId}")
            ->assertOk();

        $this->assertDatabaseMissing('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $illnessCc->id,
        ]);
        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $holidayCc->id,
            'percentage' => 100,
        ]);
    }

    public function test_approving_vacation_on_holiday_keeps_holiday_booking_instead_of_vacation_booking(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $vacationCc = CostCenter::where('code', 'VACATION')->firstOrFail();
        $holidayCc = CostCenter::where('code', 'HOLIDAY')->firstOrFail();

        $this->actingAs($admin)->postJson('/api/admin/holidays', [
            'name' => 'Vacation Collision Holiday',
            'date' => '2026-04-06',
            'type' => 'fixed',
        ])->assertStatus(201);

        $vacation = Vacation::factory()->create([
            'user_id' => $employee->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
        ]);

        $this->actingAs($admin)->patchJson("/api/admin/vacations/{$vacation->id}", [
            'status' => 'approved',
        ])->assertOk();

        $this->assertDatabaseMissing('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $vacationCc->id,
        ]);
        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $holidayCc->id,
            'percentage' => 100,
        ]);
    }

    public function test_deleting_holiday_restores_vacation_booking_when_approved_vacation_still_exists(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $vacationCc = CostCenter::where('code', 'VACATION')->firstOrFail();
        $holidayCc = CostCenter::where('code', 'HOLIDAY')->firstOrFail();

        $holidayResponse = $this->actingAs($admin)->postJson('/api/admin/holidays', [
            'name' => 'Temporary Holiday',
            'date' => '2026-04-06',
            'type' => 'fixed',
        ]);
        $holidayResponse->assertStatus(201);

        $vacation = Vacation::factory()->create([
            'user_id' => $employee->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
        ]);

        $this->actingAs($admin)->patchJson("/api/admin/vacations/{$vacation->id}", [
            'status' => 'approved',
        ])->assertOk();

        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $holidayCc->id,
            'percentage' => 100,
        ]);

        $holidayId = $holidayResponse->json('data.id');
        $this->actingAs($admin)->deleteJson("/api/admin/holidays/{$holidayId}")
            ->assertOk();

        $this->assertDatabaseMissing('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $holidayCc->id,
        ]);
        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $vacationCc->id,
            'percentage' => 100,
        ]);
    }

    public function test_holidays_exempt_user_gets_vacation_booking_even_when_vacation_day_is_a_holiday(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create(['holidays_exempt' => true]);
        $vacationCc = CostCenter::where('code', 'VACATION')->firstOrFail();
        $holidayCc = CostCenter::where('code', 'HOLIDAY')->firstOrFail();

        $this->actingAs($admin)->postJson('/api/admin/holidays', [
            'name' => 'Exempt User Holiday',
            'date' => '2026-04-06',
            'type' => 'fixed',
        ])->assertStatus(201);

        $vacation = Vacation::factory()->create([
            'user_id' => $employee->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
        ]);

        $this->actingAs($admin)->patchJson("/api/admin/vacations/{$vacation->id}", [
            'status' => 'approved',
        ])->assertOk();

        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $vacationCc->id,
            'percentage' => 100,
        ]);
        $this->assertDatabaseMissing('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $holidayCc->id,
        ]);
    }

    // --- Pending vacation does not block absence ---

    public function test_pending_vacation_does_not_block_absence_creation(): void
    {
        $employee = User::factory()->create();

        Vacation::factory()->create([
            'user_id' => $employee->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-10',
            'status' => VacationStatus::Pending,
        ]);

        $response = $this->actingAs($employee)->postJson('/api/absences', [
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-10',
            'type' => 'illness',
            'scope' => 'full_day',
        ]);

        // Pending vacation should NOT block illness report
        $response->assertStatus(201);
    }

    public function test_creating_holiday_creates_holiday_system_booking_for_non_exempt_users(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $holidayCc = CostCenter::where('code', 'HOLIDAY')->firstOrFail();

        $this->actingAs($admin)->postJson('/api/admin/holidays', [
            'name' => 'Easter Monday',
            'date' => '2026-04-06',
            'type' => 'variable',
        ])->assertStatus(201);

        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $holidayCc->id,
            'percentage' => 100,
        ]);
    }

    public function test_creating_holiday_does_not_create_booking_for_holidays_exempt_user(): void
    {
        $admin = User::factory()->admin()->create();
        $exemptEmployee = User::factory()->create(['holidays_exempt' => true]);
        $holidayCc = CostCenter::where('code', 'HOLIDAY')->firstOrFail();

        $this->actingAs($admin)->postJson('/api/admin/holidays', [
            'name' => 'Easter Monday',
            'date' => '2026-04-06',
            'type' => 'variable',
        ])->assertStatus(201);

        $this->assertDatabaseMissing('time_bookings', [
            'user_id' => $exemptEmployee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $holidayCc->id,
        ]);
    }

    public function test_updating_holiday_date_moves_holiday_system_booking(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $holidayCc = CostCenter::where('code', 'HOLIDAY')->firstOrFail();

        $holiday = Holiday::create([
            'name' => 'Moved Holiday',
            'date' => '2026-04-06',
            'type' => 'variable',
        ]);

        $this->actingAs($admin)->patchJson("/api/admin/holidays/{$holiday->id}", [
            'date' => '2026-04-07',
        ])->assertOk();

        $this->assertDatabaseMissing('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $holidayCc->id,
        ]);
        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-07 00:00:00',
            'cost_center_id' => $holidayCc->id,
            'percentage' => 100,
        ]);
    }

    public function test_deleting_holiday_removes_holiday_system_booking(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $holidayCc = CostCenter::where('code', 'HOLIDAY')->firstOrFail();

        $holiday = Holiday::create([
            'name' => 'Deleted Holiday',
            'date' => '2026-04-06',
            'type' => 'fixed',
        ]);

        // Seed the booking by running through the controller update flow
        $this->actingAs($admin)->patchJson("/api/admin/holidays/{$holiday->id}", [
            'name' => 'Deleted Holiday Updated',
        ])->assertOk();

        $this->assertDatabaseHas('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $holidayCc->id,
        ]);

        $this->actingAs($admin)->deleteJson("/api/admin/holidays/{$holiday->id}")
            ->assertOk();

        $this->assertDatabaseMissing('time_bookings', [
            'user_id' => $employee->id,
            'date' => '2026-04-06 00:00:00',
            'cost_center_id' => $holidayCc->id,
        ]);
    }
}
