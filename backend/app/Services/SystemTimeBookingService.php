<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AbsenceStatus;
use App\Enums\AbsenceType;
use App\Enums\BlackoutType;
use App\Enums\LedgerEntryType;
use App\Enums\VacationScope;
use App\Models\Absence;
use App\Models\BlackoutPeriod;
use App\Models\CostCenter;
use App\Models\Holiday;
use App\Models\TimeBooking;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\Vacation;
use App\Models\VacationLedgerEntry;
use Carbon\Carbon;

class SystemTimeBookingService
{
    public function syncVacation(Vacation $vacation): void
    {
        $user = $vacation->relationLoaded('user') ? $vacation->user : User::findOrFail($vacation->user_id);

        foreach ($this->dateRange($vacation->start_date, $vacation->end_date) as $date) {
            $this->recalculateSystemBookingsForDate($user, $date);
        }
    }

    public function syncAbsence(Absence $absence): void
    {
        $user = $absence->relationLoaded('user') ? $absence->user : User::findOrFail($absence->user_id);

        foreach ($this->dateRange($absence->start_date, $absence->end_date) as $date) {
            $this->recalculateSystemBookingsForDate($user, $date);
        }
    }

    public function removeAbsence(Absence $absence): void
    {
        $user = $absence->relationLoaded('user') ? $absence->user : User::findOrFail($absence->user_id);

        foreach ($this->dateRange($absence->start_date, $absence->end_date) as $date) {
            $this->recalculateSystemBookingsForDate($user, $date);
        }
    }

    public function syncHoliday(Holiday $holiday, ?Carbon $previousDate = null): void
    {
        if ($previousDate !== null && $previousDate->toDateString() !== $holiday->date->toDateString()) {
            foreach (User::all() as $user) {
                $this->recalculateSystemBookingsForDate($user, $previousDate);
            }
        }

        foreach (User::all() as $user) {
            $this->recalculateSystemBookingsForDate($user, $holiday->date);
        }
    }

    public function removeHolidayDate(Carbon $date): void
    {
        foreach (User::all() as $user) {
            $this->recalculateSystemBookingsForDate($user, $date);
        }
    }

    public function syncCompanyHoliday(BlackoutPeriod $blackout, ?Carbon $previousStart = null, ?Carbon $previousEnd = null): void
    {
        if ($blackout->type !== BlackoutType::CompanyHoliday) {
            return;
        }

        if ($previousStart !== null && $previousEnd !== null) {
            foreach (User::all() as $user) {
                foreach ($this->dateRange($previousStart, $previousEnd) as $date) {
                    $this->recalculateSystemBookingsForDate($user, $date);
                }
            }
        }

        foreach (User::all() as $user) {
            $days = $this->calculateCompanyHolidayDaysForUser($blackout, $user);

            VacationLedgerEntry::query()
                ->where('user_id', $user->id)
                ->where('blackout_period_id', $blackout->id)
                ->delete();

            if ($days > 0) {
                VacationLedgerEntry::create([
                    'user_id' => $user->id,
                    'year' => $blackout->start_date->year,
                    'type' => LedgerEntryType::Taken,
                    'days' => -$days,
                    'comment' => sprintf(
                        'Company holiday %s to %s',
                        $blackout->start_date->toDateString(),
                        $blackout->end_date->toDateString()
                    ),
                    'blackout_period_id' => $blackout->id,
                ]);
            }

            foreach ($this->dateRange($blackout->start_date, $blackout->end_date) as $date) {
                $this->recalculateSystemBookingsForDate($user, $date);
            }
        }
    }

    public function removeCompanyHoliday(BlackoutPeriod $blackout): void
    {
        if ($blackout->type !== BlackoutType::CompanyHoliday) {
            return;
        }

        VacationLedgerEntry::query()
            ->where('blackout_period_id', $blackout->id)
            ->delete();

        foreach (User::all() as $user) {
            foreach ($this->dateRange($blackout->start_date, $blackout->end_date) as $date) {
                $this->recalculateSystemBookingsForDate($user, $date);
            }
        }
    }

    /**
     * @return array<int, Carbon>
     */
    private function dateRange(Carbon $start, Carbon $end): array
    {
        $dates = [];
        $current = $start->copy()->startOfDay();
        $last = $end->copy()->startOfDay();

        while ($current->lte($last)) {
            $dates[] = $current->copy();
            $current->addDay();
        }

        return $dates;
    }

