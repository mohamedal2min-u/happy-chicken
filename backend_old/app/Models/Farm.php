<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Farm extends Model
{
    protected $fillable = ['name', 'location', 'contact_phone', 'is_active'];

    /**
     * المستخدمون المرتبطون بالمدجنة.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'farm_users')->withPivot('role')->withTimestamps();
    }

    /**
     * أفواج المدجنة.
     */
    public function flocks(): HasMany
    {
        return $this->hasMany(Flock::class);
    }

    /**
     * مستودعات المدجنة.
     */
    public function warehouses(): HasMany
    {
        return $this->hasMany(Warehouse::class);
    }
}
