<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimeEntry extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'start_time',
        'end_time',
        'break_minutes',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'break_minutes' => 'integer',
            'net_working_minutes' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Calculate net working minutes (for use when virtual column is not available).
     */
    public function getNetMinutes(): int
    {
        $start = strtotime($this->start_time);
        $end = strtotime($this->end_time);
        $totalMinutes = ($end - $start) / 60;

        return max(0, (int) $totalMinutes - $this->break_minutes);
    }
}
