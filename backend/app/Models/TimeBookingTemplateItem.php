<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimeBookingTemplateItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'time_booking_template_id',
        'cost_center_id',
        'percentage',
    ];

    protected function casts(): array
    {
        return [
            'percentage' => 'integer',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(TimeBookingTemplate::class, 'time_booking_template_id');
    }

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }
}
