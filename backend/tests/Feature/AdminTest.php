<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\VacationStatus;
use App\Models\User;
use App\Models\Vacation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_pending_vacations(): void
    {
        $admin = User::factory()->admin()->create();
        Vacation::factory()->count(2)->create(); // pending by default
        Vacation::factory()->approved()->create(); // should not appear

        $response = $this->actingAs($admin)->getJson('/api/admin/vacations/pending');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_admin_can_approve_vacation(): void
    {
        $admin = User::factory()->admin()->create();
        $vacation = Vacation::factory()->create();

        $response = $this->actingAs($admin)->patchJson("/api/admin/vacations/{$vacation->id}", [
            'status' => 'approved',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('vacations', [
            'id' => $vacation->id,
            'status' => 'approved',
            'reviewed_by' => $admin->id,
        ]);
    }

    public function test_admin_can_reject_vacation_with_comment(): void
    {
        $admin = User::factory()->admin()->create();
        $vacation = Vacation::factory()->create();

        $response = $this->actingAs($admin)->patchJson("/api/admin/vacations/{$vacation->id}", [
            'status' => 'rejected',
            'comment' => 'Team capacity issue.',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.comment', 'Team capacity issue.');
    }

    public function test_admin_cannot_review_already_reviewed_vacation(): void
    {
        $admin = User::factory()->admin()->create();
        $vacation = Vacation::factory()->approved()->create();

        $response = $this->actingAs($admin)->patchJson("/api/admin/vacations/{$vacation->id}", [
            'status' => 'rejected',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'This vacation request has already been reviewed.');
    }

    public function test_admin_can_view_all_users(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(3)->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/users');

        $response->assertOk();
        $this->assertCount(4, $response->json('data')); // 3 + admin
    }

    public function test_admin_can_update_user_role(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->patchJson("/api/admin/users/{$user->id}", [
            'role' => 'admin',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.role', 'admin');
    }

    public function test_admin_can_update_user_vacation_days(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create(['vacation_days_per_year' => 30]);

        $response = $this->actingAs($admin)->patchJson("/api/admin/users/{$user->id}", [
            'vacation_days_per_year' => 25,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.vacation_days_per_year', 25);
    }

    public function test_employee_cannot_access_admin_routes(): void
    {
        $employee = User::factory()->create();

        $this->actingAs($employee)->getJson('/api/admin/vacations/pending')->assertStatus(403);
        $this->actingAs($employee)->getJson('/api/admin/users')->assertStatus(403);
    }

    public function test_invalid_role_is_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->patchJson("/api/admin/users/{$user->id}", [
            'role' => 'manager',
        ]);

        $response->assertStatus(422);
    }

    public function test_invalid_vacation_days_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->patchJson("/api/admin/users/{$user->id}", [
            'vacation_days_per_year' => -5,
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_can_set_holidays_exempt(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->patchJson("/api/admin/users/{$user->id}", [
            'holidays_exempt' => true,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.holidays_exempt', true);
    }

    public function test_admin_can_set_weekend_worker(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->patchJson("/api/admin/users/{$user->id}", [
            'weekend_worker' => true,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.weekend_worker', true);
    }

    public function test_admin_can_update_multiple_user_fields(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create(['vacation_days_per_year' => 30]);

        $response = $this->actingAs($admin)->patchJson("/api/admin/users/{$user->id}", [
            'role' => 'admin',
            'vacation_days_per_year' => 28,
            'holidays_exempt' => true,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.role', 'admin')
            ->assertJsonPath('data.vacation_days_per_year', 28)
            ->assertJsonPath('data.holidays_exempt', true);
    }

    public function test_vacation_days_over_365_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->patchJson("/api/admin/users/{$user->id}", [
            'vacation_days_per_year' => 366,
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_approve_creates_reviewed_timestamp(): void
    {
        $admin = User::factory()->admin()->create();
        $vacation = Vacation::factory()->create();

        $this->actingAs($admin)->patchJson("/api/admin/vacations/{$vacation->id}", [
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('vacations', [
            'id' => $vacation->id,
            'reviewed_by' => $admin->id,
        ]);

        $vacation->refresh();
        $this->assertNotNull($vacation->reviewed_at);
    }

    public function test_admin_reject_with_reason(): void
    {
        $admin = User::factory()->admin()->create();
        $vacation = Vacation::factory()->create();

        $response = $this->actingAs($admin)->patchJson("/api/admin/vacations/{$vacation->id}", [
            'status' => 'rejected',
            'comment' => 'Zu viele Kollegen gleichzeitig im Urlaub.',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('vacations', [
            'id' => $vacation->id,
            'status' => 'rejected',
            'comment' => 'Zu viele Kollegen gleichzeitig im Urlaub.',
        ]);
    }

    public function test_invalid_status_value_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $vacation = Vacation::factory()->create();

        $response = $this->actingAs($admin)->patchJson("/api/admin/vacations/{$vacation->id}", [
            'status' => 'pending',
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_users_response_has_correct_structure(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/users');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'email', 'display_name', 'role', 'vacation_days_per_year'],
                ],
            ]);
    }

    public function test_employee_cannot_update_users(): void
    {
        $employee = User::factory()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($employee)->patchJson("/api/admin/users/{$user->id}", [
            'role' => 'admin',
        ]);

        $response->assertStatus(403);
    }

    public function test_update_nonexistent_user_returns_404(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->patchJson('/api/admin/users/99999', [
            'role' => 'admin',
        ]);

        $response->assertStatus(404);
    }

    public function test_pending_vacations_empty_when_none(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/vacations/pending');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_pending_vacations_excludes_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        Vacation::factory()->create(); // pending
        Vacation::factory()->rejected()->create(); // rejected

        $response = $this->actingAs($admin)->getJson('/api/admin/vacations/pending');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }
}
