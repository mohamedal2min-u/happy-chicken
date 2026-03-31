<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    protected $fillable = ['sale_id', 'count', 'total_weight', 'unit_price', 'total_price'];
}
