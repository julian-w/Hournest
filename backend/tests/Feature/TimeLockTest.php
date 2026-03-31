<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\TimeLock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeLockTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_locks(): void
    {
        $admin = User::factory()->admin()->create();
        TimeLock::create([
            'year' => 2026,
            'month' => 1,
            'locked_by' => $admin->id,
            'locked_at' => now(),
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/time-locks');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_admin_can_lock_period(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/time-locks', [
            'year' => 2026,
            'month' => 2,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Period locked.');

        $this->assertDatabaseHas('time_locks', [
            'year' => 2026,
            'month' => 2,
            'locked_by' => $admin->id,
        ]);
    }

    public function test_admin_can_unlock_period(): void
    {
        $admin = User::factory()->admin()->create();
        TimeLock::create([
            'year' => 2026,
            'month' => 3,
            'locked_by' => $admin->id,
            'locked_at' => now(),
        ]);

        // Toggle lock (calling again unlocks)
        $response = $this->actingAs($admin)->postJson('/api/admin/time-locks', [
            'year' => 2026,
            'month' => 3,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Period unlocked.');

        $this->assertDatabaseMissing('time_locks', [
            'year' => 2026,
            'month' => 3,
        ]);
    }

    public function test_employee_cannot_lock_period(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->postJson('/api/admin/time-locks', [
            'year' => 2026,
            'month' => 4,
        ]);

        $response->assertStatus(403);
    }

    public function test_lock_validates_required_fields(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/time-locks', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['year', 'month']);
    }

    public function test_employee_cannot_view_locks(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->getJson('/api/admin/time-locks');

        $response->assertStatus(403);
    }
}
