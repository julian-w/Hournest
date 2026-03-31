<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TimeLockResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'year' => $this->year,
            'month' => $this->month,
            'locked_by' => $this->locked_by,
            'locked_by_name' => $this->whenLoaded('lockedByUser', fn () => $this->lockedByUser->display_name),
            'locked_at' => $this->locked_at->toIso8601String(),
        ];
    }
}
