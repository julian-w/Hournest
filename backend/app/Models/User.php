<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\LedgerEntryType;
use App\Enums\UserRole;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'email',
        'display_name',
        'password',
        'must_change_password',
        'role',
        'vacation_days_per_year',
        'oidc_id',
        'holidays_exempt',
        'weekend_worker',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'role' => UserRole::class,
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'vacation_days_per_year' => 'integer',
            'holidays_exempt' => 'boolean',
            'weekend_worker' => 'boolean',
        ];
    }

    public function vacations(): HasMany
    {
        return $this->hasMany(Vacation::class);
    }

    public function reviewedVacations(): HasMany
    {
        return $this->hasMany(Vacation::class, 'reviewed_by');
    }

    public function workSchedules(): HasMany
    {
        return $this->hasMany(WorkSchedule::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(VacationLedgerEntry::class);
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function timeBookings(): HasMany
    {
        return $this->hasMany(TimeBooking::class);
    }

    public function timeBookingTemplates(): HasMany
    {
        return $this->hasMany(TimeBookingTemplate::class);
    }

    public function absences(): HasMany
    {
        return $this->hasMany(Absence::class);
    }

    public function costCenters(): BelongsToMany
    {
        return $this->belongsToMany(CostCenter::class, 'user_cost_centers');
    }

    public function costCenterFavorites(): BelongsToMany
    {
        return $this->belongsToMany(CostCenter::class, 'cost_center_favorites')
            ->withPivot('sort_order')
            ->orderByPivot('sort_order');
    }

    public function userGroups(): BelongsToMany
    {
        return $this->belongsToMany(UserGroup::class, 'user_group_members');
    }

    /**
     * Get all available cost centers for this user (direct + groups + system).
     */
    public function availableCostCenters(): \Illuminate\Support\Collection
    {
        $directIds = $this->costCenters()->pluck('cost_centers.id');

        $groupIds = CostCenter::whereHas('userGroups', function ($query) {
            $query->whereHas('members', function ($q) {
                $q->where('users.id', $this->id);
            });
        })->pluck('id');

        $systemIds = CostCenter::where('is_system', true)->pluck('id');

        $allIds = $directIds->merge($groupIds)->merge($systemIds)->unique();

        return CostCenter::whereIn('id', $allIds)
            ->where('is_active', true)
            ->orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();
    }

    /**
     * Get the daily target minutes for a given date.
     */
    public function getDailyTargetMinutes(?Carbon $date = null): int
    {
        $date = $date ?? Carbon::today();
        $schedule = $this->getActiveWorkSchedule($date);

        if ($schedule !== null) {
            $weeklyTarget = $schedule->weekly_target_minutes;
            $workDaysCount = count($schedule->work_days);
        } else {
            $weeklyTarget = (int) Setting::get('default_weekly_target_minutes', '2400');
            $defaultWorkDays = Setting::get('default_work_days', '[1,2,3,4,5]');
            $workDays = is_string($defaultWorkDays) ? json_decode($defaultWorkDays, true) : $defaultWorkDays;
            $workDaysCount = is_array($workDays) ? count($workDays) : 5;
        }

        return $workDaysCount > 0 ? (int) round($weeklyTarget / $workDaysCount) : 0;
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin || $this->role === UserRole::Superadmin;
    }

    /**
     * Get the active work schedule for a given date.
     */
    public function getActiveWorkSchedule(?Carbon $date = null): ?WorkSchedule
    {
        $date = $date ?? Carbon::today();

        return $this->workSchedules()
            ->where('start_date', '<=', $date)
            ->where(function ($query) use ($date) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', $date);
            })
            ->orderByDesc('start_date')
            ->first();
    }

    /**
     * Check if a given date is a work day for this user.
     * Considers: work schedules (or global default), holidays, weekend_worker flag, holidays_exempt flag.
     */
    public function isWorkDay(Carbon $date): bool
    {
        $dayOfWeek = (int) $date->dayOfWeekIso; // 1=Monday, 7=Sunday

        // Determine work days from schedule or global default
        $schedule = $this->getActiveWorkSchedule($date);
        if ($schedule !== null) {
            $workDays = $schedule->work_days;
        } else {
            $defaultWorkDays = Setting::get('default_work_days', '[1,2,3,4,5]');
            $workDays = is_string($defaultWorkDays) ? json_decode($defaultWorkDays, true) : $defaultWorkDays;
            if (!is_array($workDays)) {
                $workDays = [1, 2, 3, 4, 5];
            }
        }

        // Check if the day is in the user's work days
        if (!in_array($dayOfWeek, $workDays, true)) {
            // Exception: weekend_worker flag overrides weekends (Sat=6, Sun=7)
            if ($this->weekend_worker && in_array($dayOfWeek, [6, 7], true)) {
                // Weekend worker works on weekends even if not in schedule
            } else {
                return false;
            }
        }

        // Check holidays (unless user is holidays_exempt)
        if (!$this->holidays_exempt) {
            $isHoliday = Holiday::whereDate('date', $date->toDateString())->exists();
            if ($isHoliday) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate remaining vacation days from ledger entries.
     */
    public function remainingVacationDays(?int $year = null): float
    {
        $year = $year ?? (int) date('Y');

        $total = $this->ledgerEntries()
            ->where('year', $year)
            ->sum('days');

        // If no ledger entries exist for this year, fall back to the old calculation
        if ((float) $total === 0.0 && $this->ledgerEntries()->where('year', $year)->count() === 0) {
            $usedDays = $this->vacations()
                ->where('status', 'approved')
                ->where(function ($query) use ($year) {
                    $query->whereYear('start_date', $year)
                        ->orWhereYear('end_date', $year);
                })
                ->get()
                ->sum(function (Vacation $vacation) use ($year) {
                    return $vacation->countWorkdays($year);
                });

            return (float) ($this->vacation_days_per_year - $usedDays);
        }

        return (float) $total;
    }
}
