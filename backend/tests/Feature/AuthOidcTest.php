<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Contracts\Factory as SocialiteFactory;
use Mockery;
use Tests\TestCase;

class AuthOidcTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Mockery::close();

        parent::tearDown();
    }

    public function test_oidc_redirect_returns_provider_redirect_response(): void
    {
        $provider = Mockery::mock();
        $provider->shouldReceive('redirect')
            ->once()
            ->andReturn(redirect()->away('https://id.example.test/auth'));

        $factory = Mockery::mock(SocialiteFactory::class);
        $factory->shouldReceive('driver')
            ->once()
            ->with('openid-connect')
            ->andReturn($provider);

        $this->app->instance(SocialiteFactory::class, $factory);

        $response = $this->get('/api/auth/redirect');

        $response->assertRedirect('https://id.example.test/auth');
    }

    public function test_oidc_callback_creates_admin_user_from_admin_email_list(): void
    {
        config([
            'auth.admin_emails' => 'boss@example.com',
            'app.frontend_url' => 'http://frontend.test',
        ]);

        $oidcUser = Mockery::mock();
        $oidcUser->shouldReceive('getId')->andReturn('oidc-123');
        $oidcUser->shouldReceive('getEmail')->andReturn('boss@example.com');
        $oidcUser->shouldReceive('getName')->andReturn('Boss User');

        $provider = Mockery::mock();
        $provider->shouldReceive('user')->once()->andReturn($oidcUser);

        $factory = Mockery::mock(SocialiteFactory::class);
        $factory->shouldReceive('driver')
            ->once()
            ->with('openid-connect')
            ->andReturn($provider);

        $this->app->instance(SocialiteFactory::class, $factory);

        $response = $this->get('/api/auth/callback');

        $response->assertRedirect('http://frontend.test');
        $this->assertAuthenticated();

        $this->assertDatabaseHas('users', [
            'oidc_id' => 'oidc-123',
            'email' => 'boss@example.com',
            'display_name' => 'Boss User',
            'role' => UserRole::Admin->value,
        ]);
    }

    public function test_oidc_callback_links_preprovisioned_user_by_email(): void
    {
        config([
            'auth.admin_emails' => '',
            'app.frontend_url' => 'http://frontend.test',
        ]);

        $existing = User::factory()->create([
            'email' => 'worker@example.com',
            'display_name' => 'Provisioned Name',
            'oidc_id' => null,
            'role' => UserRole::Employee,
        ]);

        $oidcUser = Mockery::mock();
        $oidcUser->shouldReceive('getId')->andReturn('oidc-employee');
        $oidcUser->shouldReceive('getEmail')->andReturn('worker@example.com');
        $oidcUser->shouldReceive('getName')->andReturn('Updated Name');

        $provider = Mockery::mock();
        $provider->shouldReceive('user')->once()->andReturn($oidcUser);

        $factory = Mockery::mock(SocialiteFactory::class);
        $factory->shouldReceive('driver')
            ->once()
            ->with('openid-connect')
            ->andReturn($provider);

        $this->app->instance(SocialiteFactory::class, $factory);

        $response = $this->get('/api/auth/callback');

        $response->assertRedirect('http://frontend.test');

        $existing->refresh();
        $this->assertSame('oidc-employee', $existing->oidc_id);
        $this->assertSame('Updated Name', $existing->display_name);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_oidc_callback_updates_existing_user_by_oidc_id(): void
    {
        config([
            'auth.admin_emails' => '',
            'app.frontend_url' => 'http://frontend.test',
        ]);

        $existing = User::factory()->create([
            'email' => 'old@example.com',
            'display_name' => 'Old Name',
            'oidc_id' => 'oidc-123',
            'role' => UserRole::Employee,
        ]);

        $oidcUser = Mockery::mock();
        $oidcUser->shouldReceive('getId')->andReturn('oidc-123');
        $oidcUser->shouldReceive('getEmail')->andReturn('new@example.com');
        $oidcUser->shouldReceive('getName')->andReturn('New Name');

        $provider = Mockery::mock();
        $provider->shouldReceive('user')->once()->andReturn($oidcUser);

        $factory = Mockery::mock(SocialiteFactory::class);
        $factory->shouldReceive('driver')
            ->once()
            ->with('openid-connect')
            ->andReturn($provider);

        $this->app->instance(SocialiteFactory::class, $factory);

        $response = $this->get('/api/auth/callback');

        $response->assertRedirect('http://frontend.test');

        $existing->refresh();
        $this->assertSame('new@example.com', $existing->email);
        $this->assertSame('New Name', $existing->display_name);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_oidc_callback_defaults_to_employee_role_and_falls_back_to_email_as_name(): void
    {
        config([
            'auth.admin_emails' => '',
            'app.frontend_url' => 'http://frontend.test',
        ]);

        $oidcUser = Mockery::mock();
        $oidcUser->shouldReceive('getId')->andReturn('oidc-employee-default');
        $oidcUser->shouldReceive('getEmail')->andReturn('employee@example.com');
        $oidcUser->shouldReceive('getName')->andReturn(null);

        $provider = Mockery::mock();
        $provider->shouldReceive('user')->once()->andReturn($oidcUser);

        $factory = Mockery::mock(SocialiteFactory::class);
        $factory->shouldReceive('driver')
            ->once()
            ->with('openid-connect')
            ->andReturn($provider);

        $this->app->instance(SocialiteFactory::class, $factory);

        $response = $this->get('/api/auth/callback');

        $response->assertRedirect('http://frontend.test');
        $this->assertDatabaseHas('users', [
            'oidc_id' => 'oidc-employee-default',
            'email' => 'employee@example.com',
            'display_name' => 'employee@example.com',
            'role' => UserRole::Employee->value,
        ]);
    }

    public function test_oidc_callback_updates_existing_user_name_with_email_when_provider_name_is_missing(): void
    {
        config([
            'auth.admin_emails' => '',
            'app.frontend_url' => 'http://frontend.test',
        ]);

        $existing = User::factory()->create([
            'email' => 'old@example.com',
            'display_name' => 'Old Name',
            'oidc_id' => 'oidc-missing-name',
            'role' => UserRole::Employee,
        ]);

        $oidcUser = Mockery::mock();
        $oidcUser->shouldReceive('getId')->andReturn('oidc-missing-name');
        $oidcUser->shouldReceive('getEmail')->andReturn('renamed@example.com');
        $oidcUser->shouldReceive('getName')->andReturn(null);

        $provider = Mockery::mock();
        $provider->shouldReceive('user')->once()->andReturn($oidcUser);

        $factory = Mockery::mock(SocialiteFactory::class);
        $factory->shouldReceive('driver')
            ->once()
            ->with('openid-connect')
            ->andReturn($provider);

        $this->app->instance(SocialiteFactory::class, $factory);

        $response = $this->get('/api/auth/callback');

        $response->assertRedirect('http://frontend.test');

        $existing->refresh();
        $this->assertSame('renamed@example.com', $existing->email);
        $this->assertSame('renamed@example.com', $existing->display_name);
    }
}
