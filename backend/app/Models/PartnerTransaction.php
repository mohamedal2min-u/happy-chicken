<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToFarm;

class PartnerTransaction extends Model
{
    use BelongsToFarm;
    protected $fillable = ['farm_id', 'partner_id', 'amount', 'type', 'date', 'notes', 'description', 'created_by'];
}
