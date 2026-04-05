<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BlackoutType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BlackoutPeriod extends Model
{
    protected $fillable = [
        'type',
        'start_date',
        'end_date',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'type' => BlackoutType::class,
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(VacationLedgerEntry::class);
    }
}
