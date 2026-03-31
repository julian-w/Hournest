<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AbsenceScope;
use App\Enums\AbsenceStatus;
use App\Enums\AbsenceType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Absence extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'start_date',
        'end_date',
        'type',
        'scope',
        'status',
        'comment',
        'admin_comment',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'type' => AbsenceType::class,
            'scope' => AbsenceScope::class,
            'status' => AbsenceStatus::class,
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

    /**
     * Check if this absence is in an active/effective state.
     */
    public function isEffective(): bool
    {
        return in_array($this->status, [
            AbsenceStatus::Acknowledged,
            AbsenceStatus::Approved,
            AbsenceStatus::AdminCreated,
        ]);
    }
}
