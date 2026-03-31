<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Absence;
use App\Models\Holiday;
use App\Models\TimeEntry;
use App\Models\TimeLock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeEntryTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_list_own_time_entries(): void
    {
        $employee = User::factory()->create();
        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-03-10',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 60,
        ]);
        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-03-11',
            'start_time' => '09:00',
            'end_time' => '18:00',
            'break_minutes' => 45,
        ]);

        $response = $this->actingAs($employee)->getJson('/api/time-entries?from=2026-03-01&to=2026-03-31');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_employee_can_create_time_entry(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-04-06', [
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 60,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.date', '2026-04-06')
            ->assertJsonPath('data.start_time', '08:00')
            ->assertJsonPath('data.end_time', '17:00')
            ->assertJsonPath('data.break_minutes', 60);

        $this->assertDatabaseHas('time_entries', [
            'user_id' => $employee->id,
            'start_time' => '08:00',
            'end_time' => '17:00',
        ]);
    }

    public function test_employee_can_update_time_entry(): void
    {
        $employee = User::factory()->create();

        // Create initial entry directly in the DB
        $entry = TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-03-20',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 60,
        ]);

        // Update (PUT same date replaces)
        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-03-20', [
            'start_time' => '09:00',
            'end_time' => '18:00',
            'break_minutes' => 30,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.start_time', '09:00')
            ->assertJsonPath('data.end_time', '18:00')
            ->assertJsonPath('data.break_minutes', 30);

        // Should still be only 1 entry for that user
        $this->assertEquals(1, TimeEntry::where('user_id', $employee->id)->count());
    }

    public function test_employee_can_delete_time_entry(): void
    {
        $employee = User::factory()->create();
        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 60,
        ]);

        $response = $this->actingAs($employee)->deleteJson('/api/time-entries/2026-04-06');

        $response->assertOk()
            ->assertJsonPath('message', 'Time entry deleted.');

        $this->assertDatabaseMissing('time_entries', [
            'user_id' => $employee->id,
            'start_time' => '08:00',
        ]);
    }

    public function test_time_entry_validates_required_fields(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-04-06', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['start_time', 'end_time', 'break_minutes']);
    }

    public function test_time_entry_validates_end_after_start(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-04-06', [
            'start_time' => '17:00',
            'end_time' => '08:00',
            'break_minutes' => 0,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['end_time']);
    }

    public function test_locked_day_cannot_be_edited(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();

        // Lock April 2026
        TimeLock::create([
            'year' => 2026,
            'month' => 4,
            'locked_by' => $admin->id,
            'locked_at' => now(),
        ]);

        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-04-06', [
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 60,
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'This date is locked and cannot be edited.');
    }

    public function test_time_entry_response_has_correct_structure(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-04-06', [
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 60,
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => ['id', 'user_id', 'date', 'start_time', 'end_time', 'break_minutes', 'net_working_minutes'],
                'message',
            ]);
    }

    public function test_locked_day_cannot_be_deleted(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();

        TimeEntry::create([
            'user_id' => $employee->id,
            'date' => '2026-04-06',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 60,
        ]);

        TimeLock::create([
            'year' => 2026,
            'month' => 4,
            'locked_by' => $admin->id,
            'locked_at' => now(),
        ]);

        $response = $this->actingAs($employee)->deleteJson('/api/time-entries/2026-04-06');

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_list_time_entries(): void
    {
        $response = $this->getJson('/api/time-entries?from=2026-03-01&to=2026-03-31');

        $response->assertStatus(401);
    }

    public function test_cannot_create_time_entry_on_weekend(): void
    {
        $employee = User::factory()->create();
        // 2026-03-15 is a Sunday
        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-03-15', [
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 60,
        ]);
        $response->assertStatus(422)
            ->assertJsonPath('message', 'This is not a working day for you.');
    }

    public function test_cannot_create_time_entry_on_holiday(): void
    {
        $employee = User::factory()->create();
        Holiday::create(['name' => 'Test Holiday', 'date' => '2026-04-06', 'type' => 'fixed']);

        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-04-06', [
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 60,
        ]);
        $response->assertStatus(422)
            ->assertJsonPath('message', 'This is not a working day for you.');
    }

    public function test_holidays_exempt_user_can_create_entry_on_holiday(): void
    {
        $employee = User::factory()->create(['holidays_exempt' => true]);
        Holiday::create(['name' => 'Test Holiday', 'date' => '2026-04-06', 'type' => 'fixed']);

        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-04-06', [
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 60,
        ]);
        $response->assertOk();
    }

    public function test_cannot_create_time_entry_on_full_day_absence(): void
    {
        $employee = User::factory()->create();
        Absence::factory()->for($employee, 'user')->create([
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => 'full_day',
            'status' => 'acknowledged',
        ]);

        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-04-06', [
            'start_time' => '08:00',
            'end_time' => '17:00',
            'break_minutes' => 60,
        ]);
        $response->assertStatus(422)
            ->assertJsonPath('message', 'Cannot create time entry on a day with a full-day absence.');
    }

    public function test_can_create_time_entry_on_half_day_absence(): void
    {
        $employee = User::factory()->create();
        Absence::factory()->for($employee, 'user')->create([
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'scope' => 'morning',
            'status' => 'acknowledged',
        ]);

        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-04-06', [
            'start_time' => '13:00',
            'end_time' => '17:00',
            'break_minutes' => 0,
        ]);
        $response->assertOk();
    }

    public function test_break_cannot_exceed_work_duration(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->putJson('/api/time-entries/2026-04-06', [
            'start_time' => '08:00',
            'end_time' => '09:00',
            'break_minutes' => 90,
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['break_minutes']);
    }
}
