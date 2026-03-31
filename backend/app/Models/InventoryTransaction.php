<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    use \App\Traits\BelongsToFarm;

    protected $fillable = [
        'farm_id',
        'warehouse_item_id',
        'item_id', 
        'quantity',
        'type',
        'price_per_unit',
        'total_cost',
        'invoice_path',
        'payment_status',
        'reference_type',
        'reference_id',
        'created_by',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
