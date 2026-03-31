<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimeBooking extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'cost_center_id',
        'percentage',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'percentage' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }
}
