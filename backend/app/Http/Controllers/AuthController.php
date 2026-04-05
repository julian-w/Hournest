<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function config(): JsonResponse
    {
        return response()->json([
            'data' => [
                'oauth_enabled' => config('auth.oauth_enabled'),
            ],
        ]);
    }

    public function redirect(): RedirectResponse
    {
        return Socialite::driver('openid-connect')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        $oidcUser = Socialite::driver('openid-connect')->user();

        $adminEmails = array_filter(array_map('trim', explode(',', config('auth.admin_emails', ''))));
        $role = in_array($oidcUser->getEmail(), $adminEmails, true) ? UserRole::Admin : UserRole::Employee;

        // Try to find existing user by OIDC ID first, then by email (pre-provisioned users)
        $user = User::where('oidc_id', $oidcUser->getId())->first();

        if ($user) {
            $user->update([
                'email' => $oidcUser->getEmail(),
                'display_name' => $oidcUser->getName() ?? $oidcUser->getEmail(),
                'role' => $role,
            ]);
        } else {
            // Check if a pre-provisioned user exists with this email (created by admin before first SSO login)
            $preProvisioned = User::where('email', $oidcUser->getEmail())->whereNull('oidc_id')->first();

            if ($preProvisioned) {
                $preProvisioned->update([
                    'oidc_id' => $oidcUser->getId(),
                    'display_name' => $oidcUser->getName() ?? $oidcUser->getEmail(),
                    'role' => $role,
                ]);
                $user = $preProvisioned;
            } else {
                $user = User::create([
                    'oidc_id' => $oidcUser->getId(),
                    'email' => $oidcUser->getEmail(),
                    'display_name' => $oidcUser->getName() ?? $oidcUser->getEmail(),
                    'role' => $role,
                ]);
            }
        }

        auth()->login($user);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return redirect(config('app.frontend_url', 'http://localhost:4200'));
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // 1. Superadmin login (always available, config-based)
        $superadminUsername = config('auth.superadmin.username');
        $superadminPassword = config('auth.superadmin.password');

        if ($superadminUsername && $superadminPassword && $request->username === $superadminUsername) {
            try {
                $passwordValid = Hash::check($request->password, $superadminPassword);
            } catch (\RuntimeException) {
                $passwordValid = false;
            }

            if ($passwordValid) {
                $user = User::firstOrCreate(
                    ['email' => 'superadmin@hournest.local'],
                    [
                        'display_name' => 'Superadmin',
                        'role' => UserRole::Superadmin,
                        'vacation_days_per_year' => 0,
                        'oidc_id' => 'local-superadmin',
                    ]
                );

                $updates = [];
                if ($user->role !== UserRole::Superadmin) {
                    $updates['role'] = UserRole::Superadmin;
                }
                if ($user->must_change_password) {
                    $updates['must_change_password'] = false;
                }
                if ($updates) {
                    $user->update($updates);
                }

                auth()->login($user);
                if ($request->hasSession()) {
                    $request->session()->regenerate();
                }

                return response()->json([
                    'data' => new UserResource($user),
                    'message' => 'Logged in successfully.',
                ]);
            }
        }

        // 2. Local user login (only when OAuth is disabled)
        if (!config('auth.oauth_enabled')) {
            $user = User::where('email', $request->username)->first();

            if ($user && $user->password && Hash::check($request->password, $user->password)) {
                auth()->login($user);
                if ($request->hasSession()) {
                    $request->session()->regenerate();
                }

                return response()->json([
                    'data' => new UserResource($user),
                    'message' => 'Logged in successfully.',
                    'must_change_password' => $user->must_change_password,
                ]);
            }
        }

        return response()->json(['message' => 'Invalid credentials.'], 401);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|max:255|confirmed',
        ]);

        $user = $request->user();

        if (!$user->password || !Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update([
            'password' => $request->new_password,
            'must_change_password' => false,
        ]);

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'Password changed successfully.',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        auth()->guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully.']);
    }
}
