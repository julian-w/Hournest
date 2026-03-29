<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_anyone_can_view_settings(): void
    {
        $user = User::factory()->create();
        Setting::set('weekend_is_free', 'true');
        Setting::set('carryover_enabled', 'true');

        $response = $this->actingAs($user)->getJson('/api/settings');

        $response->assertOk();
        $this->assertGreaterThanOrEqual(2, count($response->json('data')));
    }

    public function test_admin_can_update_settings(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->putJson('/api/admin/settings', [
            'settings' => [
                'weekend_is_free' => 'true',
                'carryover_enabled' => 'false',
                'carryover_expiry_date' => '31.03',
            ],
        ]);

        $response->assertOk();
        $this->assertEquals('true', Setting::get('weekend_is_free'));
        $this->assertEquals('false', Setting::get('carryover_enabled'));
        $this->assertEquals('31.03', Setting::get('carryover_expiry_date'));
    }

    public function test_admin_can_update_vacation_booking_start(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->putJson('/api/admin/settings', [
            'settings' => [
                'vacation_booking_start' => '01.10',
            ],
        ]);

        $response->assertOk();
        $this->assertEquals('01.10', Setting::get('vacation_booking_start'));
    }

    public function test_employee_cannot_update_settings(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->putJson('/api/admin/settings', [
            'settings' => ['weekend_is_free' => 'false'],
        ]);

        $response->assertStatus(403);
    }

    public function test_update_settings_validates_required_array(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->putJson('/api/admin/settings', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['settings']);
    }

    public function test_settings_can_be_created_and_updated(): void
    {
        $admin = User::factory()->admin()->create();

        // Create
        $this->actingAs($admin)->putJson('/api/admin/settings', [
            'settings' => ['company_name' => 'TestCorp'],
        ])->assertOk();

        $this->assertEquals('TestCorp', Setting::get('company_name'));

        // Update same key
        $this->actingAs($admin)->putJson('/api/admin/settings', [
            'settings' => ['company_name' => 'TestCorp v2'],
        ])->assertOk();

        $this->assertEquals('TestCorp v2', Setting::get('company_name'));
    }

    public function test_setting_model_get_returns_default(): void
    {
        $this->assertNull(Setting::get('nonexistent_key'));
        $this->assertEquals('fallback', Setting::get('nonexistent_key', 'fallback'));
    }

    public function test_admin_can_update_multiple_settings_at_once(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->putJson('/api/admin/settings', [
            'settings' => [
                'company_name' => 'TestCorp',
                'vacation_booking_start' => '01.01',
                'default_work_days' => '[1,2,3,4,5]',
            ],
        ]);

        $response->assertOk();
        $this->assertEquals('TestCorp', Setting::get('company_name'));
        $this->assertEquals('01.01', Setting::get('vacation_booking_start'));
        $this->assertEquals('[1,2,3,4,5]', Setting::get('default_work_days'));
    }

    public function test_settings_can_be_set_to_null(): void
    {
        $admin = User::factory()->admin()->create();

        Setting::set('company_name', 'some_value');

        $response = $this->actingAs($admin)->putJson('/api/admin/settings', [
            'settings' => ['company_name' => null],
        ]);

        $response->assertOk();
    }

    public function test_unauthenticated_user_cannot_view_settings(): void
    {
        $response = $this->getJson('/api/settings');

        $response->assertStatus(401);
    }

    public function test_settings_response_has_correct_structure(): void
    {
        $user = User::factory()->create();
        Setting::set('weekend_is_free', 'true');

        $response = $this->actingAs($user)->getJson('/api/settings');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['key', 'value'],
                ],
            ]);
    }

    public function test_settings_update_returns_all_settings(): void
    {
        $admin = User::factory()->admin()->create();
        Setting::set('company_name', 'old_value');

        $response = $this->actingAs($admin)->putJson('/api/admin/settings', [
            'settings' => ['vacation_booking_start' => '01.10'],
        ]);

        $response->assertOk();
        $keys = array_column($response->json('data'), 'key');
        $this->assertContains('company_name', $keys);
        $this->assertContains('vacation_booking_start', $keys);
    }

    public function test_admin_can_update_default_work_days(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->putJson('/api/admin/settings', [
            'settings' => [
                'default_work_days' => '[1,2,3,4,5]',
            ],
        ]);

        $response->assertOk();
        $this->assertEquals('[1,2,3,4,5]', Setting::get('default_work_days'));
    }

    public function test_non_whitelisted_settings_are_ignored(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->putJson('/api/admin/settings', [
            'settings' => [
                'company_name' => 'TestCorp',
                'malicious_key' => 'should_be_ignored',
            ],
        ]);

        $response->assertOk();
        $this->assertEquals('TestCorp', Setting::get('company_name'));
        $this->assertNull(Setting::get('malicious_key'));
    }

    public function test_admin_can_update_carryover_expiry_date(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->putJson('/api/admin/settings', [
            'settings' => [
                'carryover_expiry_date' => '31.03',
            ],
        ]);

        $response->assertOk();
        $this->assertEquals('31.03', Setting::get('carryover_expiry_date'));
    }
}
