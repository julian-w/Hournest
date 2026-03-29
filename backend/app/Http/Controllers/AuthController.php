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
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('openid-connect')->redirect();
    }

    public function callback(): RedirectResponse
    {
        $oidcUser = Socialite::driver('openid-connect')->user();

        $adminEmails = array_filter(array_map('trim', explode(',', config('auth.admin_emails', ''))));
        $role = in_array($oidcUser->getEmail(), $adminEmails, true) ? UserRole::Admin : UserRole::Employee;

        $user = User::updateOrCreate(
            ['synology_id' => $oidcUser->getId()],
            [
                'email' => $oidcUser->getEmail(),
                'display_name' => $oidcUser->getName() ?? $oidcUser->getEmail(),
                'role' => $role,
            ]
        );

        auth()->login($user);

        return redirect(config('app.frontend_url', 'http://localhost:4200'));
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $superadminUsername = config('auth.superadmin.username');
        $superadminPassword = config('auth.superadmin.password');

        if (!$superadminUsername || !$superadminPassword) {
            return response()->json(['message' => 'Superadmin login not configured.'], 403);
        }

        try {
            $passwordValid = Hash::check($request->password, $superadminPassword);
        } catch (\RuntimeException) {
            $passwordValid = false;
        }

        if ($request->username !== $superadminUsername || !$passwordValid) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $user = User::firstOrCreate(
            ['email' => 'superadmin@hournest.local'],
            [
                'display_name' => 'Superadmin',
                'role' => UserRole::Superadmin,
                'vacation_days_per_year' => 0,
                'synology_id' => 'superadmin-local',
            ]
        );

        if ($user->role !== UserRole::Superadmin) {
            $user->update(['role' => UserRole::Superadmin]);
        }

        auth()->login($user);

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'Logged in successfully.',
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
