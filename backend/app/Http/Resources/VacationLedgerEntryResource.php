<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VacationLedgerEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'year' => $this->year,
            'type' => $this->type->value,
            'days' => (float) $this->days,
            'comment' => $this->comment,
            'vacation_id' => $this->vacation_id,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
