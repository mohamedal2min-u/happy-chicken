<?php

namespace App\Policies;

use App\Models\User;
use App\Models\FlockMortality;
use Carbon\Carbon;

class FlockMortalityPolicy
{
    /**
     * هل يمكن للمستخدم تعديل السجل؟
     */
    public function update(User $user, FlockMortality $log): bool
    {
        // 1. سوبر أدمن ومدير المزرعة يمكنهم التعديل دائماً
        if ($user->hasRole(['super_admin', 'farm_admin'])) {
            return true;
        }

        // 2. العامل يمكنه التعديل فقط خلال 15 دقيقة من الإنشاء
        if ($user->hasRole('worker')) {
            $createdAt = Carbon::parse($log->created_at);
            return Carbon::now()->diffInMinutes($createdAt) <= 15;
        }

        return false;
    }

    /**
     * هل يمكن للمستخدم حذف السجل؟
     */
    public function delete(User $user, FlockMortality $log): bool
    {
        // الحذف مخصص فقط للمديرين لمنع التلاعب بالسجلات
        return $user->hasRole(['super_admin', 'farm_admin']);
    }
}
