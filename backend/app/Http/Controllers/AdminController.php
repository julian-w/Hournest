<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\LedgerEntryType;
use App\Enums\VacationStatus;
use App\Http\Requests\ReviewVacationRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Http\Resources\VacationResource;
use App\Models\User;
use App\Models\Vacation;
use App\Models\VacationLedgerEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

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

        // If approved, create a 'taken' ledger entry
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
        $user->update($request->validated());

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'User updated.',
        ]);
    }
}
