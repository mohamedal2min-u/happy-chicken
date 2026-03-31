<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class FlockResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'batch_number' => $this->batch_number,
            'start_count' => $this->start_count,
            'current_count' => $this->current_count,
            'age_days' => $this->age_days,
            'cost_per_kg' => (float) $this->cost_per_kg,
            'status' => $this->status, // open/closed
            'notes' => $this->notes,
            'mortalities_summary' => $this->mortalities()->sum('count'),
            'feed_total' => $this->feedLogs()->sum('quantity'),
            'expenses_total' => $this->expenses()->sum('amount'),
            'created_at' => $this->created_at->format('Y-m-d H:i'),
            // الروابط التشغيلية
            'can_log' => $this->status === 'open',
        ];
    }
}
