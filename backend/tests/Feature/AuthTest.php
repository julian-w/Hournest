<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_api(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_get_own_info(): void
    {
        $user = User::factory()->create(['vacation_days_per_year' => 30]);

        $response = $this->actingAs($user)->getJson('/api/user');

        $response->assertOk()
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.display_name', $user->display_name)
            ->assertJsonPath('data.role', 'employee')
            ->assertJsonStructure([
                'data' => ['id', 'email', 'display_name', 'role', 'vacation_days_per_year', 'remaining_vacation_days'],
            ]);
    }

    public function test_logout_invalidates_session(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->withHeaders([
                'Referer' => 'http://localhost',
            ])
            ->postJson('/api/auth/logout');

        $response->assertOk()
            ->assertJsonPath('message', 'Logged out successfully.');
    }

    public function test_auth_config_returns_oauth_status(): void
    {
        $response = $this->getJson('/api/auth/config');

        $response->assertOk()
            ->assertJsonStructure(['data' => ['oauth_enabled']]);
    }

    public function test_local_login_works_when_oauth_disabled(): void
    {
        config()->set('auth.oauth_enabled', false);

        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => 'secret123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'test@example.com',
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.email', 'test@example.com')
            ->assertJsonPath('message', 'Logged in successfully.');
    }

    public function test_local_login_blocked_when_oauth_enabled(): void
    {
        config()->set('auth.oauth_enabled', true);

        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => 'secret123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'test@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(401);
    }

    public function test_local_login_returns_must_change_password(): void
    {
        config()->set('auth.oauth_enabled', false);

        $user = User::factory()->create([
            'email' => 'new@example.com',
            'password' => 'default123',
            'must_change_password' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'new@example.com',
            'password' => 'default123',
        ]);

        $response->assertOk()
            ->assertJsonPath('must_change_password', true);
    }

    public function test_local_login_wrong_password_returns_401(): void
    {
        config()->set('auth.oauth_enabled', false);

        User::factory()->create([
            'email' => 'test@example.com',
            'password' => 'secret123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    public function test_change_password_succeeds(): void
    {
        $user = User::factory()->create([
            'password' => 'oldpassword123',
            'must_change_password' => true,
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword123',
            'new_password' => 'newpassword456',
            'new_password_confirmation' => 'newpassword456',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Password changed successfully.');

        $user->refresh();
        $this->assertFalse($user->must_change_password);
        $this->assertTrue(Hash::check('newpassword456', $user->password));
    }

    public function test_change_password_wrong_current_returns_422(): void
    {
        $user = User::factory()->create([
            'password' => 'oldpassword123',
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'wrongcurrent',
            'new_password' => 'newpassword456',
            'new_password_confirmation' => 'newpassword456',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Current password is incorrect.');
    }

    public function test_change_password_too_short_returns_422(): void
    {
        $user = User::factory()->create([
            'password' => 'oldpassword123',
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword123',
            'new_password' => 'short',
            'new_password_confirmation' => 'short',
        ]);

        $response->assertStatus(422);
    }

    public function test_change_password_mismatch_returns_422(): void
    {
        $user = User::factory()->create([
            'password' => 'oldpassword123',
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword123',
            'new_password' => 'newpassword456',
            'new_password_confirmation' => 'different789',
        ]);

        $response->assertStatus(422);
    }

    public function test_must_change_password_blocks_api_access(): void
    {
        $user = User::factory()->create([
            'must_change_password' => true,
        ]);

        $response = $this->actingAs($user)->getJson('/api/vacations');

        $response->assertStatus(403)
            ->assertJsonPath('must_change_password', true);
    }

    public function test_must_change_password_allows_change_password(): void
    {
        $user = User::factory()->create([
            'password' => 'oldpassword123',
            'must_change_password' => true,
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword123',
            'new_password' => 'newpassword456',
            'new_password_confirmation' => 'newpassword456',
        ]);

        $response->assertOk();
    }

    public function test_must_change_password_allows_logout(): void
    {
        $user = User::factory()->create([
            'must_change_password' => true,
        ]);

        $response = $this->actingAs($user)
            ->withHeaders(['Referer' => 'http://localhost'])
            ->postJson('/api/auth/logout');

        $response->assertOk();
    }
}
