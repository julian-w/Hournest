<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\VacationScope;
use App\Enums\VacationStatus;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vacation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'start_date',
        'end_date',
        'scope',
        'status',
        'comment',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'scope' => VacationScope::class,
            'status' => VacationStatus::class,
            'reviewed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(VacationLedgerEntry::class);
    }

    /**
     * Count workdays in this vacation period.
     * Uses the user's individual work schedule and holidays if user is loaded.
     * Falls back to simple weekday counting if no user is available.
     */
    public function countWorkdays(?int $year = null): float
    {
        $start = $this->start_date->copy();
        $end = $this->end_date->copy();

        if ($year !== null) {
            $yearStart = Carbon::create($year, 1, 1);
            $yearEnd = Carbon::create($year, 12, 31);

            if ($start->lt($yearStart)) {
                $start = $yearStart;
            }
            if ($end->gt($yearEnd)) {
                $end = $yearEnd;
            }
        }

        $workdays = 0.0;
        $current = $start->copy();

        // Try to use the user's work schedule if the relationship is available
        $user = $this->relationLoaded('user') ? $this->user : ($this->user_id ? $this->user : null);

        while ($current->lte($end)) {
            if ($user !== null) {
                if ($user->isWorkDay($current)) {
                    $workdays += $this->dayFactorForDate($current);
                }
            } else {
                // Fallback: simple weekday check
                if ($current->isWeekday()) {
                    $workdays += $this->dayFactorForDate($current);
                }
            }
            $current->addDay();
        }

        return $workdays;
    }

    private function dayFactorForDate(Carbon $date): float
    {
        if (($this->scope ?? VacationScope::FullDay) === VacationScope::FullDay) {
            return 1.0;
        }

        if (
            $this->start_date->isSameDay($this->end_date)
            && $date->isSameDay($this->start_date)
        ) {
            return 0.5;
        }

        return 1.0;
    }
}
