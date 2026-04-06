<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\VacationScope;
use App\Models\Absence;
use App\Models\BlackoutPeriod;
use App\Models\Holiday;
use App\Models\Setting;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\Vacation;
use App\Models\WorkTimeAccountEntry;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class WorkTimeAccountLedgerService
{
    public function buildForYear(User $user, int $year): Collection
    {
        $from = Carbon::create($year, 1, 1)->startOfDay();
        $to = Carbon::create($year, 12, 31)->endOfDay();
        $context = $this->buildLedgerContext($user, $from, $to);

        $openingBalance = $this->calculateOpeningBalance($user, $from);
        $rows = collect();

        if ($openingBalance !== 0) {
            $rows->push([
                'id' => sprintf('opening-%d', $year),
                'user_id' => $user->id,
                'effective_date' => $from->toDateString(),
                'type' => 'opening_balance',
                'minutes_delta' => 0,
                'balance_after' => $openingBalance,
                'comment' => 'Opening balance from previous periods',
                'created_at' => $from->copy()->startOfDay()->toIso8601String(),
                'created_by' => null,
                'created_by_name' => null,
                'source_type' => 'opening_balance',
                'source_id' => null,
            ]);
        }

        $events = $this->buildCoverageEvents($user, $from, $to, $context)
            ->merge($this->buildWorkedEvents($user, $from, $to, $context))
            ->merge($this->buildManualEvents($user, $from, $to))
            ->sort(function (array $left, array $right): int {
                return [$left['effective_date'], $left['created_at'], $left['type'], (string) $left['id']]
                    <=> [$right['effective_date'], $right['created_at'], $right['type'], (string) $right['id']];
            })
            ->values();

        $balance = $openingBalance;
        foreach ($events as $event) {
            $balance += (int) $event['minutes_delta'];
            $event['balance_after'] = $balance;
            $rows->push($event);
        }

        return $rows;
    }

    private function calculateOpeningBalance(User $user, Carbon $from): int
    {
        $previousEntries = TimeEntry::query()
            ->where('user_id', $user->id)
            ->whereDate('date', '<', $from->toDateString())
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        $worked = 0;
        if ($previousEntries->isNotEmpty()) {
            $context = $this->buildLedgerContext(
                $user,
                Carbon::parse($previousEntries->first()->date)->startOfDay(),
                Carbon::parse($previousEntries->last()->date)->endOfDay(),
            );

            $worked = (int) $previousEntries->sum(function (TimeEntry $entry) use ($context): int {
                $date = $entry->date instanceof Carbon ? $entry->date->copy() : Carbon::parse($entry->date);
                $targetMinutes = $this->getTargetMinutesForDate($context, $date);
                return $entry->getNetMinutes() - $targetMinutes;
            });
        }

        $manual = WorkTimeAccountEntry::query()
            ->where('user_id', $user->id)
            ->whereDate('effective_date', '<', $from->toDateString())
            ->sum('minutes_delta');

        return (int) $worked + (int) $manual;
    }

    private function buildWorkedEvents(User $user, Carbon $from, Carbon $to, array $context): Collection
    {
        return TimeEntry::query()
            ->where('user_id', $user->id)
            ->whereDate('date', '>=', $from->toDateString())
            ->whereDate('date', '<=', $to->toDateString())
            ->orderBy('date')
            ->orderBy('id')
            ->get()
            ->map(function (TimeEntry $entry) use ($user, $context): array {
                $date = $entry->date instanceof Carbon ? $entry->date->copy() : Carbon::parse($entry->date);
                $targetMinutes = $this->getTargetMinutesForDate($context, $date);
                $netMinutes = $entry->getNetMinutes();
                $delta = $netMinutes - $targetMinutes;

                return [
                    'id' => sprintf('worked-%d', $entry->id),
                    'user_id' => $user->id,
                    'effective_date' => $date->toDateString(),
                    'type' => 'worked',
                    'minutes_delta' => $delta,
                    'comment' => sprintf('Worked %d min vs target %d min', $netMinutes, $targetMinutes),
                    'created_at' => $entry->updated_at?->toIso8601String() ?? $entry->created_at?->toIso8601String(),
                    'created_by' => null,
                    'created_by_name' => null,
                    'source_type' => 'time_entry',
                    'source_id' => $entry->id,
                ];
            })
            ->filter(fn (array $event): bool => $event['minutes_delta'] !== 0)
            ->values();
    }

    private function buildManualEvents(User $user, Carbon $from, Carbon $to): Collection
    {
        return WorkTimeAccountEntry::query()
            ->with('creator:id,display_name')
            ->where('user_id', $user->id)
            ->whereDate('effective_date', '>=', $from->toDateString())
            ->whereDate('effective_date', '<=', $to->toDateString())
            ->orderBy('effective_date')
            ->orderBy('created_at')
            ->get()
            ->map(fn (WorkTimeAccountEntry $entry): array => [
                'id' => $entry->id,
                'user_id' => $entry->user_id,
                'effective_date' => $entry->effective_date->toDateString(),
                'type' => $entry->type,
                'minutes_delta' => $entry->minutes_delta,
                'comment' => $entry->comment,
                'created_at' => $entry->created_at->toIso8601String(),
                'created_by' => $entry->created_by,
                'created_by_name' => $entry->creator?->display_name,
                'source_type' => 'manual',
                'source_id' => $entry->id,
            ]);
    }

    private function buildCoverageEvents(User $user, Carbon $from, Carbon $to, array $context): Collection
    {
        return $this->coverageCandidateDateKeys($context)
            ->map(function (string $dateKey) use ($context): ?array {
                return $this->getCoverageEventForDate($context, Carbon::parse($dateKey)->startOfDay());
            })
            ->filter()
            ->values();
    }

    private function getTargetMinutesForDate(array $context, Carbon $date): int
    {
        $day = $this->getContextDay($context, $date);
        if ($day === null || !$day['is_work_day'] || $day['company_holiday'] !== null) {
            return 0;
        }

        $dailyTarget = $day['daily_target_minutes'];

        if ($day['full_day_absence'] !== null || $day['full_day_vacation'] !== null) {
            return 0;
        }

        if ($day['half_day_absence'] !== null || $day['half_day_vacation'] !== null) {
            return (int) round($dailyTarget / 2);
        }

        return $dailyTarget;
    }

    private function getCoverageEventForDate(array $context, Carbon $date): ?array
    {
        $day = $this->getContextDay($context, $date);
        if ($day === null || !$day['is_planned_work_day']) {
            return null;
        }

        $dailyTarget = $day['daily_target_minutes'];

        $companyHoliday = $day['company_holiday'];
        if ($companyHoliday !== null) {
            return $this->makeCoverageEvent(
                id: sprintf('company-holiday-%d-%s', $companyHoliday->id, $date->toDateString()),
                userId: $context['user_id'],
                date: $date,
                type: 'company_holiday_credit',
                comment: sprintf('Company holiday fulfilled target time (%d min)', $dailyTarget),
                sourceType: 'blackout_period',
                sourceId: $companyHoliday->id,
                createdAt: $companyHoliday->updated_at ?? $companyHoliday->created_at ?? $date->copy()->startOfDay(),
            );
        }

        $holiday = $day['holiday'];
        if ($holiday !== null) {
            return $this->makeCoverageEvent(
                id: sprintf('holiday-%d-%s', $holiday->id, $date->toDateString()),
                userId: $context['user_id'],
                date: $date,
                type: 'holiday_credit',
                comment: sprintf('Holiday "%s" fulfilled target time (%d min)', $holiday->name, $dailyTarget),
                sourceType: 'holiday',
                sourceId: $holiday->id,
                createdAt: $holiday->updated_at ?? $holiday->created_at ?? $date->copy()->startOfDay(),
            );
        }

        $fullDayAbsence = $day['full_day_absence'];
        if ($fullDayAbsence !== null) {
            return $this->makeCoverageEvent(
                id: sprintf('absence-%d-%s', $fullDayAbsence->id, $date->toDateString()),
                userId: $context['user_id'],
                date: $date,
                type: 'absence_credit',
                comment: sprintf('%s fulfilled target time (%d min)', $this->formatAbsenceType($fullDayAbsence), $dailyTarget),
                sourceType: 'absence',
                sourceId: $fullDayAbsence->id,
                createdAt: $fullDayAbsence->updated_at ?? $fullDayAbsence->created_at ?? $date->copy()->startOfDay(),
            );
        }

        $fullDayVacation = $day['full_day_vacation'];
        if ($fullDayVacation !== null) {
            return $this->makeCoverageEvent(
                id: sprintf('vacation-%d-%s', $fullDayVacation->id, $date->toDateString()),
                userId: $context['user_id'],
                date: $date,
                type: 'vacation_credit',
                comment: sprintf('Approved vacation fulfilled target time (%d min)', $dailyTarget),
                sourceType: 'vacation',
                sourceId: $fullDayVacation->id,
                createdAt: $fullDayVacation->updated_at ?? $fullDayVacation->created_at ?? $date->copy()->startOfDay(),
            );
        }

        $halfDayAbsence = $day['half_day_absence'];
        if ($halfDayAbsence !== null) {
            $halfTarget = (int) round($dailyTarget / 2);

            return $this->makeCoverageEvent(
                id: sprintf('half-absence-%d-%s', $halfDayAbsence->id, $date->toDateString()),
                userId: $context['user_id'],
                date: $date,
                type: 'half_day_absence_credit',
                comment: sprintf('%s reduced target time to %d min', $this->formatAbsenceType($halfDayAbsence), $halfTarget),
                sourceType: 'absence',
                sourceId: $halfDayAbsence->id,
                createdAt: $halfDayAbsence->updated_at ?? $halfDayAbsence->created_at ?? $date->copy()->startOfDay(),
            );
        }

        $halfDayVacation = $day['half_day_vacation'];
        if ($halfDayVacation !== null) {
            $halfTarget = (int) round($dailyTarget / 2);

            return $this->makeCoverageEvent(
                id: sprintf('half-vacation-%d-%s', $halfDayVacation->id, $date->toDateString()),
                userId: $context['user_id'],
                date: $date,
                type: 'half_day_vacation_credit',
                comment: sprintf('Half-day vacation reduced target time to %d min', $halfTarget),
                sourceType: 'vacation',
                sourceId: $halfDayVacation->id,
                createdAt: $halfDayVacation->updated_at ?? $halfDayVacation->created_at ?? $date->copy()->startOfDay(),
            );
        }

        return null;
    }

    private function buildLedgerContext(User $user, Carbon $from, Carbon $to): array
    {
        $defaultWeeklyTargetMinutes = (int) Setting::get('default_weekly_target_minutes', '2400');
        $defaultWorkDays = Setting::get('default_work_days', '[1,2,3,4,5]');
        $defaultWorkDays = is_string($defaultWorkDays) ? json_decode($defaultWorkDays, true) : $defaultWorkDays;
        if (!is_array($defaultWorkDays) || $defaultWorkDays === []) {
            $defaultWorkDays = [1, 2, 3, 4, 5];
        }

        $schedules = $user->workSchedules()
            ->where('start_date', '<=', $to->toDateString())
            ->where(function ($query) use ($from) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', $from->toDateString());
            })
            ->orderBy('start_date')
            ->get();

        $companyHolidayMap = $this->expandDateRanges(
            BlackoutPeriod::query()
                ->where('type', 'company_holiday')
                ->whereDate('start_date', '<=', $to->toDateString())
                ->whereDate('end_date', '>=', $from->toDateString())
                ->orderBy('start_date')
                ->get(),
            $from,
            $to,
            'start_date',
            'end_date',
        );

        $holidayMap = $user->holidays_exempt
            ? []
            : Holiday::query()
                ->whereDate('date', '>=', $from->toDateString())
                ->whereDate('date', '<=', $to->toDateString())
                ->get()
                ->keyBy(fn (Holiday $holiday): string => $holiday->date->toDateString())
                ->all();

        $effectiveAbsences = Absence::query()
            ->where('user_id', $user->id)
            ->whereIn('status', ['acknowledged', 'approved', 'admin_created'])
            ->whereDate('start_date', '<=', $to->toDateString())
            ->whereDate('end_date', '>=', $from->toDateString())
            ->orderBy('start_date')
            ->get();

        $approvedVacations = Vacation::query()
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $to->toDateString())
            ->whereDate('end_date', '>=', $from->toDateString())
            ->orderBy('start_date')
            ->get();

        $fullDayAbsenceMap = $this->expandDateRanges(
            $effectiveAbsences->filter(fn (Absence $absence): bool => $absence->scope === VacationScope::FullDay->value || $absence->scope->value === 'full_day'),
            $from,
            $to,
            'start_date',
            'end_date',
        );
        $halfDayAbsenceMap = $this->expandDateRanges(
            $effectiveAbsences->filter(fn (Absence $absence): bool => in_array($absence->scope->value, ['morning', 'afternoon'], true)),
            $from,
            $to,
            'start_date',
            'end_date',
        );
        $fullDayVacationMap = $this->expandDateRanges(
            $approvedVacations->filter(fn (Vacation $vacation): bool => $vacation->scope === VacationScope::FullDay),
            $from,
            $to,
            'start_date',
            'end_date',
        );
        $halfDayVacationMap = $this->expandDateRanges(
            $approvedVacations->filter(fn (Vacation $vacation): bool => in_array($vacation->scope, [VacationScope::Morning, VacationScope::Afternoon], true)),
            $from,
            $to,
            'start_date',
            'end_date',
        );

        return [
            'user_id' => $user->id,
            'default_weekly_target_minutes' => $defaultWeeklyTargetMinutes,
            'default_work_days' => $defaultWorkDays,
            'holidays_exempt' => $user->holidays_exempt,
            'weekend_worker' => $user->weekend_worker,
            'schedules' => $schedules,
            'company_holiday_map' => $companyHolidayMap,
            'holiday_map' => $holidayMap,
            'full_day_absence_map' => $fullDayAbsenceMap,
            'half_day_absence_map' => $halfDayAbsenceMap,
            'full_day_vacation_map' => $fullDayVacationMap,
            'half_day_vacation_map' => $halfDayVacationMap,
        ];
    }

    private function coverageCandidateDateKeys(array $context): Collection
    {
        return collect([
            ...array_keys($context['company_holiday_map']),
            ...array_keys($context['holiday_map']),
            ...array_keys($context['full_day_absence_map']),
            ...array_keys($context['half_day_absence_map']),
            ...array_keys($context['full_day_vacation_map']),
            ...array_keys($context['half_day_vacation_map']),
        ])->unique()->sort()->values();
    }

    /**
     * @param Collection<int, object> $items
     * @return array<string, object>
     */
    private function expandDateRanges(
        Collection $items,
        Carbon $from,
        Carbon $to,
        string $startProperty,
        string $endProperty,
    ): array {
        $map = [];

        foreach ($items as $item) {
            $start = Carbon::parse($item->{$startProperty})->startOfDay();
            $end = Carbon::parse($item->{$endProperty})->startOfDay();

            if ($start->lt($from)) {
                $start = $from->copy()->startOfDay();
            }
            if ($end->gt($to)) {
                $end = $to->copy()->startOfDay();
            }

            $cursor = $start->copy();
            while ($cursor->lte($end)) {
                $dateKey = $cursor->toDateString();
                $map[$dateKey] ??= $item;
                $cursor->addDay();
            }
        }

        return $map;
    }

    private function resolveScheduleForDate(Collection $schedules, Carbon $date): ?\App\Models\WorkSchedule
    {
        $activeSchedule = null;

        foreach ($schedules as $schedule) {
            if ($schedule->start_date->gt($date)) {
                continue;
            }

            if ($schedule->end_date !== null && $schedule->end_date->lt($date)) {
                continue;
            }

            $activeSchedule = $schedule;
        }

        return $activeSchedule;
    }

    private function getContextDay(array $context, Carbon $date): ?array
    {
        $dateKey = $date->toDateString();
        $schedule = $this->resolveScheduleForDate($context['schedules'], $date);
        $configuredWorkDays = $schedule?->work_days;
        if (!is_array($configuredWorkDays) || $configuredWorkDays === []) {
            $configuredWorkDays = $context['default_work_days'];
        }

        $workDaysCount = count($configuredWorkDays) ?: 1;
        $dailyTargetMinutes = (int) round(($schedule?->weekly_target_minutes ?? $context['default_weekly_target_minutes']) / $workDaysCount);
        $dayOfWeek = (int) $date->dayOfWeekIso;
        $isPlannedWorkDay = in_array($dayOfWeek, $configuredWorkDays, true)
            || ($context['weekend_worker'] && in_array($dayOfWeek, [6, 7], true));

        return [
            'daily_target_minutes' => $dailyTargetMinutes,
            'is_planned_work_day' => $isPlannedWorkDay,
            'is_work_day' => $isPlannedWorkDay && ($context['holidays_exempt'] || !isset($context['holiday_map'][$dateKey])),
            'company_holiday' => $context['company_holiday_map'][$dateKey] ?? null,
            'holiday' => $context['holiday_map'][$dateKey] ?? null,
            'full_day_absence' => $context['full_day_absence_map'][$dateKey] ?? null,
            'half_day_absence' => $context['half_day_absence_map'][$dateKey] ?? null,
            'full_day_vacation' => $context['full_day_vacation_map'][$dateKey] ?? null,
            'half_day_vacation' => $context['half_day_vacation_map'][$dateKey] ?? null,
        ];
    }

    private function makeCoverageEvent(
        string $id,
        int $userId,
        Carbon $date,
        string $type,
        string $comment,
        string $sourceType,
        int $sourceId,
        Carbon|string $createdAt,
    ): array {
        return [
            'id' => $id,
            'user_id' => $userId,
            'effective_date' => $date->toDateString(),
            'type' => $type,
            'minutes_delta' => 0,
            'comment' => $comment,
            'created_at' => $createdAt instanceof Carbon ? $createdAt->toIso8601String() : $createdAt,
            'created_by' => null,
            'created_by_name' => null,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
        ];
    }

    private function formatAbsenceType(Absence $absence): string
    {
        return match ((string) $absence->type->value) {
            'illness' => 'Illness',
            'special_leave' => 'Special leave',
            default => ucfirst((string) $absence->type->value),
        };
    }
}
