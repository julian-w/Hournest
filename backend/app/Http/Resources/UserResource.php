<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'display_name' => $this->display_name,
            'role' => $this->role->value,
            'vacation_days_per_year' => $this->vacation_days_per_year,
            'remaining_vacation_days' => $this->remainingVacationDays(),
            'holidays_exempt' => $this->holidays_exempt,
            'weekend_worker' => $this->weekend_worker,
        ];
    }
}
