<?php

namespace App\Models;

use App\Traits\BelongsToFarm;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Flock extends Model
{
    use BelongsToFarm;

    protected $fillable = [
        'farm_id', 'batch_number', 'start_count', 'current_count', 
        'age_days', 'cost_per_kg', 'status', 'notes', 
        'created_by', 'updated_by'
    ];

    /**
     * سجل النفوق للفوج.
     */
    public function mortalities(): HasMany
    {
        return $this->hasMany(FlockMortality::class);
    }

    /**
     * سجل استهلاك العلف.
     */
    public function feedLogs(): HasMany
    {
        return $this->hasMany(FlockFeedLog::class);
    }

    /**
     * المصاريف المرتبطة بالفوج.
     */
    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    /**
     * المبيعات المرتبطة بالفوج.
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    /**
     * المستخدم الذي أنشأ الفوج.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
