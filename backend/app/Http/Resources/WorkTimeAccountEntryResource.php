<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkTimeAccountEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $createdBy = data_get($this->resource, 'created_by');
        $createdByName = data_get($this->resource, 'created_by_name');
        $sourceType = data_get($this->resource, 'source_type', 'manual');
        $sourceId = data_get($this->resource, 'source_id', data_get($this->resource, 'id'));
        $creator = is_object($this->resource) ? $this->resource->creator : null;

        return [
            'id' => $this['id'] ?? $this->id,
            'user_id' => $this['user_id'] ?? $this->user_id,
            'effective_date' => $this['effective_date'] instanceof \Carbon\CarbonInterface
                ? $this['effective_date']->toDateString()
                : (string) $this['effective_date'],
            'type' => $this['type'],
            'minutes_delta' => (int) $this['minutes_delta'],
            'balance_after' => (int) $this['balance_after'],
            'comment' => $this['comment'],
            'created_at' => $this['created_at'] instanceof \Carbon\CarbonInterface
                ? $this['created_at']->toIso8601String()
                : $this['created_at'],
            'created_by' => $createdBy,
            'created_by_name' => $createdByName ?? $creator?->display_name,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
        ];
    }
}
