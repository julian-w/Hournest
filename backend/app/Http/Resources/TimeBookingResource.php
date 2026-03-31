<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TimeBookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'date' => $this->date->toDateString(),
            'cost_center_id' => $this->cost_center_id,
            'cost_center_name' => $this->whenLoaded('costCenter', fn () => $this->costCenter->name),
            'cost_center_code' => $this->whenLoaded('costCenter', fn () => $this->costCenter->code),
            'percentage' => $this->percentage,
            'comment' => $this->comment,
        ];
    }
}
