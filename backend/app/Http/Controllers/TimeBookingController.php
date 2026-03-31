<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreTimeBookingsRequest;
use App\Http\Resources\TimeBookingResource;
use App\Models\Absence;
use App\Models\Setting;
use App\Models\TimeBooking;
use App\Models\TimeEntry;
use App\Models\TimeLock;
use App\Models\Vacation;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class TimeBookingController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        $bookings = $request->user()
            ->timeBookings()
            ->with('costCenter')
            ->whereBetween('date', [$request->from, $request->to])
            ->orderBy('date')
            ->get();

        return TimeBookingResource::collection($bookings);
    }

    public function store(StoreTimeBookingsRequest $request, string $date): JsonResponse
    {
        $user = $request->user();
        $dateCarbon = Carbon::parse($date);

        if ($this->isLockedForUser($dateCarbon)) {
            return response()->json(['message' => 'This date is locked and cannot be edited.'], 403);
        }

        $hasFullDayAbsence = Absence::where('user_id', $user->id)
            ->whereIn('status', ['acknowledged', 'approved', 'admin_created'])
            ->where('scope', 'full_day')
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->exists();
        if ($hasFullDayAbsence) {
            return response()->json(['message' => 'Cannot book time on a day with a full-day absence.'], 422);
        }

        $hasVacation = Vacation::where('user_id', $user->id)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->exists();
        if ($hasVacation) {
            return response()->json(['message' => 'Cannot book time on a vacation day.'], 422);
        }

        $hasTimeEntry = TimeEntry::where('user_id', $user->id)
            ->whereDate('date', $date)
            ->exists();
        if (!$hasTimeEntry) {
            return response()->json(['message' => 'You must record working hours before booking time.'], 422);
        }

        // Check that all cost centers are available to the user
        $available = $user->availableCostCenters()->pluck('id')->toArray();
        foreach ($request->bookings as $booking) {
            if (!in_array((int) $booking['cost_center_id'], $available, true)) {
                return response()->json([
                    'message' => 'Cost center ' . $booking['cost_center_id'] . ' is not available to you.',
                ], 422);
            }
        }

        // Check that user is not booking to system cost centers manually
        $systemCodes = ['VACATION', 'ILLNESS', 'SPECIAL_LEAVE', 'HOLIDAY'];
        $systemIds = \App\Models\CostCenter::whereIn('code', $systemCodes)->pluck('id')->toArray();
        foreach ($request->bookings as $booking) {
            if (in_array((int) $booking['cost_center_id'], $systemIds, true)) {
                return response()->json([
                    'message' => 'System cost centers cannot be booked manually.',
                ], 422);
            }
        }

        // Replace all bookings for this day (except system-booked ones) in a transaction
        $created = DB::transaction(function () use ($user, $date, $systemIds, $request) {
            TimeBooking::where('user_id', $user->id)
                ->whereDate('date', $date)
                ->whereNotIn('cost_center_id', $systemIds)
                ->delete();

            $entries = [];
            foreach ($request->bookings as $booking) {
                $entries[] = TimeBooking::create([
                    'user_id' => $user->id,
                    'date' => $date,
                    'cost_center_id' => $booking['cost_center_id'],
                    'percentage' => $booking['percentage'],
                    'comment' => $booking['comment'] ?? null,
                ]);
            }

            return $entries;
        });

        $collection = new \Illuminate\Database\Eloquent\Collection($created);

        return response()->json([
            'data' => TimeBookingResource::collection(
                $collection->load('costCenter')
            ),
            'message' => 'Time bookings saved.',
        ]);
    }

    private function isLockedForUser(Carbon $date): bool
    {
        $lock = TimeLock::where('year', $date->year)->where('month', $date->month)->first();
        if ($lock) {
            return true;
        }

        $autoLockDays = (int) Setting::get('time_booking_auto_lock_days', '30');
        if ($autoLockDays > 0 && $date->copy()->addDays($autoLockDays)->lt(Carbon::today())) {
            return true;
        }

        return false;
    }
}
