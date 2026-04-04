<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreTimeEntryRequest;
use App\Http\Resources\TimeEntryResource;
use App\Models\Absence;
use App\Models\TimeBooking;
use App\Models\TimeEntry;
use App\Models\TimeLock;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use App\Models\Vacation;

class TimeEntryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        $entries = $request->user()
            ->timeEntries()
            ->whereBetween('date', [$request->from, $request->to])
            ->orderBy('date')
            ->get();

        return TimeEntryResource::collection($entries);
    }

    public function store(StoreTimeEntryRequest $request, string $date): JsonResponse
    {
        $user = $request->user();
        $dateCarbon = Carbon::parse($date);

        if ($this->isLockedForUser($user, $dateCarbon)) {
            return response()->json(['message' => 'This date is locked and cannot be edited.'], 403);
        }

        if (!$user->isWorkDay($dateCarbon)) {
            return response()->json(['message' => 'This is not a working day for you.'], 422);
        }

        $hasFullDayAbsence = Absence::where('user_id', $user->id)
            ->whereIn('status', ['acknowledged', 'approved', 'admin_created'])
            ->where('scope', 'full_day')
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->exists();
        if ($hasFullDayAbsence) {
            return response()->json(['message' => 'Cannot create time entry on a day with a full-day absence.'], 422);
        }

        $hasFullDayVacation = Vacation::where('user_id', $user->id)
            ->where('status', 'approved')
            ->where('scope', 'full_day')
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->exists();
        if ($hasFullDayVacation) {
            return response()->json(['message' => 'Cannot create time entry on a full-day vacation.'], 422);
        }

        $entry = TimeEntry::where('user_id', $user->id)
            ->whereDate('date', $date)
            ->first();

        if ($entry) {
            $entry->update($request->validated());
        } else {
            $entry = TimeEntry::create(array_merge(
                $request->validated(),
                ['user_id' => $user->id, 'date' => $date]
            ));
        }

        return response()->json([
            'data' => new TimeEntryResource($entry),
            'message' => 'Time entry saved.',
        ]);
    }

    public function destroy(Request $request, string $date): JsonResponse
    {
        $user = $request->user();
        $dateCarbon = Carbon::parse($date);

        if ($this->isLockedForUser($user, $dateCarbon)) {
            return response()->json(['message' => 'This date is locked and cannot be edited.'], 403);
        }

        $entry = TimeEntry::where('user_id', $user->id)->whereDate('date', $date)->first();
        if (!$entry) {
            return response()->json(['message' => 'Time entry not found.'], 404);
        }

        // Delete associated time bookings first
        TimeBooking::where('user_id', $user->id)->whereDate('date', $date)->delete();

        $entry->delete();

        return response()->json(['message' => 'Time entry deleted.']);
    }

    private function isLockedForUser($user, Carbon $date): bool
    {
        // Check manual lock
        $lock = TimeLock::where('year', $date->year)->where('month', $date->month)->first();
        if ($lock) {
            return true;
        }

        // Check auto-lock
        $autoLockDays = (int) Setting::get('time_booking_auto_lock_days', '30');
        if ($autoLockDays > 0 && $date->copy()->addDays($autoLockDays)->lt(Carbon::today())) {
            return true;
        }

        return false;
    }
}
