<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToFarm;

class Partner extends Model
{
    use BelongsToFarm;
    protected $fillable = ['farm_id', 'name', 'share_percentage', 'initial_capital', 'current_balance', 'withdrawals'];
}