    private function recalculateSystemBookingsForDate(User $user, Carbon $date): void
    {
        $systemCostCenterIds = [
            $this->costCenterIdByCode('VACATION'),
            $this->costCenterIdByCode('ILLNESS'),
            $this->costCenterIdByCode('SPECIAL_LEAVE'),
            $this->costCenterIdByCode('HOLIDAY'),
        ];

        TimeBooking::where('user_id', $user->id)
            ->whereDate('date', $date->toDateString())
            ->whereIn('cost_center_id', $systemCostCenterIds)
            ->delete();

        $approvedVacation = Vacation::where('user_id', $user->id)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->first();

        $companyHoliday = BlackoutPeriod::query()
            ->where('type', BlackoutType::CompanyHoliday)
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->exists();

        $absences = Absence::where('user_id', $user->id)
            ->whereIn('status', [
                AbsenceStatus::Acknowledged->value,
                AbsenceStatus::Approved->value,
                AbsenceStatus::AdminCreated->value,
            ])
            ->whereDate('start_date', '<=', $date->toDateString())
            ->whereDate('end_date', '>=', $date->toDateString())
            ->get();

        $fullDay = $absences->firstWhere('scope.value', 'full_day');
        if ($fullDay !== null) {
            TimeEntry::where('user_id', $user->id)
                ->whereDate('date', $date->toDateString())
                ->delete();

            TimeBooking::create([
                'user_id' => $user->id,
                'date' => $date->toDateString(),
                'cost_center_id' => $this->costCenterIdByAbsenceType($fullDay->type),
                'percentage' => 100,
            ]);

            return;
        }

        $hasHoliday = Holiday::whereDate('date', $date->toDateString())->exists();
        if ($hasHoliday && !$user->holidays_exempt && $this->isWorkDayIgnoringHolidays($user, $date)) {
            TimeEntry::where('user_id', $user->id)
                ->whereDate('date', $date->toDateString())
                ->delete();

            TimeBooking::create([
                'user_id' => $user->id,
                'date' => $date->toDateString(),
                'cost_center_id' => $this->costCenterIdByCode('HOLIDAY'),
                'percentage' => 100,
            ]);

            return;
        }

        $percentagesByCostCenter = [];

        foreach ($absences as $absence) {
            $costCenterId = $this->costCenterIdByAbsenceType($absence->type);
            $percentagesByCostCenter[$costCenterId] = ($percentagesByCostCenter[$costCenterId] ?? 0) + 50;
        }

        if ($approvedVacation !== null && $user->isWorkDay($date)) {
            $vacationPercentage = $approvedVacation->scope === VacationScope::FullDay ? 100 : 50;
            $percentagesByCostCenter[$this->costCenterIdByCode('VACATION')] = ($percentagesByCostCenter[$this->costCenterIdByCode('VACATION')] ?? 0) + $vacationPercentage;
        }

        if ($companyHoliday && $this->isWorkDayIgnoringHolidays($user, $date)) {
            $usedPercentage = array_sum($percentagesByCostCenter);
            $remaining = max(0, 100 - $usedPercentage);

            if ($remaining > 0) {
                $vacationCostCenterId = $this->costCenterIdByCode('VACATION');
                $percentagesByCostCenter[$vacationCostCenterId] = ($percentagesByCostCenter[$vacationCostCenterId] ?? 0) + $remaining;
            }
        }

        foreach ($percentagesByCostCenter as $costCenterId => $percentage) {
            if ($percentage <= 0) {
                continue;
            }

            TimeBooking::create([
                'user_id' => $user->id,
                'date' => $date->toDateString(),
                'cost_center_id' => $costCenterId,
                'percentage' => $percentage,
            ]);
        }

        if (array_sum($percentagesByCostCenter) >= 100) {
            TimeEntry::where('user_id', $user->id)
                ->whereDate('date', $date->toDateString())
                ->delete();
        }
    }

    private function costCenterIdByAbsenceType(AbsenceType $type): int
    {
        return match ($type) {
            AbsenceType::Illness => $this->costCenterIdByCode('ILLNESS'),
            AbsenceType::SpecialLeave => $this->costCenterIdByCode('SPECIAL_LEAVE'),
        };
    }

    private function costCenterIdByCode(string $code): int
    {
        return CostCenter::where('code', $code)->value('id');
    }

    private function isWorkDayIgnoringHolidays(User $user, Carbon $date): bool
    {
        $dayOfWeek = (int) $date->dayOfWeekIso;
        $schedule = $user->getActiveWorkSchedule($date);

        if ($schedule !== null) {
            $workDays = $schedule->work_days;
        } else {
            $defaultWorkDays = \App\Models\Setting::get('default_work_days', '[1,2,3,4,5]');
            $workDays = is_string($defaultWorkDays) ? json_decode($defaultWorkDays, true) : $defaultWorkDays;
            if (!is_array($workDays)) {
                $workDays = [1, 2, 3, 4, 5];
            }
        }

        if (!in_array($dayOfWeek, $workDays, true)) {
            if ($user->weekend_worker && in_array($dayOfWeek, [6, 7], true)) {
                return true;
            }

            return false;
        }

        return true;
    }

    private function calculateCompanyHolidayDaysForUser(BlackoutPeriod $blackout, User $user): float
    {
        $days = 0.0;

        foreach ($this->dateRange($blackout->start_date, $blackout->end_date) as $date) {
            if (!$user->isWorkDay($date)) {
                continue;
            }

            $fullDayAbsence = Absence::query()
                ->where('user_id', $user->id)
                ->whereIn('status', [
                    AbsenceStatus::Acknowledged->value,
                    AbsenceStatus::Approved->value,
                    AbsenceStatus::AdminCreated->value,
                ])
                ->where('scope', 'full_day')
                ->whereDate('start_date', '<=', $date->toDateString())
                ->whereDate('end_date', '>=', $date->toDateString())
                ->exists();

            if ($fullDayAbsence) {
                continue;
            }

            $fraction = 1.0;

            $halfDayAbsenceCount = Absence::query()
                ->where('user_id', $user->id)
                ->whereIn('status', [
                    AbsenceStatus::Acknowledged->value,
                    AbsenceStatus::Approved->value,
                    AbsenceStatus::AdminCreated->value,
                ])
                ->whereIn('scope', ['morning', 'afternoon'])
                ->whereDate('start_date', '<=', $date->toDateString())
                ->whereDate('end_date', '>=', $date->toDateString())
                ->count();
            $fraction -= min(1.0, $halfDayAbsenceCount * 0.5);

            $approvedVacation = Vacation::query()
                ->where('user_id', $user->id)
                ->where('status', 'approved')
                ->whereDate('start_date', '<=', $date->toDateString())
                ->whereDate('end_date', '>=', $date->toDateString())
                ->first();

            if ($approvedVacation !== null) {
                $fraction -= $approvedVacation->scope === VacationScope::FullDay ? 1.0 : 0.5;
            }

            $days += max(0.0, $fraction);
        }

        return $days;
    }
}
