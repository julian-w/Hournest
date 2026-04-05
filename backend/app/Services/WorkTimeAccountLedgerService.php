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

        $events = $this->buildCoverageEvents($user, $from, $to)
            ->merge($this->buildWorkedEvents($user, $from, $to))
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
        $worked = $this->buildWorkedEvents($user, Carbon::create(2000, 1, 1), $from->copy()->subDay())
            ->sum('minutes_delta');

        $manual = WorkTimeAccountEntry::query()
            ->where('user_id', $user->id)
            ->whereDate('effective_date', '<', $from->toDateString())
            ->sum('minutes_delta');

        return (int) $worked + (int) $manual;
    }

    private function buildWorkedEvents(User $user, Carbon $from, Carbon $to): Collection
    {
        return TimeEntry::query()
            ->where('user_id', $user->id)
            ->whereDate('date', '>=', $from->toDateString())
            ->whereDate('date', '<=', $to->toDateString())
            ->orderBy('date')
            ->orderBy('id')
            ->get()
            ->map(function (TimeEntry $entry) use ($user): array {
                $targetMinutes = $this->getTargetMinutesForDate($user, Carbon::parse($entry->date));
                $netMinutes = $entry->getNetMinutes();
                $delta = $netMinutes - $targetMinutes;

                return [
                    'id' => sprintf('worked-%d', $entry->id),
                    'user_id' => $user->id,
                    'effective_date' => $entry->date->toDateString(),
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

    private function buildCoverageEvents(User $user, Carbon $from, Carbon $to): Collection
    {
        $events = collect();
        $cursor = $from->copy()->startOfDay();

        while ($cursor->lte($to)) {
            $event = $this->getCoverageEventForDate($user, $cursor);
            if ($event !== null) {
                $events->push($event);
            }

            $cursor->addDay();
        }

        return $events;
    }

    private function getTargetMinutesForDate(User $user, Carbon $date): int
    {
        if (!$user->isWorkDay($date) || $this->hasCompanyHoliday($date)) {
            return 0;
        }

        $dailyTarget = $user->getDailyTargetMinutes($date);

        if ($this->hasFullDayEffectiveAbsence($user->id, $date) || $this->hasFullDayApprovedVacation($user->id, $date)) {
            return 0;
        }

        if ($this->hasHalfDayEffectiveAbsence($user->id, $date) || $this->hasHalfDayApprovedVacation($user->id, $date)) {
            return (int) round($dailyTarget / 2);
        }

        return $dailyTarget;
    }

    private function getCoverageEventForDate(User $user, Carbon $date): ?array
    {
        if (!$this->isPlannedWorkDay($user, $date)) {
            return null;
        }

        $dailyTarget = $user->getDailyTargetMinutes($date);

        $companyHoliday = $this->getCompanyHoliday($date);
        if ($companyHoliday !== null) {
            return $this->makeCoverageEvent(
                id: sprintf('company-holiday-%d-%s', $companyHoliday->id, $date->toDateString()),
                userId: $user->id,
                date: $date,
                type: 'company_holiday_credit',
                comment: sprintf('Company holiday fulfilled target time (%d min)', $dailyTarget),
                sourceType: 'blackout_period',
                sourceId: $companyHoliday->id,
                createdAt: $companyHoliday->updated_at ?? $companyHoliday->created_at ?? $date->copy()->startOfDay(),
            );
        }

        $holiday = $this->getHolidayForUser($user, $date);
        if ($holiday !== null) {
            return $this->makeCoverageEvent(
                id: sprintf('holiday-%d-%s', $holiday->id, $date->toDateString()),
                userId: $user->id,
                date: $date,
                type: 'holiday_credit',
                comment: sprintf('Holiday "%s" fulfilled target time (%d min)', $holiday->name, $dailyTarget),
                sourceType: 'holiday',
                sourceId: $holiday->id,
                createdAt: $holiday->updated_at ?? $holiday->created_at ?? $date->copy()->startOfDay(),
            );
        }

        $fullDayAbsence = $this->getFullDayEffectiveAbsence($user->id, $date);
        if ($fullDayAbsence !== null) {
            return $this->makeCoverageEvent(
                id: sprintf('absence-%d-%s', $fullDayAbsence->id, $date->toDateString()),
                userId: $user->id,
                date: $date,
                type: 'absence_credit',
                comment: sprintf('%s fulfilled target time (%d min)', $this->formatAbsenceType($fullDayAbsence), $dailyTarget),
                sourceType: 'absence',
                sourceId: $fullDayAbsence->id,
                createdAt: $fullDayAbsence->updated_at ?? $fullDayAbsence->created_at ?? $date->copy()->startOfDay(),
            );
        }

        $fullDayVacation = $this->getFullDayApprovedVacation($user->id, $date);
        if ($fullDayVacation !== null) {
            return $this->makeCoverageEvent(
                id: sprintf('vacation-%d-%s', $fullDayVacation->id, $date->toDateString()),
                userId: $user->id,
                date: $date,
                type: 'vacation_credit',
                comment: sprintf('Approved vacation fulfilled target time (%d min)', $dailyTarget),
                sourceType: 'vacation',
                sourceId: $fullDayVacation->id,
                createdAt: $fullDayVacation->updated_at ?? $fullDayVacation->created_at ?? $date->copy()->startOfDay(),
            );
        }

        $halfDayAbsence = $this->getHalfDayEffectiveAbsence($user->id, $date);
        if ($halfDayAbsence !== null) {
            $halfTarget = (int) round($dailyTarget / 2);

            return $this->makeCoverageEvent(
                id: sprintf('half-absence-%d-%s', $halfDayAbsence->id, $date->toDateString()),
                userId: $user->id,
                date: $date,
                type: 'half_day_absence_credit',
                comment: sprintf('%s reduced target time to %d min', $this->formatAbsenceType($halfDayAbsence), $halfTarget),
                sourceType: 'absence',
                sourceId: $halfDayAbsence->id,
                createdAt: $halfDayAbsence->updated_at ?? $halfDayAbsence->created_at ?? $date->copy()->startOfDay(),
            );
        }

        $halfDayVacation = $this->getHalfDayApprovedVacation($user->id, $date);
        if ($halfDayVacation !== null) {
            $halfTarget = (int) round($dailyTarget / 2);

            return $this->makeCoverageEvent(
                id: sprintf('half-vacation-%d-%s', $halfDayVacation->id, $date->toDateString()),
                userId: $user->id,
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

    private function isPlannedWorkDay(User $user, Carbon $date): bool
    {
        $dayOfWeek = (int) $date->dayOfWeekIso;
        $schedule = $user->getActiveWorkSchedule($date);

        if ($schedule !== null) {
            $workDays = $schedule->work_days;
        } else {
            $defaultWorkDays = Setting::get('default_work_days', '[1,2,3,4,5]');
            $workDays = is_string($defaultWorkDays) ? json_decode($defaultWorkDays, true) : $defaultWorkDays;
            if (!is_array($workDays)) {
                $workDays = [1, 2, 3, 4, 5];
            }
        }

        if (in_array($dayOfWeek, $workDays, true)) {
            return true;
        }

        return $user->weekend_worker && in_array($dayOfWeek, [6, 7], true);
    }

    private function hasCompanyHoliday(Carbon $date): bool
    {
        return BlackoutPeriod::query()
            ->where('type', 'company_holiday')
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->exists();
    }

    private function getCompanyHoliday(Carbon $date): ?BlackoutPeriod
    {
        return BlackoutPeriod::query()
            ->where('type', 'company_holiday')
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->orderBy('start_date')
            ->first();
    }

    private function getHolidayForUser(User $user, Carbon $date): ?Holiday
    {
        if ($user->holidays_exempt) {
            return null;
        }

        return Holiday::query()
            ->whereDate('date', $date->toDateString())
            ->first();
    }

    private function hasFullDayEffectiveAbsence(int $userId, Carbon $date): bool
    {
        return $this->getFullDayEffectiveAbsence($userId, $date) !== null;
    }

    private function getFullDayEffectiveAbsence(int $userId, Carbon $date): ?Absence
    {
        return Absence::query()
            ->where('user_id', $userId)
            ->whereIn('status', ['acknowledged', 'approved', 'admin_created'])
            ->where('scope', 'full_day')
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->orderBy('start_date')
            ->first();
    }

    private function hasHalfDayEffectiveAbsence(int $userId, Carbon $date): bool
    {
        return $this->getHalfDayEffectiveAbsence($userId, $date) !== null;
    }

    private function getHalfDayEffectiveAbsence(int $userId, Carbon $date): ?Absence
    {
        return Absence::query()
            ->where('user_id', $userId)
            ->whereIn('status', ['acknowledged', 'approved', 'admin_created'])
            ->whereIn('scope', ['morning', 'afternoon'])
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->orderBy('start_date')
            ->first();
    }

    private function hasFullDayApprovedVacation(int $userId, Carbon $date): bool
    {
        return $this->getFullDayApprovedVacation($userId, $date) !== null;
    }

    private function getFullDayApprovedVacation(int $userId, Carbon $date): ?Vacation
    {
        return Vacation::query()
            ->where('user_id', $userId)
            ->where('status', 'approved')
            ->where('scope', VacationScope::FullDay)
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->orderBy('start_date')
            ->first();
    }

    private function hasHalfDayApprovedVacation(int $userId, Carbon $date): bool
    {
        return $this->getHalfDayApprovedVacation($userId, $date) !== null;
    }

    private function getHalfDayApprovedVacation(int $userId, Carbon $date): ?Vacation
    {
        return Vacation::query()
            ->where('user_id', $userId)
            ->where('status', 'approved')
            ->whereIn('scope', [VacationScope::Morning, VacationScope::Afternoon])
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->orderBy('start_date')
            ->first();
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
