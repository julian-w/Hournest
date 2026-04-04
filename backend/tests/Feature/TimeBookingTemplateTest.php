<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CostCenter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeBookingTemplateTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_list_own_templates(): void
    {
        $employee = User::factory()->create();
        $otherUser = User::factory()->create();
        $employeeCostCenter = CostCenter::factory()->create(['name' => 'Project Alpha', 'code' => 'ALPHA']);
        $otherCostCenter = CostCenter::factory()->create();

        $employee->costCenters()->attach($employeeCostCenter->id);
        $otherUser->costCenters()->attach($otherCostCenter->id);

        $employeeTemplate = $employee->timeBookingTemplates()->create(['name' => 'Sprint Day']);
        $employeeTemplate->items()->create([
            'cost_center_id' => $employeeCostCenter->id,
            'percentage' => 100,
        ]);

        $otherTemplate = $otherUser->timeBookingTemplates()->create(['name' => 'Hidden Template']);
        $otherTemplate->items()->create([
            'cost_center_id' => $otherCostCenter->id,
            'percentage' => 100,
        ]);

        $response = $this->actingAs($employee)->getJson('/api/time-booking-templates');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Sprint Day')
            ->assertJsonPath('data.0.items.0.cost_center_name', 'Project Alpha')
            ->assertJsonMissing(['name' => 'Hidden Template']);
    }

    public function test_employee_can_create_template(): void
    {
        $employee = User::factory()->create();
        $first = CostCenter::factory()->create();
        $second = CostCenter::factory()->create();
        $employee->costCenters()->attach([$first->id, $second->id]);

        $response = $this->actingAs($employee)->postJson('/api/time-booking-templates', [
            'name' => 'Standard Day',
            'items' => [
                ['cost_center_id' => $first->id, 'percentage' => 60],
                ['cost_center_id' => $second->id, 'percentage' => 40],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Template created.')
            ->assertJsonPath('data.name', 'Standard Day')
            ->assertJsonPath('data.items.0.percentage', 60)
            ->assertJsonPath('data.items.1.percentage', 40);

        $this->assertDatabaseHas('time_booking_templates', [
            'user_id' => $employee->id,
            'name' => 'Standard Day',
        ]);
        $this->assertDatabaseHas('time_booking_template_items', [
            'cost_center_id' => $first->id,
            'percentage' => 60,
        ]);
    }

    public function test_employee_cannot_create_template_with_unavailable_cost_center(): void
    {
        $employee = User::factory()->create();
        $unavailable = CostCenter::factory()->create();

        $response = $this->actingAs($employee)->postJson('/api/time-booking-templates', [
            'name' => 'Invalid Template',
            'items' => [
                ['cost_center_id' => $unavailable->id, 'percentage' => 100],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Cost center not available.');
    }

    public function test_employee_cannot_create_template_with_system_cost_center(): void
    {
        $employee = User::factory()->create();
        $systemCostCenter = CostCenter::where('code', 'VACATION')->firstOrFail();

        $response = $this->actingAs($employee)->postJson('/api/time-booking-templates', [
            'name' => 'Invalid Template',
            'items' => [
                ['cost_center_id' => $systemCostCenter->id, 'percentage' => 100],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'System cost centers cannot be saved in templates.');
    }

    public function test_template_percentages_must_sum_to_100(): void
    {
        $employee = User::factory()->create();
        $first = CostCenter::factory()->create();
        $second = CostCenter::factory()->create();
        $employee->costCenters()->attach([$first->id, $second->id]);

        $response = $this->actingAs($employee)->postJson('/api/time-booking-templates', [
            'name' => 'Broken Template',
            'items' => [
                ['cost_center_id' => $first->id, 'percentage' => 70],
                ['cost_center_id' => $second->id, 'percentage' => 20],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);
    }

    public function test_duplicate_cost_centers_are_rejected(): void
    {
        $employee = User::factory()->create();
        $costCenter = CostCenter::factory()->create();
        $employee->costCenters()->attach($costCenter->id);

        $response = $this->actingAs($employee)->postJson('/api/time-booking-templates', [
            'name' => 'Duplicate Template',
            'items' => [
                ['cost_center_id' => $costCenter->id, 'percentage' => 50],
                ['cost_center_id' => $costCenter->id, 'percentage' => 50],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);
    }

    public function test_employee_can_update_own_template(): void
    {
        $employee = User::factory()->create();
        $first = CostCenter::factory()->create();
        $second = CostCenter::factory()->create();
        $employee->costCenters()->attach([$first->id, $second->id]);

        $template = $employee->timeBookingTemplates()->create(['name' => 'Before']);
        $template->items()->create([
            'cost_center_id' => $first->id,
            'percentage' => 100,
        ]);

        $response = $this->actingAs($employee)->patchJson("/api/time-booking-templates/{$template->id}", [
            'name' => 'After',
            'items' => [
                ['cost_center_id' => $first->id, 'percentage' => 50],
                ['cost_center_id' => $second->id, 'percentage' => 50],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Template updated.')
            ->assertJsonPath('data.name', 'After')
            ->assertJsonCount(2, 'data.items');

        $this->assertDatabaseHas('time_booking_templates', [
            'id' => $template->id,
            'name' => 'After',
        ]);
        $this->assertDatabaseHas('time_booking_template_items', [
            'time_booking_template_id' => $template->id,
            'cost_center_id' => $second->id,
            'percentage' => 50,
        ]);
    }

    public function test_employee_cannot_update_other_users_template(): void
    {
        $employee = User::factory()->create();
        $otherUser = User::factory()->create();
        $costCenter = CostCenter::factory()->create();
        $employee->costCenters()->attach($costCenter->id);
        $otherUser->costCenters()->attach($costCenter->id);

        $template = $otherUser->timeBookingTemplates()->create(['name' => 'Other']);
        $template->items()->create([
            'cost_center_id' => $costCenter->id,
            'percentage' => 100,
        ]);

        $response = $this->actingAs($employee)->patchJson("/api/time-booking-templates/{$template->id}", [
            'name' => 'Hijack',
            'items' => [
                ['cost_center_id' => $costCenter->id, 'percentage' => 100],
            ],
        ]);

        $response->assertNotFound();
    }

    public function test_employee_can_delete_own_template(): void
    {
        $employee = User::factory()->create();
        $costCenter = CostCenter::factory()->create();
        $employee->costCenters()->attach($costCenter->id);

        $template = $employee->timeBookingTemplates()->create(['name' => 'Delete Me']);
        $template->items()->create([
            'cost_center_id' => $costCenter->id,
            'percentage' => 100,
        ]);

        $response = $this->actingAs($employee)->deleteJson("/api/time-booking-templates/{$template->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'Template deleted.');

        $this->assertDatabaseMissing('time_booking_templates', ['id' => $template->id]);
        $this->assertDatabaseMissing('time_booking_template_items', ['time_booking_template_id' => $template->id]);
    }

    public function test_employee_cannot_delete_other_users_template(): void
    {
        $employee = User::factory()->create();
        $otherUser = User::factory()->create();
        $costCenter = CostCenter::factory()->create();
        $otherUser->costCenters()->attach($costCenter->id);

        $template = $otherUser->timeBookingTemplates()->create(['name' => 'Protected']);
        $template->items()->create([
            'cost_center_id' => $costCenter->id,
            'percentage' => 100,
        ]);

        $response = $this->actingAs($employee)->deleteJson("/api/time-booking-templates/{$template->id}");

        $response->assertNotFound();
    }

    public function test_unauthenticated_user_cannot_manage_templates(): void
    {
        $this->getJson('/api/time-booking-templates')->assertStatus(401);
        $this->postJson('/api/time-booking-templates', [])->assertStatus(401);
        $this->patchJson('/api/time-booking-templates/999', [])->assertStatus(401);
        $this->deleteJson('/api/time-booking-templates/999')->assertStatus(401);
    }
}
