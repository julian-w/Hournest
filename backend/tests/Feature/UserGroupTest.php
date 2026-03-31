<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CostCenter;
use App\Models\User;
use App\Models\UserGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserGroupTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_user_groups(): void
    {
        $admin = User::factory()->admin()->create();
        UserGroup::create(['name' => 'Engineering']);
        UserGroup::create(['name' => 'Design']);

        $response = $this->actingAs($admin)->getJson('/api/admin/user-groups');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_admin_can_create_user_group(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/user-groups', [
            'name' => 'Marketing',
            'description' => 'Marketing team',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Marketing');

        $this->assertDatabaseHas('user_groups', [
            'name' => 'Marketing',
            'description' => 'Marketing team',
        ]);
    }

    public function test_admin_can_update_user_group(): void
    {
        $admin = User::factory()->admin()->create();
        $group = UserGroup::create(['name' => 'Old Name']);

        $response = $this->actingAs($admin)->patchJson("/api/admin/user-groups/{$group->id}", [
            'name' => 'New Name',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'New Name');

        $this->assertDatabaseHas('user_groups', [
            'id' => $group->id,
            'name' => 'New Name',
        ]);
    }

    public function test_admin_can_delete_user_group(): void
    {
        $admin = User::factory()->admin()->create();
        $group = UserGroup::create(['name' => 'To Delete']);

        $response = $this->actingAs($admin)->deleteJson("/api/admin/user-groups/{$group->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('user_groups', ['id' => $group->id]);
    }

    public function test_admin_can_set_group_members(): void
    {
        $admin = User::factory()->admin()->create();
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $group = UserGroup::create(['name' => 'Team']);

        $response = $this->actingAs($admin)->putJson("/api/admin/user-groups/{$group->id}/members", [
            'user_ids' => [$user1->id, $user2->id],
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Group members updated.');

        $this->assertDatabaseHas('user_group_members', [
            'user_group_id' => $group->id,
            'user_id' => $user1->id,
        ]);
        $this->assertDatabaseHas('user_group_members', [
            'user_group_id' => $group->id,
            'user_id' => $user2->id,
        ]);
    }

    public function test_admin_can_set_group_cost_centers(): void
    {
        $admin = User::factory()->admin()->create();
        $cc1 = CostCenter::factory()->create();
        $cc2 = CostCenter::factory()->create();
        $group = UserGroup::create(['name' => 'Team']);

        $response = $this->actingAs($admin)->putJson("/api/admin/user-groups/{$group->id}/cost-centers", [
            'cost_center_ids' => [$cc1->id, $cc2->id],
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Group cost centers updated.');

        $this->assertDatabaseHas('user_group_cost_centers', [
            'user_group_id' => $group->id,
            'cost_center_id' => $cc1->id,
        ]);
        $this->assertDatabaseHas('user_group_cost_centers', [
            'user_group_id' => $group->id,
            'cost_center_id' => $cc2->id,
        ]);
    }

    public function test_employee_cannot_create_user_group(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->postJson('/api/admin/user-groups', [
            'name' => 'Hack Group',
        ]);

        $response->assertStatus(403);
    }

    public function test_user_sees_cost_centers_from_group(): void
    {
        $employee = User::factory()->create();
        $costCenter = CostCenter::factory()->create();
        $group = UserGroup::create(['name' => 'Dev Team']);
        $group->members()->attach($employee->id);
        $group->costCenters()->attach($costCenter->id);

        $response = $this->actingAs($employee)->getJson('/api/cost-centers');

        $response->assertOk();
        $codes = array_column($response->json('data'), 'code');
        $this->assertContains($costCenter->code, $codes);
    }

    public function test_create_group_validates_required_fields(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/user-groups', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_employee_cannot_update_user_group(): void
    {
        $employee = User::factory()->create();
        $group = UserGroup::create(['name' => 'Team']);

        $response = $this->actingAs($employee)->patchJson("/api/admin/user-groups/{$group->id}", [
            'name' => 'Hacked',
        ]);

        $response->assertStatus(403);
    }

    public function test_employee_cannot_delete_user_group(): void
    {
        $employee = User::factory()->create();
        $group = UserGroup::create(['name' => 'Team']);

        $response = $this->actingAs($employee)->deleteJson("/api/admin/user-groups/{$group->id}");

        $response->assertStatus(403);
    }

    public function test_user_group_response_has_correct_structure(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/user-groups', [
            'name' => 'Structure Test',
            'description' => 'Testing structure',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'name', 'description', 'members', 'cost_centers'],
                'message',
            ]);
    }
}
