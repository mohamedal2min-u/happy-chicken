<?php
namespace App\Models;

use App\Traits\BelongsToFarm;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use BelongsToFarm;

    protected $fillable = ['farm_id', 'flock_id', 'customer_name', 'total_amount', 'paid_amount', 'date', 'status', 'created_by'];

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }
}
