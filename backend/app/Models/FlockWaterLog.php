<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlockWaterLog extends Model
{
    protected $fillable = ['flock_id', 'quantity', 'date', 'created_by'];

    public function flock(): BelongsTo
    {
        return $this->belongsTo(Flock::class);
    }
}
