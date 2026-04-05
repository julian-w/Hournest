<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\VacationStatus;
use App\Models\User;
use App\Models\UserGroup;
use App\Models\Vacation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use App\Notifications\VacationRequestSubmittedNotification;
use Tests\TestCase;

class VacationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_sees_only_own_approved_vacations_without_shared_group(): void
    {
        $user = User::factory()->create();
        Vacation::factory()->approved()->create(['user_id' => $user->id]);
        Vacation::factory()->approved()->create(); // another user's vacation
        Vacation::factory()->create(); // pending - should not appear

        $response = $this->actingAs($user)->getJson('/api/vacations');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame($user->id, $response->json('data.0.user_id'));
    }

    public function test_user_can_view_approved_vacations_of_members_from_shared_group(): void
    {
        $user = User::factory()->create();
        $groupMember = User::factory()->create();
        $outsideUser = User::factory()->create();
        $group = UserGroup::create(['name' => 'Engineering']);

        $user->userGroups()->attach($group->id);
        $groupMember->userGroups()->attach($group->id);

        Vacation::factory()->approved()->create(['user_id' => $user->id]);
        Vacation::factory()->approved()->create(['user_id' => $groupMember->id]);
        Vacation::factory()->approved()->create(['user_id' => $outsideUser->id]);

        $response = $this->actingAs($user)->getJson('/api/vacations');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
        $visibleUserIds = collect($response->json('data'))->pluck('user_id')->sort()->values()->all();
        $this->assertSame([$user->id, $groupMember->id], $visibleUserIds);
    }

    public function test_admin_can_view_all_approved_vacations(): void
    {
        $admin = User::factory()->admin()->create();
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        Vacation::factory()->approved()->create(['user_id' => $userA->id]);
        Vacation::factory()->approved()->create(['user_id' => $userB->id]);
        Vacation::factory()->create(['user_id' => $userB->id]); // pending - should not appear

        $response = $this->actingAs($admin)->getJson('/api/vacations');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_user_can_view_own_vacations(): void
    {
        $user = User::factory()->create();
        Vacation::factory()->count(2)->create(['user_id' => $user->id]);
        Vacation::factory()->create(); // another user's vacation

        $response = $this->actingAs($user)->getJson('/api/vacations/mine');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_user_can_request_vacation(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-05',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.scope', 'full_day')
            ->assertJsonPath('message', 'Vacation request submitted.');

        $this->assertDatabaseHas('vacations', [
            'user_id' => $user->id,
            'start_date' => '2026-06-01 00:00:00',
            'end_date' => '2026-06-05 00:00:00',
            'status' => 'pending',
        ]);
    }

    public function test_vacation_request_notifies_admins(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $admin = User::factory()->admin()->create();
        $superadmin = User::factory()->create(['role' => 'superadmin']);

        $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-05',
            'comment' => 'Family trip',
        ])->assertStatus(201);

        Notification::assertSentTo([$admin, $superadmin], VacationRequestSubmittedNotification::class);
        Notification::assertNotSentTo($user, VacationRequestSubmittedNotification::class);
    }

    public function test_user_cannot_request_vacation_in_the_past(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => '2020-01-01',
            'end_date' => '2020-01-05',
        ]);

        $response->assertStatus(422);
    }

    public function test_user_cannot_request_vacation_with_end_before_start(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => '2026-06-10',
            'end_date' => '2026-06-05',
        ]);

        $response->assertStatus(422);
    }

    public function test_user_cannot_request_overlapping_vacation(): void
    {
        $user = User::factory()->create();
        Vacation::factory()->approved()->create([
            'user_id' => $user->id,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-10',
        ]);

        $response = $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => '2026-06-05',
            'end_date' => '2026-06-15',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Vacation overlaps with an already approved vacation.');
    }

    public function test_user_can_cancel_pending_vacation(): void
    {
        $user = User::factory()->create();
        $vacation = Vacation::factory()->create([
            'user_id' => $user->id,
            'status' => VacationStatus::Pending,
        ]);

        $response = $this->actingAs($user)->deleteJson("/api/vacations/{$vacation->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'Vacation request cancelled.');
        $this->assertSoftDeleted('vacations', ['id' => $vacation->id]);
    }

    public function test_user_cannot_cancel_approved_vacation(): void
    {
        $user = User::factory()->create();
        $vacation = Vacation::factory()->approved()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->deleteJson("/api/vacations/{$vacation->id}");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Only pending requests can be cancelled.');
    }

    public function test_user_cannot_cancel_other_users_vacation(): void
    {
        $user = User::factory()->create();
        $otherVacation = Vacation::factory()->create();

        $response = $this->actingAs($user)->deleteJson("/api/vacations/{$otherVacation->id}");

        $response->assertStatus(403);
    }

    public function test_remaining_vacation_days_are_calculated(): void
    {
        $user = User::factory()->create(['vacation_days_per_year' => 30]);
        // Approved vacation: 5 workdays (Mon-Fri)
        Vacation::factory()->approved()->create([
            'user_id' => $user->id,
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-10',
        ]);

        $response = $this->actingAs($user)->getJson('/api/user');

        $response->assertOk()
            ->assertJsonPath('data.remaining_vacation_days', 25);
    }

    public function test_user_can_request_vacation_with_comment(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => '2026-07-01',
            'end_date' => '2026-07-10',
            'comment' => 'Family trip',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.comment', 'Family trip');
    }

    public function test_user_can_request_half_day_vacation(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-01',
            'scope' => 'morning',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.scope', 'morning')
            ->assertJsonPath('data.workdays', 0.5);

        $this->assertDatabaseHas('vacations', [
            'user_id' => $user->id,
            'start_date' => '2026-06-01 00:00:00',
            'end_date' => '2026-06-01 00:00:00',
            'scope' => 'morning',
        ]);
    }

    public function test_half_day_vacation_must_be_single_day(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-02',
            'scope' => 'afternoon',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['scope']);
    }

    public function test_half_day_vacation_reduces_remaining_days_by_half(): void
    {
        $user = User::factory()->create(['vacation_days_per_year' => 30]);

        Vacation::factory()->approved()->halfDay('morning')->create([
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->getJson('/api/user');

        $response->assertOk()
            ->assertJsonPath('data.remaining_vacation_days', 29.5);
    }

    public function test_vacation_request_validates_required_dates(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/vacations', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['start_date', 'end_date']);
    }

    public function test_vacation_request_validates_invalid_dates(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => 'not-a-date',
            'end_date' => 'also-not-a-date',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['start_date', 'end_date']);
    }

    public function test_user_can_request_single_day_vacation(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-01',
        ]);

        $response->assertStatus(201);
    }

    public function test_unauthenticated_user_cannot_request_vacation(): void
    {
        $response = $this->postJson('/api/vacations', [
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-05',
        ]);

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_view_vacations(): void
    {
        $response = $this->getJson('/api/vacations');

        $response->assertStatus(401);
    }

    public function test_user_can_have_multiple_pending_vacations(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-05',
        ])->assertStatus(201);

        $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => '2026-07-01',
            'end_date' => '2026-07-10',
        ])->assertStatus(201);

        $response = $this->actingAs($user)->getJson('/api/vacations/mine');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_vacation_response_has_correct_structure(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-05',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'start_date', 'end_date', 'scope', 'status'],
                'message',
            ]);
    }

    public function test_cancelled_vacation_not_in_mine_list(): void
    {
        $user = User::factory()->create();
        $vacation = Vacation::factory()->create([
            'user_id' => $user->id,
            'status' => VacationStatus::Pending,
        ]);

        $this->actingAs($user)->deleteJson("/api/vacations/{$vacation->id}")->assertOk();

        $response = $this->actingAs($user)->getJson('/api/vacations/mine');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_rejected_vacation_not_in_team_view(): void
    {
        $user = User::factory()->create();
        Vacation::factory()->rejected()->create();

        $response = $this->actingAs($user)->getJson('/api/vacations');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_pending_vacation_not_in_team_view(): void
    {
        $user = User::factory()->create();
        Vacation::factory()->create(); // pending

        $response = $this->actingAs($user)->getJson('/api/vacations');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }
}
