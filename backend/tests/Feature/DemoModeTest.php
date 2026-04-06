<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class DemoModeTest extends TestCase
{
    use RefreshDatabase;

    public function test_auth_config_exposes_demo_metadata(): void
    {
        config()->set('demo.enabled', true);
        config()->set('demo.notice', 'Public demo notice');
        config()->set('demo.reference_date', '2026-04-06');
        config()->set('demo.capabilities.password_change', false);
        config()->set('auth.oauth_enabled', true);

        $response = $this->getJson('/api/auth/config');

        $response->assertOk()
            ->assertJsonPath('data.oauth_enabled', false)
            ->assertJsonPath('data.demo.enabled', true)
            ->assertJsonPath('data.demo.notice', 'Public demo notice')
            ->assertJsonPath('data.demo.reference_date', '2026-04-06')
            ->assertJsonPath('data.demo.password_change_allowed', false)
            ->assertJsonPath('data.demo.login.shared_password', 'demo-password')
            ->assertJsonPath('data.demo.login.users.0.email', 'anna.admin@demo.hournest.local');
    }

    public function test_oauth_redirect_is_hidden_in_demo_mode(): void
    {
        config()->set('demo.enabled', true);

        $this->get('/api/auth/redirect')->assertNotFound();
    }

    public function test_auth_config_keeps_password_changes_available_outside_demo_mode(): void
    {
        config()->set('demo.enabled', false);
        config()->set('demo.capabilities.password_change', false);
        config()->set('auth.oauth_enabled', false);

        $response = $this->getJson('/api/auth/config');

        $response->assertOk()
            ->assertJsonPath('data.demo.enabled', false)
            ->assertJsonPath('data.demo.password_change_allowed', true);
    }

    public function test_demo_mode_can_block_password_changes(): void
    {
        config()->set('demo.enabled', true);
        config()->set('demo.capabilities.password_change', false);

        $user = User::factory()->create([
            'password' => 'oldpassword123',
            'must_change_password' => false,
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword123',
            'new_password' => 'newpassword456',
            'new_password_confirmation' => 'newpassword456',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('demo_blocked', true)
            ->assertJsonPath('demo_capability', 'password_change');

        $user->refresh();
        $this->assertTrue(Hash::check('oldpassword123', $user->password));
    }

    public function test_demo_mode_can_block_vacation_requests(): void
    {
        config()->set('demo.enabled', true);
        config()->set('demo.capabilities.vacation_requests', false);

        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/vacations', [
            'start_date' => now()->addWeek()->toDateString(),
            'end_date' => now()->addWeek()->toDateString(),
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('demo_blocked', true)
            ->assertJsonPath('demo_capability', 'vacation_requests');
    }

    public function test_demo_mode_can_block_user_management(): void
    {
        config()->set('demo.enabled', true);
        config()->set('demo.capabilities.user_management', false);

        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/users', [
            'display_name' => 'Blocked Demo User',
            'email' => 'blocked@example.com',
            'role' => 'employee',
            'password' => 'default123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('demo_blocked', true)
            ->assertJsonPath('demo_capability', 'user_management');

        $this->assertDatabaseMissing('users', [
            'email' => 'blocked@example.com',
        ]);
    }

    public function test_demo_mode_can_block_admin_password_resets(): void
    {
        config()->set('demo.enabled', true);
        config()->set('demo.capabilities.user_management', false);

        $admin = User::factory()->admin()->create();
        $employee = User::factory()->create([
            'password' => 'unchanged-password',
        ]);

        $response = $this->actingAs($admin)->patchJson("/api/admin/users/{$employee->id}/reset-password");

        $response->assertStatus(403)
            ->assertJsonPath('demo_blocked', true)
            ->assertJsonPath('demo_capability', 'user_management');

        $employee->refresh();
        $this->assertTrue(Hash::check('unchanged-password', $employee->password));
    }

    public function test_sensitive_mutating_routes_are_demo_protected(): void
    {
        $expectedDemoMiddleware = [
            ['POST', '/api/auth/change-password', 'demo:password_change'],
            ['POST', '/api/vacations', 'demo:vacation_requests'],
            ['DELETE', '/api/vacations/1', 'demo:vacation_requests'],
            ['POST', '/api/absences', 'demo:absence_requests'],
            ['DELETE', '/api/absences/1', 'demo:absence_requests'],
            ['PUT', '/api/time-entries/2026-04-06', 'demo:time_tracking'],
            ['DELETE', '/api/time-entries/2026-04-06', 'demo:time_tracking'],
            ['PUT', '/api/time-bookings/2026-04-06', 'demo:time_tracking'],
            ['POST', '/api/time-booking-templates', 'demo:time_booking_templates'],
            ['PATCH', '/api/time-booking-templates/1', 'demo:time_booking_templates'],
            ['DELETE', '/api/time-booking-templates/1', 'demo:time_booking_templates'],
            ['POST', '/api/cost-center-favorites', 'demo:favorites'],
            ['DELETE', '/api/cost-center-favorites/1', 'demo:favorites'],
            ['PATCH', '/api/cost-center-favorites/reorder', 'demo:favorites'],
            ['PATCH', '/api/admin/vacations/1', 'demo:admin_reviews'],
            ['POST', '/api/admin/users', 'demo:user_management'],
            ['PATCH', '/api/admin/users/1', 'demo:user_management'],
            ['DELETE', '/api/admin/users/1', 'demo:user_management'],
            ['PATCH', '/api/admin/users/1/reset-password', 'demo:user_management'],
            ['POST', '/api/admin/holidays', 'demo:holiday_management'],
            ['PATCH', '/api/admin/holidays/1', 'demo:holiday_management'],
            ['DELETE', '/api/admin/holidays/1', 'demo:holiday_management'],
            ['POST', '/api/admin/blackouts', 'demo:blackout_management'],
            ['PATCH', '/api/admin/blackouts/1', 'demo:blackout_management'],
            ['DELETE', '/api/admin/blackouts/1', 'demo:blackout_management'],
            ['PUT', '/api/admin/settings', 'demo:settings_management'],
            ['POST', '/api/admin/users/1/work-schedules', 'demo:work_schedule_management'],
            ['PATCH', '/api/admin/work-schedules/1', 'demo:work_schedule_management'],
            ['DELETE', '/api/admin/work-schedules/1', 'demo:work_schedule_management'],
            ['POST', '/api/admin/users/1/vacation-ledger', 'demo:vacation_ledger_management'],
            ['DELETE', '/api/admin/users/1/vacation-ledger/1', 'demo:vacation_ledger_management'],
            ['POST', '/api/admin/users/1/work-time-account', 'demo:work_time_account_management'],
            ['DELETE', '/api/admin/users/1/work-time-account/1', 'demo:work_time_account_management'],
            ['POST', '/api/admin/cost-centers', 'demo:cost_center_management'],
            ['PATCH', '/api/admin/cost-centers/1', 'demo:cost_center_management'],
            ['DELETE', '/api/admin/cost-centers/1', 'demo:cost_center_management'],
            ['POST', '/api/admin/user-groups', 'demo:user_group_management'],
            ['PATCH', '/api/admin/user-groups/1', 'demo:user_group_management'],
            ['DELETE', '/api/admin/user-groups/1', 'demo:user_group_management'],
            ['PUT', '/api/admin/user-groups/1/members', 'demo:user_group_management'],
            ['PUT', '/api/admin/user-groups/1/cost-centers', 'demo:user_group_management'],
            ['PUT', '/api/admin/users/1/cost-centers', 'demo:user_cost_center_management'],
            ['PATCH', '/api/admin/absences/1', 'demo:admin_reviews'],
            ['POST', '/api/admin/absences', 'demo:admin_reviews'],
            ['DELETE', '/api/admin/absences/1', 'demo:admin_reviews'],
            ['PUT', '/api/admin/time-bookings/1/2026-04-06/entry', 'demo:time_tracking'],
            ['PUT', '/api/admin/time-bookings/1/2026-04-06/bookings', 'demo:time_tracking'],
            ['POST', '/api/admin/time-locks', 'demo:time_lock_management'],
        ];

        foreach ($expectedDemoMiddleware as [$method, $uri, $middleware]) {
            $route = Route::getRoutes()->match(Request::create($uri, $method));

            $this->assertContains(
                $middleware,
                $route->gatherMiddleware(),
                sprintf('Expected %s %s to include middleware %s.', $method, $uri, $middleware)
            );
        }
    }
}
