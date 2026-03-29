<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
