<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\VacationStatus;
use App\Models\User;
use App\Models\Vacation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Hash;
use App\Notifications\VacationRequestReviewedNotification;
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

    public function test_reviewing_vacation_notifies_employee(): void
    {
        Notification::fake();

        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $vacation = Vacation::factory()->create([
            'user_id' => $employee->id,
        ]);

        $this->actingAs($admin)->patchJson("/api/admin/vacations/{$vacation->id}", [
            'status' => 'approved',
            'comment' => 'Approved for your trip.',
        ])->assertOk();

        Notification::assertSentTo($employee, VacationRequestReviewedNotification::class);
        Notification::assertNotSentTo($admin, VacationRequestReviewedNotification::class);
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

    public function test_admin_can_create_user(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/users', [
            'display_name' => 'New User',
            'email' => 'newuser@example.com',
            'role' => 'employee',
            'password' => 'default123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.email', 'newuser@example.com')
            ->assertJsonPath('data.display_name', 'New User')
            ->assertJsonPath('data.role', 'employee')
            ->assertJsonPath('message', 'User created.');

        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
            'must_change_password' => true,
        ]);
    }

    public function test_admin_can_create_admin_user(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/users', [
            'display_name' => 'New Admin',
            'email' => 'admin2@example.com',
            'role' => 'admin',
            'password' => 'default123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.role', 'admin');
    }

    public function test_create_user_duplicate_email_returns_422(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->actingAs($admin)->postJson('/api/admin/users', [
            'display_name' => 'Duplicate',
            'email' => 'existing@example.com',
            'role' => 'employee',
            'password' => 'default123',
        ]);

        $response->assertStatus(422);
    }

    public function test_create_user_short_password_returns_422(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/users', [
            'display_name' => 'Test',
            'email' => 'test@example.com',
            'role' => 'employee',
            'password' => 'short',
        ]);

        $response->assertStatus(422);
    }

    public function test_employee_cannot_create_user(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->postJson('/api/admin/users', [
            'display_name' => 'Test',
            'email' => 'test@example.com',
            'role' => 'employee',
            'password' => 'default123',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_reset_user_password(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create(['password' => 'oldpassword']);

        $response = $this->actingAs($admin)->patchJson("/api/admin/users/{$user->id}/reset-password", [
            'password' => 'newdefault123',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Password reset.');

        $user->refresh();
        $this->assertTrue($user->must_change_password);
        $this->assertTrue(Hash::check('newdefault123', $user->password));
    }

    public function test_employee_cannot_reset_password(): void
    {
        $employee = User::factory()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($employee)->patchJson("/api/admin/users/{$user->id}/reset-password", [
            'password' => 'newdefault123',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_user(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->deleteJson("/api/admin/users/{$user->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'User deleted.');

        $this->assertSoftDeleted('users', ['id' => $user->id]);
    }

    public function test_admin_cannot_delete_superadmin(): void
    {
        $admin = User::factory()->admin()->create();
        $superadmin = User::factory()->create(['role' => 'superadmin']);

        $response = $this->actingAs($admin)->deleteJson("/api/admin/users/{$superadmin->id}");

        $response->assertStatus(403);
    }

    public function test_admin_cannot_delete_self(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->deleteJson("/api/admin/users/{$admin->id}");

        $response->assertStatus(403);
    }

    public function test_employee_cannot_delete_user(): void
    {
        $employee = User::factory()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($employee)->deleteJson("/api/admin/users/{$user->id}");

        $response->assertStatus(403);
    }

    public function test_admin_cannot_modify_superadmin(): void
    {
        $admin = User::factory()->admin()->create();
        $superadmin = User::factory()->create(['role' => 'superadmin']);

        $response = $this->actingAs($admin)->patchJson("/api/admin/users/{$superadmin->id}", [
            'role' => 'employee',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_create_user_with_vacation_days(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/users', [
            'display_name' => 'Custom Days',
            'email' => 'custom@example.com',
            'role' => 'employee',
            'password' => 'default123',
            'vacation_days_per_year' => 25,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.vacation_days_per_year', 25);
    }
}
