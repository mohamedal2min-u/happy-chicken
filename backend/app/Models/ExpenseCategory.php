<?php
namespace App\Models;

use App\Traits\BelongsToFarm;
use Illuminate\Database\Eloquent\Model;

class ExpenseCategory extends Model
{
    use BelongsToFarm;
    
    protected $fillable = ['farm_id', 'name'];
}
