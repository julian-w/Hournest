<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AbsenceStatus;
use App\Enums\AbsenceType;
use App\Models\Absence;
use App\Models\CostCenter;
use App\Models\Holiday;
use App\Models\TimeBooking;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\Vacation;
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

        if ($approvedVacation !== null && $user->isWorkDay($date)) {
            TimeEntry::where('user_id', $user->id)
                ->whereDate('date', $date->toDateString())
                ->delete();

            TimeBooking::create([
                'user_id' => $user->id,
                'date' => $date->toDateString(),
                'cost_center_id' => $this->costCenterIdByCode('VACATION'),
                'percentage' => 100,
            ]);

            return;
        }

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

        if (!$absences->isEmpty() && $user->isWorkDay($date)) {
            $percentagesByCostCenter = [];
            foreach ($absences as $absence) {
                $costCenterId = $this->costCenterIdByAbsenceType($absence->type);
                $percentagesByCostCenter[$costCenterId] = ($percentagesByCostCenter[$costCenterId] ?? 0) + 50;
            }

            foreach ($percentagesByCostCenter as $costCenterId => $percentage) {
                TimeBooking::create([
                    'user_id' => $user->id,
                    'date' => $date->toDateString(),
                    'cost_center_id' => $costCenterId,
                    'percentage' => $percentage,
                ]);
            }

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
}
