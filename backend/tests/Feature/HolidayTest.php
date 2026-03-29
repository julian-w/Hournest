<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Holiday;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HolidayTest extends TestCase
{
    use RefreshDatabase;

    public function test_anyone_can_view_holidays(): void
    {
        $user = User::factory()->create();
        Holiday::create(['name' => 'Neujahr', 'date' => '2026-01-01', 'type' => 'fixed']);
        Holiday::create(['name' => 'Karfreitag', 'date' => '2026-04-03', 'type' => 'variable']);

        $response = $this->actingAs($user)->getJson('/api/holidays');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
    }

    public function test_holidays_can_be_filtered_by_year(): void
    {
        $user = User::factory()->create();
        Holiday::create(['name' => 'Neujahr 2026', 'date' => '2026-01-01', 'type' => 'fixed']);
        Holiday::create(['name' => 'Neujahr 2027', 'date' => '2027-01-01', 'type' => 'fixed']);

        $response = $this->actingAs($user)->getJson('/api/holidays?year=2026');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Neujahr 2026', $response->json('data.0.name'));
    }

    public function test_admin_can_create_holiday(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/holidays', [
            'name' => 'Tag der Arbeit',
            'date' => '2026-05-01',
            'type' => 'fixed',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Tag der Arbeit')
            ->assertJsonPath('data.type', 'fixed');

        $this->assertDatabaseHas('holidays', [
            'name' => 'Tag der Arbeit',
            'type' => 'fixed',
        ]);
    }

    public function test_admin_can_create_variable_holiday(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/holidays', [
            'name' => 'Ostermontag',
            'date' => '2026-04-06',
            'type' => 'variable',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Ostermontag')
            ->assertJsonPath('data.type', 'variable');
    }

    public function test_admin_can_update_holiday(): void
    {
        $admin = User::factory()->admin()->create();
        $holiday = Holiday::create(['name' => 'Neujahr', 'date' => '2026-01-01', 'type' => 'fixed']);

        $response = $this->actingAs($admin)->patchJson("/api/admin/holidays/{$holiday->id}", [
            'name' => 'Neujahrstag',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Neujahrstag');

        $this->assertDatabaseHas('holidays', [
            'id' => $holiday->id,
            'name' => 'Neujahrstag',
        ]);
    }

    public function test_admin_can_delete_holiday(): void
    {
        $admin = User::factory()->admin()->create();
        $holiday = Holiday::create(['name' => 'Testtag', 'date' => '2026-06-15', 'type' => 'fixed']);

        $response = $this->actingAs($admin)->deleteJson("/api/admin/holidays/{$holiday->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('holidays', ['id' => $holiday->id]);
    }

    public function test_employee_cannot_create_holiday(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->postJson('/api/admin/holidays', [
            'name' => 'Testtag',
            'date' => '2026-06-15',
            'type' => 'fixed',
        ]);

        $response->assertStatus(403);
    }

    public function test_employee_cannot_delete_holiday(): void
    {
        $employee = User::factory()->create();
        $holiday = Holiday::create(['name' => 'Testtag', 'date' => '2026-06-15', 'type' => 'fixed']);

        $response = $this->actingAs($employee)->deleteJson("/api/admin/holidays/{$holiday->id}");

        $response->assertStatus(403);
    }

    public function test_create_holiday_validates_required_fields(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/holidays', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'date', 'type']);
    }

    public function test_create_holiday_validates_type(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/holidays', [
            'name' => 'Testtag',
            'date' => '2026-06-15',
            'type' => 'invalid_type',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    }

    public function test_holidays_are_sorted_by_date(): void
    {
        $user = User::factory()->create();
        Holiday::create(['name' => 'Weihnachten', 'date' => '2026-12-25', 'type' => 'fixed']);
        Holiday::create(['name' => 'Neujahr', 'date' => '2026-01-01', 'type' => 'fixed']);
        Holiday::create(['name' => 'Tag der Arbeit', 'date' => '2026-05-01', 'type' => 'fixed']);

        $response = $this->actingAs($user)->getJson('/api/holidays');

        $response->assertOk();
        $names = array_column($response->json('data'), 'name');
        $this->assertEquals(['Neujahr', 'Tag der Arbeit', 'Weihnachten'], $names);
    }

    public function test_employee_cannot_update_holiday(): void
    {
        $employee = User::factory()->create();
        $holiday = Holiday::create(['name' => 'Neujahr', 'date' => '2026-01-01', 'type' => 'fixed']);

        $response = $this->actingAs($employee)->patchJson("/api/admin/holidays/{$holiday->id}", [
            'name' => 'Manipulated',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_update_holiday_type(): void
    {
        $admin = User::factory()->admin()->create();
        $holiday = Holiday::create(['name' => 'Ostermontag', 'date' => '2026-04-06', 'type' => 'fixed']);

        $response = $this->actingAs($admin)->patchJson("/api/admin/holidays/{$holiday->id}", [
            'type' => 'variable',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.type', 'variable');
    }

    public function test_admin_can_update_holiday_date(): void
    {
        $admin = User::factory()->admin()->create();
        $holiday = Holiday::create(['name' => 'Karfreitag', 'date' => '2026-04-03', 'type' => 'variable']);

        $response = $this->actingAs($admin)->patchJson("/api/admin/holidays/{$holiday->id}", [
            'date' => '2027-03-26',
        ]);

        $response->assertOk();
        $holiday->refresh();
        $this->assertEquals('2027-03-26', $holiday->date->format('Y-m-d'));
    }

    public function test_create_holiday_rejects_invalid_date(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/holidays', [
            'name' => 'Testtag',
            'date' => 'not-a-date',
            'type' => 'fixed',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['date']);
    }

    public function test_create_holiday_rejects_name_too_long(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/holidays', [
            'name' => str_repeat('A', 256),
            'date' => '2026-01-01',
            'type' => 'fixed',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_holiday_response_has_correct_structure(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/holidays', [
            'name' => 'Neujahr',
            'date' => '2026-01-01',
            'type' => 'fixed',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'name', 'date', 'type'],
                'message',
            ]);
    }

    public function test_delete_nonexistent_holiday_returns_404(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->deleteJson('/api/admin/holidays/99999');

        $response->assertStatus(404);
    }

    public function test_unauthenticated_user_cannot_view_holidays(): void
    {
        $response = $this->getJson('/api/holidays');

        $response->assertStatus(401);
    }

    public function test_empty_holidays_returns_empty_array(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/holidays');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }
}
