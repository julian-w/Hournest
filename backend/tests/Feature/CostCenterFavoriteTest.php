<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CostCenter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CostCenterFavoriteTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_add_and_list_favorites(): void
    {
        $employee = User::factory()->create();
        $favorite = CostCenter::factory()->create(['name' => 'Favorite CC']);
        $employee->costCenters()->attach($favorite->id);

        $createResponse = $this->actingAs($employee)->postJson('/api/cost-center-favorites', [
            'cost_center_id' => $favorite->id,
        ]);

        $createResponse->assertStatus(201)
            ->assertJsonPath('message', 'Favorite added.');

        $this->assertDatabaseHas('cost_center_favorites', [
            'user_id' => $employee->id,
            'cost_center_id' => $favorite->id,
            'sort_order' => 1,
        ]);

        $listResponse = $this->actingAs($employee)->getJson('/api/cost-center-favorites');

        $listResponse->assertOk();
        $this->assertSame([$favorite->id], array_column($listResponse->json('data'), 'id'));
    }

    public function test_employee_cannot_favorite_unavailable_cost_center(): void
    {
        $employee = User::factory()->create();
        $unavailable = CostCenter::factory()->create();

        $response = $this->actingAs($employee)->postJson('/api/cost-center-favorites', [
            'cost_center_id' => $unavailable->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Cost center not available.');

        $this->assertDatabaseMissing('cost_center_favorites', [
            'user_id' => $employee->id,
            'cost_center_id' => $unavailable->id,
        ]);
    }

    public function test_employee_can_remove_favorite(): void
    {
        $employee = User::factory()->create();
        $favorite = CostCenter::factory()->create();
        $employee->costCenters()->attach($favorite->id);
        $employee->costCenterFavorites()->attach($favorite->id, ['sort_order' => 0]);

        $response = $this->actingAs($employee)->deleteJson("/api/cost-center-favorites/{$favorite->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'Favorite removed.');

        $this->assertDatabaseMissing('cost_center_favorites', [
            'user_id' => $employee->id,
            'cost_center_id' => $favorite->id,
        ]);
    }

    public function test_employee_can_reorder_existing_favorites(): void
    {
        $employee = User::factory()->create();
        $first = CostCenter::factory()->create(['name' => 'First']);
        $second = CostCenter::factory()->create(['name' => 'Second']);
        $employee->costCenters()->attach([$first->id, $second->id]);
        $employee->costCenterFavorites()->attach([
            $first->id => ['sort_order' => 0],
            $second->id => ['sort_order' => 1],
        ]);

        $response = $this->actingAs($employee)->patchJson('/api/cost-center-favorites/reorder', [
            'cost_center_ids' => [$second->id, $first->id],
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Favorites reordered.');

        $listResponse = $this->actingAs($employee)->getJson('/api/cost-center-favorites');

        $listResponse->assertOk();
        $this->assertSame([$second->id, $first->id], array_column($listResponse->json('data'), 'id'));
    }

    public function test_employee_cannot_reorder_with_non_favorite_cost_center(): void
    {
        $employee = User::factory()->create();
        $favorite = CostCenter::factory()->create();
        $other = CostCenter::factory()->create();
        $employee->costCenters()->attach([$favorite->id, $other->id]);
        $employee->costCenterFavorites()->attach($favorite->id, ['sort_order' => 0]);

        $response = $this->actingAs($employee)->patchJson('/api/cost-center-favorites/reorder', [
            'cost_center_ids' => [$other->id],
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Favorites reorder payload must match your existing favorites.');
    }

    public function test_employee_cannot_reorder_with_duplicate_cost_center_ids(): void
    {
        $employee = User::factory()->create();
        $first = CostCenter::factory()->create();
        $second = CostCenter::factory()->create();
        $employee->costCenters()->attach([$first->id, $second->id]);
        $employee->costCenterFavorites()->attach([
            $first->id => ['sort_order' => 0],
            $second->id => ['sort_order' => 1],
        ]);

        $response = $this->actingAs($employee)->patchJson('/api/cost-center-favorites/reorder', [
            'cost_center_ids' => [$first->id, $first->id],
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Favorites reorder payload must match your existing favorites.');
    }

    public function test_reorder_validates_required_payload(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->patchJson('/api/cost-center-favorites/reorder', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['cost_center_ids']);
    }

    public function test_unauthenticated_user_cannot_manage_favorites(): void
    {
        $costCenter = CostCenter::factory()->create();

        $this->getJson('/api/cost-center-favorites')->assertStatus(401);
        $this->postJson('/api/cost-center-favorites', ['cost_center_id' => $costCenter->id])->assertStatus(401);
        $this->patchJson('/api/cost-center-favorites/reorder', ['cost_center_ids' => [$costCenter->id]])->assertStatus(401);
        $this->deleteJson("/api/cost-center-favorites/{$costCenter->id}")->assertStatus(401);
    }
}
