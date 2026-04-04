<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToFarm;

class Partner extends Model
{
    protected $fillable = ['user_id', 'name', 'phone'];
}
