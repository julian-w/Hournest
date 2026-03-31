<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'members' => UserResource::collection($this->whenLoaded('members')),
            'cost_centers' => CostCenterResource::collection($this->whenLoaded('costCenters')),
            'member_count' => $this->whenCounted('members'),
            'cost_center_count' => $this->whenCounted('costCenters'),
        ];
    }
}
