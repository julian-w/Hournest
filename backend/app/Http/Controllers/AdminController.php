<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\LedgerEntryType;
use App\Enums\UserRole;
use App\Enums\VacationStatus;
use App\Http\Requests\CreateUserRequest;
use App\Http\Requests\ReviewVacationRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Http\Resources\VacationResource;
use App\Models\TimeBooking;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\Vacation;
use App\Models\VacationLedgerEntry;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function pendingVacations(): AnonymousResourceCollection
    {
        $vacations = Vacation::with('user')
            ->where('status', VacationStatus::Pending)
            ->orderBy('created_at')
            ->get();

        return VacationResource::collection($vacations);
    }

    public function reviewVacation(ReviewVacationRequest $request, Vacation $vacation): JsonResponse
    {
        if ($vacation->status !== VacationStatus::Pending) {
            return response()->json([
                'message' => 'This vacation request has already been reviewed.',
            ], 422);
        }

        $vacation->update([
            'status' => $request->status,
            'comment' => $request->comment,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        // If approved, create a 'taken' ledger entry and clean up time data
        if ($vacation->status === VacationStatus::Approved) {
            $vacation->load('user');
            $workdays = $vacation->countWorkdays();

            // Determine the year (use start_date year)
            $year = $vacation->start_date->year;

            VacationLedgerEntry::create([
                'user_id' => $vacation->user_id,
                'year' => $year,
                'type' => LedgerEntryType::Taken,
                'days' => -$workdays,
                'comment' => sprintf(
                    'Vacation %s to %s',
                    $vacation->start_date->toDateString(),
                    $vacation->end_date->toDateString()
                ),
                'vacation_id' => $vacation->id,
            ]);

            // Clean up any existing time entries and bookings for vacation days
            $start = $vacation->start_date;
            $end = $vacation->end_date;

            TimeBooking::where('user_id', $vacation->user_id)
                ->whereDate('date', '>=', $start)
                ->whereDate('date', '<=', $end)
                ->delete();

            TimeEntry::where('user_id', $vacation->user_id)
                ->whereDate('date', '>=', $start)
                ->whereDate('date', '<=', $end)
                ->delete();
        }

        $vacation->load(['user', 'reviewer']);

        return response()->json([
            'data' => new VacationResource($vacation),
            'message' => 'Vacation request ' . $request->status . '.',
        ]);
    }

    public function users(): AnonymousResourceCollection
    {
        $users = User::orderBy('display_name')->get();

        return UserResource::collection($users);
    }

    public function updateUser(UpdateUserRequest $request, User $user): JsonResponse
    {
        if ($user->role === UserRole::Superadmin && $request->user()->role !== UserRole::Superadmin) {
            return response()->json(['message' => 'Cannot modify superadmin.'], 403);
        }

        $user->update($request->validated());

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'User updated.',
        ]);
    }

    public function createUser(CreateUserRequest $request): JsonResponse
    {
        $data = [
            'display_name' => $request->display_name,
            'email' => $request->email,
            'role' => $request->role,
            'vacation_days_per_year' => $request->vacation_days_per_year ?? 30,
        ];

        if ($request->password) {
            $data['password'] = $request->password;
            $data['must_change_password'] = true;
        }

        $user = User::create($data);

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'User created.',
        ], 201);
    }

    public function deleteUser(Request $request, User $user): JsonResponse
    {
        if ($user->role === UserRole::Superadmin) {
            return response()->json(['message' => 'Cannot delete superadmin.'], 403);
        }

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot delete yourself.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    public function resetUserPassword(Request $request, User $user): JsonResponse
    {
        if ($user->role === UserRole::Superadmin) {
            return response()->json(['message' => 'Cannot reset superadmin password.'], 403);
        }

        $request->validate([
            'password' => ['required', 'string', 'min:8', 'max:255'],
        ]);

        $user->update([
            'password' => $request->password,
            'must_change_password' => true,
        ]);

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'Password reset.',
        ]);
    }
}
