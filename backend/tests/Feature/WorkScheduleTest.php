<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Models\WorkSchedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkScheduleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_user_work_schedules(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();
        WorkSchedule::create([
            'user_id' => $user->id,
            'start_date' => '2026-01-01',
            'end_date' => null,
            'work_days' => [1, 2, 3, 4, 5],
        ]);

        $response = $this->actingAs($admin)->getJson("/api/admin/users/{$user->id}/work-schedules");

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_admin_can_create_work_schedule(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/work-schedules", [
            'start_date' => '2026-04-01',
            'end_date' => null,
            'work_days' => [1, 2, 3],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.work_days', [1, 2, 3]);

        $this->assertDatabaseHas('work_schedules', [
            'user_id' => $user->id,
        ]);
    }

    public function test_admin_can_create_work_schedule_with_end_date(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/work-schedules", [
            'start_date' => '2026-01-01',
            'end_date' => '2026-06-30',
            'work_days' => [1, 2, 3, 4],
        ]);

        $response->assertStatus(201);
        $this->assertNotNull($response->json('data.end_date'));
    }

    public function test_admin_can_update_work_schedule(): void
    {
        $admin = User::factory()->admin()->create();
        $schedule = WorkSchedule::create([
            'user_id' => User::factory()->create()->id,
            'start_date' => '2026-01-01',
            'end_date' => null,
            'work_days' => [1, 2, 3, 4, 5],
        ]);

        $response = $this->actingAs($admin)->patchJson("/api/admin/work-schedules/{$schedule->id}", [
            'work_days' => [1, 3, 5],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.work_days', [1, 3, 5]);
    }

    public function test_admin_can_delete_work_schedule(): void
    {
        $admin = User::factory()->admin()->create();
        $schedule = WorkSchedule::create([
            'user_id' => User::factory()->create()->id,
            'start_date' => '2026-01-01',
            'end_date' => null,
            'work_days' => [1, 2, 3, 4, 5],
        ]);

        $response = $this->actingAs($admin)->deleteJson("/api/admin/work-schedules/{$schedule->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('work_schedules', ['id' => $schedule->id]);
    }

    public function test_employee_cannot_access_work_schedules(): void
    {
        $employee = User::factory()->create();
        $user = User::factory()->create();

        $this->actingAs($employee)->getJson("/api/admin/users/{$user->id}/work-schedules")
            ->assertStatus(403);
    }

    public function test_create_work_schedule_validates_required_fields(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/work-schedules", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['start_date', 'work_days']);
    }

    public function test_work_days_must_be_valid_day_numbers(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/work-schedules", [
            'start_date' => '2026-01-01',
            'work_days' => [0, 8],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['work_days.0', 'work_days.1']);
    }

    public function test_end_date_must_be_after_start_date(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/work-schedules", [
            'start_date' => '2026-06-01',
            'end_date' => '2026-01-01',
            'work_days' => [1, 2, 3],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['end_date']);
    }

    public function test_work_schedules_sorted_by_start_date_desc(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        WorkSchedule::create(['user_id' => $user->id, 'start_date' => '2026-01-01', 'end_date' => '2026-06-30', 'work_days' => [1, 2, 3, 4, 5]]);
        WorkSchedule::create(['user_id' => $user->id, 'start_date' => '2026-07-01', 'end_date' => null, 'work_days' => [1, 2, 3]]);

        $response = $this->actingAs($admin)->getJson("/api/admin/users/{$user->id}/work-schedules");

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(2, $data);
        // Most recent first
        $this->assertStringContainsString('2026-07-01', $data[0]['start_date']);
    }

    public function test_employee_cannot_create_work_schedule(): void
    {
        $employee = User::factory()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($employee)->postJson("/api/admin/users/{$user->id}/work-schedules", [
            'start_date' => '2026-01-01',
            'work_days' => [1, 2, 3],
        ]);

        $response->assertStatus(403);
    }

    public function test_employee_cannot_update_work_schedule(): void
    {
        $employee = User::factory()->create();
        $schedule = WorkSchedule::create([
            'user_id' => User::factory()->create()->id,
            'start_date' => '2026-01-01',
            'end_date' => null,
            'work_days' => [1, 2, 3, 4, 5],
        ]);

        $response = $this->actingAs($employee)->patchJson("/api/admin/work-schedules/{$schedule->id}", [
            'work_days' => [1, 2],
        ]);

        $response->assertStatus(403);
    }

    public function test_employee_cannot_delete_work_schedule(): void
    {
        $employee = User::factory()->create();
        $schedule = WorkSchedule::create([
            'user_id' => User::factory()->create()->id,
            'start_date' => '2026-01-01',
            'end_date' => null,
            'work_days' => [1, 2, 3, 4, 5],
        ]);

        $response = $this->actingAs($employee)->deleteJson("/api/admin/work-schedules/{$schedule->id}");

        $response->assertStatus(403);
    }

    public function test_work_days_must_not_be_empty(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/work-schedules", [
            'start_date' => '2026-01-01',
            'work_days' => [],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['work_days']);
    }

    public function test_admin_can_update_work_schedule_dates(): void
    {
        $admin = User::factory()->admin()->create();
        $schedule = WorkSchedule::create([
            'user_id' => User::factory()->create()->id,
            'start_date' => '2026-01-01',
            'end_date' => null,
            'work_days' => [1, 2, 3, 4, 5],
        ]);

        $response = $this->actingAs($admin)->patchJson("/api/admin/work-schedules/{$schedule->id}", [
            'start_date' => '2026-03-01',
            'end_date' => '2026-12-31',
        ]);

        $response->assertOk();
        $schedule->refresh();
        $this->assertEquals('2026-03-01', $schedule->start_date->format('Y-m-d'));
        $this->assertEquals('2026-12-31', $schedule->end_date->format('Y-m-d'));
    }

    public function test_work_schedule_response_has_correct_structure(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/work-schedules", [
            'start_date' => '2026-01-01',
            'work_days' => [1, 2, 3, 4, 5],
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'start_date', 'end_date', 'work_days'],
                'message',
            ]);
    }

    public function test_delete_nonexistent_work_schedule_returns_404(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->deleteJson('/api/admin/work-schedules/99999');

        $response->assertStatus(404);
    }

    public function test_empty_work_schedules_returns_empty_array(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->getJson("/api/admin/users/{$user->id}/work-schedules");

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_work_schedule_belongs_to_correct_user(): void
    {
        $admin = User::factory()->admin()->create();
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        WorkSchedule::create(['user_id' => $user1->id, 'start_date' => '2026-01-01', 'end_date' => null, 'work_days' => [1, 2, 3]]);
        WorkSchedule::create(['user_id' => $user2->id, 'start_date' => '2026-01-01', 'end_date' => null, 'work_days' => [4, 5]]);

        $response = $this->actingAs($admin)->getJson("/api/admin/users/{$user1->id}/work-schedules");

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals([1, 2, 3], $response->json('data.0.work_days'));
    }
}
