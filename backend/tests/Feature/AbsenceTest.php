<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\AbsenceStatus;
use App\Enums\AbsenceType;
use App\Models\Absence;
use App\Models\User;
use App\Models\Vacation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AbsenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_list_own_absences(): void
    {
        $employee = User::factory()->create();
        Absence::factory()->create(['user_id' => $employee->id]);
        Absence::factory()->create(['user_id' => $employee->id]);

        $response = $this->actingAs($employee)->getJson('/api/absences/mine');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_employee_can_report_illness(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->postJson('/api/absences', [
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-03',
            'type' => 'illness',
            'scope' => 'full_day',
            'comment' => 'Flu',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.type', 'illness')
            ->assertJsonPath('data.status', 'reported')
            ->assertJsonPath('message', 'Illness reported.');

        $this->assertDatabaseHas('absences', [
            'user_id' => $employee->id,
            'type' => 'illness',
            'status' => 'reported',
        ]);
    }

    public function test_employee_can_request_special_leave(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->postJson('/api/absences', [
            'start_date' => '2026-04-10',
            'end_date' => '2026-04-12',
            'type' => 'special_leave',
            'scope' => 'full_day',
            'comment' => 'Family event',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.type', 'special_leave')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('message', 'Special leave requested.');
    }

    public function test_employee_can_cancel_pending_absence(): void
    {
        $employee = User::factory()->create();
        $absence = Absence::factory()->create([
            'user_id' => $employee->id,
            'status' => AbsenceStatus::Reported,
        ]);

        $response = $this->actingAs($employee)->deleteJson("/api/absences/{$absence->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'Absence cancelled.');

        $this->assertSoftDeleted('absences', ['id' => $absence->id]);
    }

    public function test_employee_cannot_cancel_acknowledged_absence(): void
    {
        $employee = User::factory()->create();
        $absence = Absence::factory()->acknowledged()->create([
            'user_id' => $employee->id,
        ]);

        $response = $this->actingAs($employee)->deleteJson("/api/absences/{$absence->id}");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Only pending or reported absences can be cancelled.');
    }

    public function test_admin_can_list_all_absences(): void
    {
        $admin = User::factory()->admin()->create();
        $employee1 = User::factory()->create();
        $employee2 = User::factory()->create();
        Absence::factory()->create(['user_id' => $employee1->id]);
        Absence::factory()->create(['user_id' => $employee2->id]);

        $response = $this->actingAs($admin)->getJson('/api/admin/absences');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_admin_can_acknowledge_illness(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $absence = Absence::factory()->create([
            'user_id' => $employee->id,
            'type' => AbsenceType::Illness,
            'status' => AbsenceStatus::Reported,
        ]);

        $response = $this->actingAs($admin)->patchJson("/api/admin/absences/{$absence->id}", [
            'status' => 'acknowledged',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'acknowledged');

        $this->assertDatabaseHas('absences', [
            'id' => $absence->id,
            'status' => 'acknowledged',
            'reviewed_by' => $admin->id,
        ]);
    }

    public function test_admin_can_approve_special_leave(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $absence = Absence::factory()->specialLeave()->create([
            'user_id' => $employee->id,
        ]);

        $response = $this->actingAs($admin)->patchJson("/api/admin/absences/{$absence->id}", [
            'status' => 'approved',
            'admin_comment' => 'Approved for family reasons.',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('absences', [
            'id' => $absence->id,
            'status' => 'approved',
            'admin_comment' => 'Approved for family reasons.',
        ]);
    }

    public function test_admin_can_reject_special_leave(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();
        $absence = Absence::factory()->specialLeave()->create([
            'user_id' => $employee->id,
        ]);

        $response = $this->actingAs($admin)->patchJson("/api/admin/absences/{$absence->id}", [
            'status' => 'rejected',
            'admin_comment' => 'Insufficient documentation.',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $this->assertDatabaseHas('absences', [
            'id' => $absence->id,
            'status' => 'rejected',
        ]);
    }

    public function test_admin_can_create_absence_directly(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/absences', [
            'user_id' => $employee->id,
            'start_date' => '2026-04-20',
            'end_date' => '2026-04-22',
            'type' => 'illness',
            'scope' => 'full_day',
            'comment' => 'Admin created illness entry',
            'admin_comment' => 'Retroactive entry',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'admin_created');

        $this->assertDatabaseHas('absences', [
            'user_id' => $employee->id,
            'status' => 'admin_created',
            'reviewed_by' => $admin->id,
        ]);
    }

    public function test_invalid_status_transition_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();

        // Try to approve a "reported" illness (should only be acknowledgeable)
        $absence = Absence::factory()->create([
            'user_id' => $employee->id,
            'type' => AbsenceType::Illness,
            'status' => AbsenceStatus::Reported,
        ]);

        $response = $this->actingAs($admin)->patchJson("/api/admin/absences/{$absence->id}", [
            'status' => 'approved',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Invalid status transition.');
    }

    public function test_absence_validates_required_fields(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->postJson('/api/absences', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['start_date', 'end_date', 'type', 'scope']);
    }

    public function test_absence_response_has_correct_structure(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->postJson('/api/absences', [
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-02',
            'type' => 'illness',
            'scope' => 'full_day',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id', 'user_id', 'start_date', 'end_date',
                    'type', 'scope', 'status', 'comment',
                    'admin_comment', 'reviewed_by', 'reviewed_at', 'created_at',
                ],
                'message',
            ]);
    }

    public function test_employee_cannot_cancel_other_users_absence(): void
    {
        $employee1 = User::factory()->create();
        $employee2 = User::factory()->create();
        $absence = Absence::factory()->create([
            'user_id' => $employee1->id,
            'status' => AbsenceStatus::Reported,
        ]);

        $response = $this->actingAs($employee2)->deleteJson("/api/absences/{$absence->id}");

        $response->assertStatus(403);
    }

    public function test_cannot_create_overlapping_absence(): void
    {
        $employee = User::factory()->create();
        Absence::factory()->for($employee, 'user')->create([
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-10',
            'status' => 'reported',
        ]);

        $response = $this->actingAs($employee)->postJson('/api/absences', [
            'start_date' => '2026-04-08',
            'end_date' => '2026-04-12',
            'type' => 'illness',
            'scope' => 'full_day',
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['start_date']);
    }

    public function test_cannot_create_absence_overlapping_approved_vacation(): void
    {
        $employee = User::factory()->create();
        Vacation::factory()->approved()->create([
            'user_id' => $employee->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-10',
        ]);

        $response = $this->actingAs($employee)->postJson('/api/absences', [
            'start_date' => '2026-04-08',
            'end_date' => '2026-04-12',
            'type' => 'illness',
            'scope' => 'full_day',
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['start_date']);
    }

    public function test_half_day_absence_must_be_single_day(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->postJson('/api/absences', [
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-08',
            'type' => 'illness',
            'scope' => 'morning',
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['scope']);
    }

    public function test_can_create_half_day_absence_for_single_day(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->postJson('/api/absences', [
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-06',
            'type' => 'illness',
            'scope' => 'morning',
        ]);
        $response->assertStatus(201);
    }

    public function test_admin_cannot_create_overlapping_absence(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create();

        Absence::factory()->for($employee, 'user')->create([
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-10',
            'status' => 'admin_created',
        ]);

        $response = $this->actingAs($admin)->postJson('/api/admin/absences', [
            'user_id' => $employee->id,
            'start_date' => '2026-04-08',
            'end_date' => '2026-04-12',
            'type' => 'illness',
            'scope' => 'full_day',
        ]);
        $response->assertStatus(422);
    }

    public function test_rejected_absence_does_not_block_new_one(): void
    {
        $employee = User::factory()->create();
        Absence::factory()->for($employee, 'user')->create([
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-10',
            'status' => 'rejected',
        ]);

        $response = $this->actingAs($employee)->postJson('/api/absences', [
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-10',
            'type' => 'special_leave',
            'scope' => 'full_day',
        ]);
        $response->assertStatus(201);
    }
}
