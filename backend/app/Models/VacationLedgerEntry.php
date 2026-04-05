<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\LedgerEntryType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VacationLedgerEntry extends Model
{
    protected $fillable = [
        'user_id',
        'year',
        'type',
        'days',
        'comment',
        'vacation_id',
        'blackout_period_id',
    ];

    protected function casts(): array
    {
        return [
            'type' => LedgerEntryType::class,
            'days' => 'decimal:1',
            'year' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function vacation(): BelongsTo
    {
        return $this->belongsTo(Vacation::class);
    }

    public function blackoutPeriod(): BelongsTo
    {
        return $this->belongsTo(BlackoutPeriod::class);
    }
}
