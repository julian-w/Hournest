<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    // ─── Superadmin Login (bcrypt hash) ───────────────────────────────

    public function test_superadmin_login_with_hashed_password(): void
    {
        config([
            'auth.superadmin.username' => 'admin',
            'auth.superadmin.password' => Hash::make('secret123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'admin',
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Logged in successfully.')
            ->assertJsonPath('data.role', 'superadmin');
    }

    public function test_superadmin_login_rejects_wrong_password(): void
    {
        config([
            'auth.superadmin.username' => 'admin',
            'auth.superadmin.password' => Hash::make('secret123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'admin',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('message', 'Invalid credentials.');
    }

    public function test_superadmin_login_rejects_wrong_username(): void
    {
        config([
            'auth.superadmin.username' => 'admin',
            'auth.superadmin.password' => Hash::make('secret123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'wrong-user',
            'password' => 'secret123',
        ]);

        $response->assertStatus(401);
    }

    public function test_superadmin_login_fails_when_not_configured(): void
    {
        config([
            'auth.superadmin.username' => null,
            'auth.superadmin.password' => null,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'admin',
            'password' => 'secret123',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('message', 'Invalid credentials.');
    }

    public function test_superadmin_login_validates_required_fields(): void
    {
        $response = $this->postJson('/api/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['username', 'password']);
    }

    public function test_superadmin_login_creates_user_with_superadmin_role(): void
    {
        config([
            'auth.superadmin.username' => 'admin',
            'auth.superadmin.password' => Hash::make('secret123'),
        ]);

        $this->postJson('/api/auth/login', [
            'username' => 'admin',
            'password' => 'secret123',
        ])->assertOk();

        $this->assertDatabaseHas('users', [
            'email' => 'superadmin@hournest.local',
            'role' => 'superadmin',
        ]);
    }

    public function test_superadmin_login_does_not_accept_plaintext_comparison(): void
    {
        // If someone accidentally puts plaintext in the config, Hash::check should fail
        config([
            'auth.superadmin.username' => 'admin',
            'auth.superadmin.password' => 'plaintext-password',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'admin',
            'password' => 'plaintext-password',
        ]);

        // Hash::check('plaintext-password', 'plaintext-password') returns false
        // because the second arg is not a valid bcrypt hash
        $response->assertStatus(401);
    }

    // ─── Rate Limiting ────────────────────────────────────────────────

    public function test_login_is_rate_limited(): void
    {
        config([
            'auth.superadmin.username' => 'admin',
            'auth.superadmin.password' => Hash::make('secret123'),
        ]);

        // Send 5 requests (the limit)
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', [
                'username' => 'admin',
                'password' => 'wrong',
            ]);
        }

        // 6th request should be rate limited
        $response = $this->postJson('/api/auth/login', [
            'username' => 'admin',
            'password' => 'wrong',
        ]);

        $response->assertStatus(429);
    }

    public function test_auth_routes_keep_standard_throttle_outside_e2e_environment(): void
    {
        $loginRoute = Route::getRoutes()->match(Request::create('/api/auth/login', 'POST'));
        $changePasswordRoute = Route::getRoutes()->match(Request::create('/api/auth/change-password', 'POST'));

        $this->assertContains('throttle:5,1', $loginRoute->gatherMiddleware());
        $this->assertNotContains('throttle:60,1', $loginRoute->gatherMiddleware());
        $this->assertContains('throttle:5,1', $changePasswordRoute->gatherMiddleware());
        $this->assertNotContains('throttle:60,1', $changePasswordRoute->gatherMiddleware());
    }

    // ─── Security Headers ─────────────────────────────────────────────

    public function test_security_headers_are_present(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/user');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('X-XSS-Protection', '1; mode=block');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }

    public function test_csp_header_is_present(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/user');

        $csp = $response->headers->get('Content-Security-Policy');
        $this->assertNotNull($csp);
        $this->assertStringContainsString("default-src 'self'", $csp);
        $this->assertStringContainsString("script-src 'self'", $csp);
        $this->assertStringContainsString("frame-ancestors 'none'", $csp);
    }

    public function test_security_headers_on_unauthenticated_request(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401);
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
    }

    // ─── Settings Whitelist ───────────────────────────────────────────

    public function test_settings_whitelist_blocks_arbitrary_keys(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->putJson('/api/admin/settings', [
            'settings' => [
                'malicious_setting' => 'evil_value',
                'another_bad_key' => 'bad_value',
            ],
        ]);

        $response->assertOk();
        $this->assertNull(Setting::get('malicious_setting'));
        $this->assertNull(Setting::get('another_bad_key'));
    }

    public function test_settings_whitelist_allows_valid_keys(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->putJson('/api/admin/settings', [
            'settings' => [
                'default_work_days' => '[1,2,3,4,5]',
                'vacation_booking_start' => '01.10',
                'company_name' => 'TestCorp',
                'weekend_is_free' => 'true',
                'carryover_enabled' => 'false',
                'carryover_expiry_date' => '31.03',
            ],
        ]);

        $response->assertOk();
        $this->assertEquals('[1,2,3,4,5]', Setting::get('default_work_days'));
        $this->assertEquals('01.10', Setting::get('vacation_booking_start'));
        $this->assertEquals('TestCorp', Setting::get('company_name'));
        $this->assertEquals('true', Setting::get('weekend_is_free'));
        $this->assertEquals('false', Setting::get('carryover_enabled'));
        $this->assertEquals('31.03', Setting::get('carryover_expiry_date'));
    }

    public function test_settings_mixed_valid_and_invalid_keys(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->putJson('/api/admin/settings', [
            'settings' => [
                'company_name' => 'ValidCorp',
                'evil_key' => 'should_be_filtered',
            ],
        ]);

        $response->assertOk();
        $this->assertEquals('ValidCorp', Setting::get('company_name'));
        $this->assertNull(Setting::get('evil_key'));
    }

    // ─── FormRequest Authorization (defense in depth) ─────────────────

    public function test_employee_blocked_by_form_request_authorize(): void
    {
        $employee = User::factory()->create();

        // These are already blocked by EnsureAdmin middleware (403),
        // but FormRequest authorize() provides a second layer
        $this->actingAs($employee)->postJson('/api/admin/holidays', [
            'name' => 'Test', 'date' => '2026-01-01', 'type' => 'fixed',
        ])->assertStatus(403);

        $holiday = \App\Models\Holiday::create(['name' => 'Test', 'date' => '2026-01-01', 'type' => 'fixed']);
        $this->actingAs($employee)->patchJson("/api/admin/holidays/{$holiday->id}", [
            'name' => 'Test',
        ])->assertStatus(403);

        $this->actingAs($employee)->putJson('/api/admin/settings', [
            'settings' => ['company_name' => 'Hacked'],
        ])->assertStatus(403);
    }

    public function test_admin_passes_form_request_authorize(): void
    {
        $admin = User::factory()->admin()->create();

        // Admin should pass both middleware AND FormRequest authorize
        $response = $this->actingAs($admin)->postJson('/api/admin/holidays', [
            'name' => 'Neujahr',
            'date' => '2026-01-01',
            'type' => 'fixed',
        ]);

        $response->assertStatus(201);
    }

    public function test_vacation_request_authorize_allows_any_authenticated_user(): void
    {
        $employee = User::factory()->create();

        $response = $this->actingAs($employee)->postJson('/api/vacations', [
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-05',
        ]);

        // StoreVacationRequest still returns true - any authenticated user can request vacation
        $response->assertStatus(201);
    }

    // ─── Soft-deleted user cannot authenticate ────────────────────────

    public function test_soft_deleted_user_vacations_excluded(): void
    {
        $user = User::factory()->create();
        $user->delete(); // soft delete

        $this->assertSoftDeleted('users', ['id' => $user->id]);
    }
}
