<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FlockMedicine extends Model
{
    protected $table = 'flock_medicines';

    protected $fillable = [
        'flock_id',
        'item_id',
        'medicine_name',
        'prescribed_by',
        'dosage',
        'daily_quantity',
        'start_date',
        'end_date',
        'notes',
        'created_by',
        'updated_by',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function flock()
    {
        return $this->belongsTo(Flock::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
