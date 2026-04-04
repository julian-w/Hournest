<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\AbsenceStatus;
use App\Enums\AbsenceType;
use App\Models\Absence;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AbsenceAdminManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_filter_absences_by_status(): void
    {
        $admin = User::factory()->admin()->create();
        Absence::factory()->create(['status' => AbsenceStatus::Reported]);
        Absence::factory()->create(['status' => AbsenceStatus::Approved]);

        $response = $this->actingAs($admin)->getJson('/api/admin/absences?status=reported');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'reported');
    }

    public function test_admin_can_filter_absences_by_type_and_user(): void
    {
        $admin = User::factory()->admin()->create();
        $targetUser = User::factory()->create();
        $otherUser = User::factory()->create();

        Absence::factory()->create([
            'user_id' => $targetUser->id,
            'type' => AbsenceType::SpecialLeave,
        ]);
        Absence::factory()->create([
            'user_id' => $targetUser->id,
            'type' => AbsenceType::Illness,
        ]);
        Absence::factory()->create([
            'user_id' => $otherUser->id,
            'type' => AbsenceType::SpecialLeave,
        ]);

        $response = $this->actingAs($admin)->getJson("/api/admin/absences?type=special_leave&user_id={$targetUser->id}");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.user_id', $targetUser->id)
            ->assertJsonPath('data.0.type', 'special_leave');
    }

    public function test_admin_can_filter_absences_by_status_type_and_user_together(): void
    {
        $admin = User::factory()->admin()->create();
        $targetUser = User::factory()->create();
        $otherUser = User::factory()->create();

        Absence::factory()->create([
            'user_id' => $targetUser->id,
            'type' => AbsenceType::Illness,
            'status' => AbsenceStatus::Reported,
        ]);
        Absence::factory()->create([
            'user_id' => $targetUser->id,
            'type' => AbsenceType::Illness,
            'status' => AbsenceStatus::Approved,
        ]);
        Absence::factory()->create([
            'user_id' => $otherUser->id,
            'type' => AbsenceType::Illness,
            'status' => AbsenceStatus::Reported,
        ]);
        Absence::factory()->create([
            'user_id' => $targetUser->id,
            'type' => AbsenceType::SpecialLeave,
            'status' => AbsenceStatus::Reported,
        ]);

        $response = $this->actingAs($admin)->getJson(
            "/api/admin/absences?status=reported&type=illness&user_id={$targetUser->id}"
        );

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.user_id', $targetUser->id)
            ->assertJsonPath('data.0.type', 'illness')
            ->assertJsonPath('data.0.status', 'reported');
    }

    public function test_admin_can_delete_absence(): void
    {
        $admin = User::factory()->admin()->create();
        $absence = Absence::factory()->create();

        $response = $this->actingAs($admin)->deleteJson("/api/admin/absences/{$absence->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'Absence removed.');

        $this->assertSoftDeleted('absences', ['id' => $absence->id]);
    }

    public function test_employee_cannot_access_admin_absence_filters_or_delete(): void
    {
        $employee = User::factory()->create();
        $absence = Absence::factory()->create();

        $this->actingAs($employee)->getJson('/api/admin/absences?status=reported')
            ->assertStatus(403);

        $this->actingAs($employee)->deleteJson("/api/admin/absences/{$absence->id}")
            ->assertStatus(403);
    }
}
