<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CostCenter;
use App\Models\User;
use App\Models\UserGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CostCenterTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_view_available_cost_centers(): void
    {
        $employee = User::factory()->create();
        $costCenter = CostCenter::factory()->create();
        $employee->costCenters()->attach($costCenter->id);

        $response = $this->actingAs($employee)->getJson('/api/cost-centers');

        $response->assertOk();
        // Should see the assigned cost center plus the 4 system cost centers
        $data = $response->json('data');
        $codes = array_column($data, 'code');
        $this->assertContains($costCenter->code, $codes);
        $this->assertContains('VACATION', $codes);
    }

    public function test_admin_can_list_all_cost_centers(): void
    {
        $admin = User::factory()->admin()->create();
        CostCenter::factory()->create(['code' => 'PROJECT-A', 'name' => 'Project A']);

        $response = $this->actingAs($admin)->getJson('/api/admin/cost-centers');

        $response->assertOk();
        $data = $response->json('data');
        $codes = array_column($data, 'code');
        // Should include system ones and the custom one
        $this->assertContains('VACATION', $codes);
        $this->assertContains('ILLNESS', $codes);
        $this->assertContains('SPECIAL_LEAVE', $codes);
        $this->assertContains('HOLIDAY', $codes);
        $this->assertContains('PROJECT-A', $codes);
    }

    public function test_admin_can_create_cost_center(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/cost-centers', [
            'code' => 'DEV-001',
            'name' => 'Development',
            'description' => 'Software development tasks',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.code', 'DEV-001')
            ->assertJsonPath('data.name', 'Development');

        $this->assertDatabaseHas('cost_centers', [
            'code' => 'DEV-001',
            'name' => 'Development',
            'is_system' => false,
        ]);
    }

    public function test_admin_can_update_cost_center(): void
    {
        $admin = User::factory()->admin()->create();
        $costCenter = CostCenter::factory()->create(['name' => 'Old Name']);

        $response = $this->actingAs($admin)->patchJson("/api/admin/cost-centers/{$costCenter->id}", [
            'name' => 'New Name',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'New Name');

        $this->assertDatabaseHas('cost_centers', [
            'id' => $costCenter->id,
            'name' => 'New Name',
        ]);
    }

    public function test_admin_can_archive_cost_center(): void
    {
        $admin = User::factory()->admin()->create();
        $costCenter = CostCenter::factory()->create();

        $response = $this->actingAs($admin)->deleteJson("/api/admin/cost-centers/{$costCenter->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'Cost center archived.');

        $costCenter->refresh();
        $this->assertNotNull($costCenter->deleted_at);
        $this->assertFalse($costCenter->is_active);
    }

    public function test_admin_cannot_modify_system_cost_center(): void
    {
        $admin = User::factory()->admin()->create();
        $systemCostCenter = CostCenter::where('code', 'VACATION')->first();

        $response = $this->actingAs($admin)->patchJson("/api/admin/cost-centers/{$systemCostCenter->id}", [
            'name' => 'Modified',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'System cost centers cannot be modified.');
    }

    public function test_admin_cannot_delete_system_cost_center(): void
    {
        $admin = User::factory()->admin()->create();
        $systemCostCenter = CostCenter::where('code', 'ILLNESS')->first();

        $response = $this->actingAs($admin)->deleteJson("/api/admin/cost-centers/{$systemCostCenter->id}");

        $response->assertStatus(403)
            ->assertJsonPath('message', 'System cost centers cannot be deleted.');
    }

    public function test_employee_cannot_create_cost_center(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->postJson('/api/admin/cost-centers', [
            'code' => 'HACK',
            'name' => 'Hacked',
        ]);

        $response->assertStatus(403);
    }

    public function test_create_cost_center_validates_required_fields(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/cost-centers', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code', 'name']);
    }

    public function test_create_cost_center_validates_unique_code(): void
    {
        $admin = User::factory()->admin()->create();
        CostCenter::factory()->create(['code' => 'DUP-001']);

        $response = $this->actingAs($admin)->postJson('/api/admin/cost-centers', [
            'code' => 'DUP-001',
            'name' => 'Duplicate',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    public function test_cost_center_response_has_correct_structure(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/cost-centers', [
            'code' => 'STRUCT-01',
            'name' => 'Structure Test',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'code', 'name', 'description', 'is_system', 'is_active'],
                'message',
            ]);
    }

    public function test_employee_cannot_update_cost_center(): void
    {
        $employee = User::factory()->create();
        $costCenter = CostCenter::factory()->create();

        $response = $this->actingAs($employee)->patchJson("/api/admin/cost-centers/{$costCenter->id}", [
            'name' => 'Manipulated',
        ]);

        $response->assertStatus(403);
    }

    public function test_employee_cannot_delete_cost_center(): void
    {
        $employee = User::factory()->create();
        $costCenter = CostCenter::factory()->create();

        $response = $this->actingAs($employee)->deleteJson("/api/admin/cost-centers/{$costCenter->id}");

        $response->assertStatus(403);
    }

    public function test_cost_center_with_description(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/cost-centers', [
            'code' => 'DESC-01',
            'name' => 'With Description',
            'description' => 'A detailed description of this cost center.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.description', 'A detailed description of this cost center.');
    }

    public function test_unauthenticated_user_cannot_view_cost_centers(): void
    {
        $response = $this->getJson('/api/cost-centers');

        $response->assertStatus(401);
    }

    public function test_employee_sees_cost_centers_from_group(): void
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
}
