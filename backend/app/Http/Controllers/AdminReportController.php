<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\VacationScope;
use App\Enums\UserRole;
use App\Models\Absence;
    use App\Models\CostCenter;
    use App\Models\TimeBooking;
    use App\Models\TimeEntry;
    use App\Models\User;
    use App\Models\Vacation;
    use App\Models\BlackoutPeriod;
    use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminReportController extends Controller
{
    public function timeBookings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'group_by' => ['nullable', 'in:user,cost_center'],
        ]);

        $groupBy = $validated['group_by'] ?? 'user';
        $rows = TimeBooking::query()
            ->with(['user:id,display_name,email', 'costCenter:id,code,name'])
            ->whereDate('date', '>=', $validated['from'])
            ->whereDate('date', '<=', $validated['to'])
            ->get()
            ->map(function (TimeBooking $booking): array {
                $baseMinutes = $this->resolveBaseMinutesForBooking($booking);
                $derivedMinutes = (int) round($baseMinutes * ($booking->percentage / 100));

                return [
                    'user_id' => $booking->user_id,
                    'user_name' => $booking->user?->display_name,
                    'cost_center_id' => $booking->cost_center_id,
                    'cost_center_code' => $booking->costCenter?->code,
                    'cost_center_name' => $booking->costCenter?->name,
                    'percentage_points' => $booking->percentage,
                    'booked_minutes' => $derivedMinutes,
                ];
            })
            ->groupBy($groupBy === 'cost_center' ? 'cost_center_id' : 'user_id')
            ->map(function ($groupedRows) use ($groupBy): array {
                $first = $groupedRows->first();

                return [
                    'group_by' => $groupBy,
                    'group_key' => $groupBy === 'cost_center' ? $first['cost_center_id'] : $first['user_id'],
                    'label' => $groupBy === 'cost_center' ? $first['cost_center_name'] : $first['user_name'],
                    'code' => $groupBy === 'cost_center' ? $first['cost_center_code'] : null,
                    'percentage_points' => $groupedRows->sum('percentage_points'),
                    'booked_minutes' => $groupedRows->sum('booked_minutes'),
                ];
            })
            ->sortBy('label')
            ->values()
            ->all();

        return response()->json(['data' => $rows]);
    }

    public function missingEntries(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $users = User::query()
            ->where('role', UserRole::Employee)
            ->when(isset($validated['user_id']), fn ($query) => $query->whereKey($validated['user_id']))
            ->orderBy('display_name')
            ->get();

        $from = Carbon::parse($validated['from']);
        $to = Carbon::parse($validated['to']);
        $systemIds = CostCenter::query()->where('is_system', true)->pluck('id')->all();
        $rows = [];

        foreach ($users as $user) {
            for ($date = $from->copy(); $date->lte($to); $date->addDay()) {
                if (!$user->isWorkDay($date)) {
                    continue;
                }

                if (
                    $this->hasFullDayEffectiveAbsence($user->id, $date) ||
                    $this->hasFullDayApprovedVacation($user->id, $date) ||
                    $this->hasCompanyHoliday($date)
                ) {
                    continue;
                }

                $entry = TimeEntry::query()
                    ->where('user_id', $user->id)
                    ->whereDate('date', $date->toDateString())
                    ->first();

                $expectedPercentage = $this->expectedManualPercentage($user->id, $date);
                $actualPercentage = (int) TimeBooking::query()
                    ->where('user_id', $user->id)
                    ->whereDate('date', $date->toDateString())
                    ->whereNotIn('cost_center_id', $systemIds)
                    ->sum('percentage');

                if ($entry === null) {
                    $rows[] = [
                        'user_id' => $user->id,
                        'user_name' => $user->display_name,
                        'date' => $date->toDateString(),
                        'reason' => 'missing_time_entry',
                        'expected_percentage' => $expectedPercentage,
                        'actual_percentage' => $actualPercentage,
                        'has_time_entry' => false,
                    ];
                    continue;
                }

                if ($actualPercentage !== $expectedPercentage) {
                    $rows[] = [
                        'user_id' => $user->id,
                        'user_name' => $user->display_name,
                        'date' => $date->toDateString(),
                        'reason' => 'incomplete_booking',
                        'expected_percentage' => $expectedPercentage,
                        'actual_percentage' => $actualPercentage,
                        'has_time_entry' => true,
                    ];
                }
            }
        }

        return response()->json(['data' => $rows]);
    }

    public function export(Request $request): JsonResponse|StreamedResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'format' => ['required', 'in:csv'],
        ]);

        $rows = TimeBooking::query()
            ->with(['user:id,display_name,email', 'costCenter:id,code,name'])
            ->whereDate('date', '>=', $validated['from'])
            ->whereDate('date', '<=', $validated['to'])
            ->orderBy('date')
            ->orderBy('user_id')
            ->orderBy('cost_center_id')
            ->get();

        $filename = sprintf('time-bookings-%s-to-%s.csv', $validated['from'], $validated['to']);

        return response()->streamDownload(function () use ($rows): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['date', 'user_name', 'user_email', 'cost_center_code', 'cost_center_name', 'percentage', 'booked_minutes', 'comment']);

            foreach ($rows as $booking) {
                $baseMinutes = $this->resolveBaseMinutesForBooking($booking);

                fputcsv($handle, [
                    $booking->date->toDateString(),
                    $booking->user?->display_name,
                    $booking->user?->email,
                    $booking->costCenter?->code,
                    $booking->costCenter?->name,
                    $booking->percentage,
                    (int) round($baseMinutes * ($booking->percentage / 100)),
                    $booking->comment,
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function absences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'type' => ['nullable', 'in:illness,special_leave'],
            'status' => ['nullable', 'in:reported,acknowledged,pending,approved,rejected,admin_created'],
        ]);

        $rows = Absence::query()
            ->with('user:id,display_name')
            ->whereDate('start_date', '<=', $validated['to'])
            ->whereDate('end_date', '>=', $validated['from'])
            ->when(isset($validated['user_id']), fn ($query) => $query->where('user_id', $validated['user_id']))
            ->when(isset($validated['type']), fn ($query) => $query->where('type', $validated['type']))
            ->when(isset($validated['status']), fn ($query) => $query->where('status', $validated['status']))
            ->orderBy('start_date')
            ->orderBy('user_id')
            ->get()
            ->map(fn (Absence $absence): array => [
                'id' => $absence->id,
                'user_id' => $absence->user_id,
                'user_name' => $absence->user?->display_name,
                'type' => $absence->type->value,
                'scope' => $absence->scope->value,
                'status' => $absence->status->value,
                'start_date' => $absence->start_date->toDateString(),
                'end_date' => $absence->end_date->toDateString(),
                'comment' => $absence->comment,
                'admin_comment' => $absence->admin_comment,
            ])
            ->values()
            ->all();

        return response()->json(['data' => $rows]);
    }

    private function hasFullDayEffectiveAbsence(int $userId, Carbon $date): bool
    {
        return Absence::query()
            ->where('user_id', $userId)
            ->whereIn('status', ['acknowledged', 'approved', 'admin_created'])
            ->where('scope', 'full_day')
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->exists();
    }

    private function hasFullDayApprovedVacation(int $userId, Carbon $date): bool
    {
        return Vacation::query()
            ->where('user_id', $userId)
            ->where('status', 'approved')
            ->where('scope', VacationScope::FullDay)
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->exists();
    }

    private function expectedManualPercentage(int $userId, Carbon $date): int
    {
        $hasHalfDayAbsence = Absence::query()
            ->where('user_id', $userId)
            ->whereIn('status', ['acknowledged', 'approved', 'admin_created'])
            ->whereIn('scope', ['morning', 'afternoon'])
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->exists();

        $hasHalfDayVacation = Vacation::query()
            ->where('user_id', $userId)
            ->where('status', 'approved')
            ->whereIn('scope', [VacationScope::Morning, VacationScope::Afternoon])
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->exists();

        return ($hasHalfDayAbsence || $hasHalfDayVacation) ? 50 : 100;
    }

    private function calculateNetMinutes(TimeEntry $entry): int
    {
        $start = strtotime((string) $entry->start_time);
        $end = strtotime((string) $entry->end_time);
        $totalMinutes = (int) round(($end - $start) / 60);

        return max(0, $totalMinutes - (int) $entry->break_minutes);
    }

    private function hasCompanyHoliday(Carbon $date): bool
    {
        return BlackoutPeriod::query()
            ->where('type', 'company_holiday')
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->exists();
    }

    private function resolveBaseMinutesForBooking(TimeBooking $booking): int
    {
        $entry = TimeEntry::query()
            ->where('user_id', $booking->user_id)
            ->whereDate('date', $booking->date)
            ->first();

        if ($entry !== null) {
            return $this->calculateNetMinutes($entry);
        }

        $user = $booking->relationLoaded('user') ? $booking->user : User::find($booking->user_id);
        if ($user === null) {
            return 0;
        }

        return $user->getDailyTargetMinutes(Carbon::parse($booking->date));
    }
}
