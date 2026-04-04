<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\TimeBookingResource;
use App\Http\Resources\TimeEntryResource;
use App\Http\Resources\TimeLockResource;
use App\Models\TimeBooking;
use App\Models\TimeEntry;
use App\Models\TimeLock;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimeBookingAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        $user = User::findOrFail($request->user_id);

        $entries = $user->timeEntries()
            ->whereBetween('date', [$request->from, $request->to])
            ->orderBy('date')
            ->get();

        $bookings = $user->timeBookings()
            ->with('costCenter')
            ->whereBetween('date', [$request->from, $request->to])
            ->orderBy('date')
            ->get();

        return response()->json([
            'data' => [
                'time_entries' => TimeEntryResource::collection($entries),
                'time_bookings' => TimeBookingResource::collection($bookings),
            ],
        ]);
    }

    public function storeEntry(Request $request, int $userId, string $date): JsonResponse
    {
        $request->validate([
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'break_minutes' => ['required', 'integer', 'min:0', 'max:480'],
        ]);

        $user = User::findOrFail($userId);

        $entry = TimeEntry::updateOrCreate(
            ['user_id' => $user->id, 'date' => $date],
            $request->only(['start_time', 'end_time', 'break_minutes'])
        );

        return response()->json([
            'data' => new TimeEntryResource($entry),
            'message' => 'Time entry saved.',
        ]);
    }

    public function storeBookings(Request $request, int $userId, string $date): JsonResponse
    {
        $request->validate([
            'bookings' => ['required', 'array', 'min:1'],
            'bookings.*.cost_center_id' => ['required', 'integer', 'exists:cost_centers,id'],
            'bookings.*.percentage' => ['required', 'integer', 'min:5', 'max:100'],
            'bookings.*.comment' => ['nullable', 'string', 'max:500'],
        ]);

        $user = User::findOrFail($userId);

        $bookings = $request->input('bookings', []);
        $total = array_sum(array_column($bookings, 'percentage'));
        if ($total !== 100) {
            return response()->json(['message' => 'Percentages must sum to exactly 100%.'], 422);
        }

        $ids = array_column($bookings, 'cost_center_id');
        if (count($ids) !== count(array_unique($ids))) {
            return response()->json(['message' => 'Duplicate cost centers are not allowed.'], 422);
        }

        foreach ($bookings as $booking) {
            if ($booking['percentage'] % 5 !== 0) {
                return response()->json(['message' => 'Percentages must be multiples of 5.'], 422);
            }
        }

        // Admin can book to any cost center including system ones
        TimeBooking::where('user_id', $user->id)->whereDate('date', $date)->delete();

        $created = [];
        foreach ($request->bookings as $booking) {
            $created[] = TimeBooking::create([
                'user_id' => $user->id,
                'date' => $date,
                'cost_center_id' => $booking['cost_center_id'],
                'percentage' => $booking['percentage'],
                'comment' => $booking['comment'] ?? null,
            ]);
        }

        $collection = new \Illuminate\Database\Eloquent\Collection($created);

        return response()->json([
            'data' => TimeBookingResource::collection(
                $collection->load('costCenter')
            ),
            'message' => 'Time bookings saved.',
        ]);
    }

    public function locks(): JsonResponse
    {
        $locks = TimeLock::with('lockedByUser')
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->get();

        return response()->json([
            'data' => TimeLockResource::collection($locks),
        ]);
    }

    public function toggleLock(Request $request): JsonResponse
    {
        $request->validate([
            'year' => ['required', 'integer', 'min:2020'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $lock = TimeLock::where('year', $request->year)
            ->where('month', $request->month)
            ->first();

        if ($lock) {
            $lock->delete();
            return response()->json(['message' => 'Period unlocked.']);
        }

        TimeLock::create([
            'year' => $request->year,
            'month' => $request->month,
            'locked_by' => $request->user()->id,
            'locked_at' => now(),
        ]);

        return response()->json(['message' => 'Period locked.'], 201);
    }

    public function userCostCenters(User $user): JsonResponse
    {
        $direct = $user->costCenters()->get();

        return response()->json([
            'data' => \App\Http\Resources\CostCenterResource::collection($direct),
        ]);
    }

    public function setUserCostCenters(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'cost_center_ids' => ['required', 'array'],
            'cost_center_ids.*' => ['integer', 'exists:cost_centers,id'],
        ]);

        $user->costCenters()->sync($request->cost_center_ids);

        return response()->json([
            'data' => \App\Http\Resources\CostCenterResource::collection($user->costCenters()->get()),
            'message' => 'User cost centers updated.',
        ]);
    }
}
