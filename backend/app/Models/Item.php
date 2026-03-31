<?php
namespace App\Models;

use App\Traits\BelongsToFarm;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use BelongsToFarm;

    protected $fillable = ['farm_id', 'type_id', 'name', 'unit', 'current_quantity', 'min_quantity'];

    public function type()
    {
        return $this->belongsTo(ItemType::class, 'type_id');
    }
}
