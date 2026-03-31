<?php
namespace App\Models;

use App\Traits\BelongsToFarm;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use BelongsToFarm;
    
    protected $fillable = ['farm_id', 'flock_id', 'category_id', 'amount', 'description', 'date', 'created_by'];

    public function category()
    {
        return $this->belongsTo(ExpenseCategory::class);
    }

    public function flock()
    {
        return $this->belongsTo(Flock::class);
    }
}
