<?php

namespace App\Traits;

use App\Models\Farm;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait BelongsToFarm
{
    /**
     * Boot the trait to add a global scope and observer.
     */
    protected static function bootBelongsToFarm()
    {
        // إضافة farm_id تلقائياً عند إنشاء أي سجل
        static::creating(function ($model) {
            if (!$model->farm_id && session()->has('current_farm_id')) {
                $model->farm_id = session()->get('current_farm_id');
            }
        });

        // النطاق العالمي لضمان عدم استرجاع بيانات خارج المدجنة الحالية
        static::addGlobalScope('farm', function (Builder $builder) {
            if (session()->has('current_farm_id')) {
                $builder->where('farm_id', session()->get('current_farm_id'));
            }
        });
    }

    /**
     * العلاقة مع المدجنة.
     */
    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }
}
