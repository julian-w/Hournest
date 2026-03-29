<?php

declare(strict_types=1);

namespace App\Socialite;

use SocialiteProviders\Manager\SocialiteWasCalled;

class OpenIDConnectExtendSocialite
{
    public function handle(SocialiteWasCalled $socialiteWasCalled): void
    {
        $socialiteWasCalled->extendSocialite('openid-connect', OpenIDConnectProvider::class);
    }
}
