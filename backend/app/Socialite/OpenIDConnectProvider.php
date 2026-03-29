<?php

declare(strict_types=1);

namespace App\Socialite;

use GuzzleHttp\RequestOptions;
use Illuminate\Support\Arr;
use SocialiteProviders\Manager\OAuth2\AbstractProvider;
use SocialiteProviders\Manager\OAuth2\User;

class OpenIDConnectProvider extends AbstractProvider
{
    public const IDENTIFIER = 'OPENID-CONNECT';

    protected $scopes = ['openid', 'email', 'profile'];

    protected $scopeSeparator = ' ';

    protected ?array $openIdConfig = null;

    protected function getOpenIdConfig(): array
    {
        if ($this->openIdConfig === null) {
            $response = $this->getHttpClient()->get(
                $this->getConfig('well_known_url')
            );

            $this->openIdConfig = json_decode((string) $response->getBody(), true);
        }

        return $this->openIdConfig;
    }

    public static function additionalConfigKeys(): array
    {
        return ['well_known_url'];
    }

    protected function getAuthUrl($state): string
    {
        return $this->buildAuthUrlFromBase(
            $this->getOpenIdConfig()['authorization_endpoint'],
            $state
        );
    }

    protected function getTokenUrl(): string
    {
        return $this->getOpenIdConfig()['token_endpoint'];
    }

    /**
     * @return array<string, mixed>
     */
    protected function getUserByToken($token): array
    {
        $response = $this->getHttpClient()->get(
            $this->getOpenIdConfig()['userinfo_endpoint'],
            [
                RequestOptions::HEADERS => [
                    'Authorization' => 'Bearer ' . $token,
                ],
            ]
        );

        return json_decode((string) $response->getBody(), true);
    }

    protected function mapUserToObject(array $user): \SocialiteProviders\Manager\OAuth2\User
    {
        return (new User())->setRaw($user)->map([
            'id' => Arr::get($user, 'sub'),
            'name' => Arr::get($user, 'name', Arr::get($user, 'preferred_username')),
            'email' => Arr::get($user, 'email'),
        ]);
    }
}
