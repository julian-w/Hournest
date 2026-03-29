<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Models\VacationLedgerEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VacationLedgerTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_view_own_ledger(): void
    {
        $user = User::factory()->create();
        VacationLedgerEntry::create([
            'user_id' => $user->id,
            'year' => 2026,
            'type' => 'entitlement',
            'days' => 30,
            'comment' => 'Jahresanspruch',
        ]);

        $response = $this->actingAs($user)->getJson('/api/vacation-ledger?year=2026');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('entitlement', $response->json('data.0.type'));
    }

    public function test_employee_cannot_see_other_users_ledger(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        VacationLedgerEntry::create([
            'user_id' => $user2->id,
            'year' => 2026,
            'type' => 'entitlement',
            'days' => 30,
            'comment' => 'Jahresanspruch',
        ]);

        $response = $this->actingAs($user1)->getJson('/api/vacation-ledger?year=2026');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_admin_can_view_user_ledger(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();
        VacationLedgerEntry::create([
            'user_id' => $user->id,
            'year' => 2026,
            'type' => 'entitlement',
            'days' => 30,
            'comment' => 'Jahresanspruch',
        ]);
        VacationLedgerEntry::create([
            'user_id' => $user->id,
            'year' => 2026,
            'type' => 'bonus',
            'days' => 2,
            'comment' => 'Sonderurlaub',
        ]);

        $response = $this->actingAs($admin)->getJson("/api/admin/users/{$user->id}/vacation-ledger?year=2026");

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_admin_can_create_ledger_entry(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 2026,
            'type' => 'bonus',
            'days' => 2,
            'comment' => 'Firmenjubilaeum',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.type', 'bonus')
            ->assertJsonPath('data.days', 2)
            ->assertJsonPath('data.comment', 'Firmenjubilaeum');

        $this->assertDatabaseHas('vacation_ledger_entries', [
            'user_id' => $user->id,
            'year' => 2026,
            'type' => 'bonus',
        ]);
    }

    public function test_admin_can_create_adjustment_entry(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 2026,
            'type' => 'adjustment',
            'days' => -3,
            'comment' => 'Korrektur Fehltage',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.type', 'adjustment')
            ->assertJsonPath('data.days', -3);
    }

    public function test_admin_can_create_carryover_entry(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 2026,
            'type' => 'carryover',
            'days' => 5,
            'comment' => 'Uebertrag aus 2025',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.type', 'carryover');
    }

    public function test_employee_cannot_create_ledger_entry(): void
    {
        $employee = User::factory()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($employee)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 2026,
            'type' => 'bonus',
            'days' => 1,
            'comment' => 'Test',
        ]);

        $response->assertStatus(403);
    }

    public function test_create_ledger_entry_validates_required_fields(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type', 'days', 'comment']);
    }

    public function test_create_ledger_entry_validates_type(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 2026,
            'type' => 'taken',
            'days' => -5,
            'comment' => 'Test',
        ]);

        // 'taken' is not allowed via manual entry (only bonus, adjustment, carryover, expired)
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    }

    public function test_create_ledger_entry_validates_entitlement_not_allowed(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 2026,
            'type' => 'entitlement',
            'days' => 30,
            'comment' => 'Test',
        ]);

        // 'entitlement' is not allowed via manual entry
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    }

    public function test_ledger_filtered_by_year(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        VacationLedgerEntry::create(['user_id' => $user->id, 'year' => 2026, 'type' => 'entitlement', 'days' => 30, 'comment' => '2026']);
        VacationLedgerEntry::create(['user_id' => $user->id, 'year' => 2025, 'type' => 'entitlement', 'days' => 28, 'comment' => '2025']);

        $response = $this->actingAs($admin)->getJson("/api/admin/users/{$user->id}/vacation-ledger?year=2026");

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_ledger_defaults_to_current_year(): void
    {
        $user = User::factory()->create();
        $currentYear = (int) date('Y');

        VacationLedgerEntry::create([
            'user_id' => $user->id,
            'year' => $currentYear,
            'type' => 'entitlement',
            'days' => 30,
            'comment' => 'Current year',
        ]);

        $response = $this->actingAs($user)->getJson('/api/vacation-ledger');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_admin_can_create_expired_entry(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 2026,
            'type' => 'expired',
            'days' => -2,
            'comment' => 'Uebertrag verfallen',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.type', 'expired');
    }

    public function test_ledger_entry_response_has_correct_structure(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 2026,
            'type' => 'bonus',
            'days' => 1,
            'comment' => 'Test',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'type', 'days', 'comment', 'year'],
                'message',
            ]);
    }

    public function test_create_ledger_entry_requires_comment(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 2026,
            'type' => 'bonus',
            'days' => 1,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['comment']);
    }

    public function test_create_ledger_entry_requires_days(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 2026,
            'type' => 'bonus',
            'comment' => 'Test',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['days']);
    }

    public function test_ledger_entry_with_half_days(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 2026,
            'type' => 'bonus',
            'days' => 0.5,
            'comment' => 'Halber Sonderurlaubstag',
        ]);

        $response->assertStatus(201);
        $this->assertEquals(0.5, $response->json('data.days'));
    }

    public function test_admin_can_view_ledger_for_different_user(): void
    {
        $admin = User::factory()->admin()->create();
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        VacationLedgerEntry::create(['user_id' => $user1->id, 'year' => 2026, 'type' => 'entitlement', 'days' => 30, 'comment' => 'User 1']);
        VacationLedgerEntry::create(['user_id' => $user2->id, 'year' => 2026, 'type' => 'entitlement', 'days' => 25, 'comment' => 'User 2']);

        $response1 = $this->actingAs($admin)->getJson("/api/admin/users/{$user1->id}/vacation-ledger?year=2026");
        $response2 = $this->actingAs($admin)->getJson("/api/admin/users/{$user2->id}/vacation-ledger?year=2026");

        $response1->assertOk();
        $this->assertCount(1, $response1->json('data'));
        $this->assertEquals(30, $response1->json('data.0.days'));

        $response2->assertOk();
        $this->assertCount(1, $response2->json('data'));
        $this->assertEquals(25, $response2->json('data.0.days'));
    }

    public function test_employee_cannot_access_admin_ledger_endpoint(): void
    {
        $employee = User::factory()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($employee)->getJson("/api/admin/users/{$user->id}/vacation-ledger");

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_view_ledger(): void
    {
        $response = $this->getJson('/api/vacation-ledger');

        $response->assertStatus(401);
    }

    public function test_empty_ledger_returns_empty_array(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/vacation-ledger?year=2026');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_multiple_entries_for_same_year(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 2026, 'type' => 'bonus', 'days' => 2, 'comment' => 'Bonus 1',
        ])->assertStatus(201);

        $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 2026, 'type' => 'adjustment', 'days' => -1, 'comment' => 'Korrektur',
        ])->assertStatus(201);

        $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 2026, 'type' => 'bonus', 'days' => 1, 'comment' => 'Bonus 2',
        ])->assertStatus(201);

        $response = $this->actingAs($admin)->getJson("/api/admin/users/{$user->id}/vacation-ledger?year=2026");

        $response->assertOk();
        $this->assertCount(3, $response->json('data'));
    }

    public function test_ledger_year_validation_bounds(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 1999,
            'type' => 'bonus',
            'days' => 1,
            'comment' => 'Too old',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['year']);
    }

    public function test_comment_max_length_validation(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$user->id}/vacation-ledger", [
            'year' => 2026,
            'type' => 'bonus',
            'days' => 1,
            'comment' => str_repeat('A', 501),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['comment']);
    }
}
