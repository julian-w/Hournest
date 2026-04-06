<?php

declare(strict_types=1);

namespace App\Providers;

use App\Demo\DemoSafety;
use App\Socialite\OpenIDConnectExtendSocialite;
use Dedoc\Scramble\Scramble;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use SocialiteProviders\Manager\SocialiteWasCalled;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        app(DemoSafety::class)->assertRuntimeSafety(app()->environment());

        if (config('auth.oauth_enabled')) {
            \Illuminate\Support\Facades\Event::listen(
                SocialiteWasCalled::class,
                OpenIDConnectExtendSocialite::class . '@handle',
            );
        }

        Gate::define('viewApiDocs', function ($user = null) {
            // In local env, allow everyone (including unauthenticated)
            if (app()->environment('local')) {
                return true;
            }
            // In production, only allow admins
            return $user?->isAdmin() ?? false;
        });
    }
}
