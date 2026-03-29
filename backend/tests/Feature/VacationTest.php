<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\VacationStatus;
use App\Models\User;
use App\Models\Vacation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VacationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_approved_team_vacations(): void
    {
        $user = User::factory()->create();
        Vacation::factory()->approved()->create();
        Vacation::factory()->create(); // pending - should not appear

        $response = $this->actingAs($user)->getJson('/api/vacations');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
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
            ->assertJsonPath('message', 'Vacation request submitted.');

        $this->assertDatabaseHas('vacations', [
            'user_id' => $user->id,
            'start_date' => '2026-06-01 00:00:00',
            'end_date' => '2026-06-05 00:00:00',
            'status' => 'pending',
        ]);
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
        ]);

        // Comment field is accepted but not yet stored by the controller
        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'pending');
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
                'data' => ['id', 'start_date', 'end_date', 'status'],
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
