<?php

namespace App\Services;

use App\Models\Flock;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Exception;

class FlockService
{
    /**
     * التحقق من قاعدة الـ 15 دقيقة للتعديل للعامل.
     */
    public function canWorkerEdit($log): bool
    {
        $createdAt = Carbon::parse($log->created_at);
        $now = Carbon::now();

        // هل مرت 15 دقيقة؟
        return $now->diffInMinutes($createdAt) <= 15;
    }

    /**
     * إغلاق الفوج وحساب التكاليف النهائية.
     */
    public function closeFlock(int $flockId)
    {
        return DB::transaction(function () use ($flockId) {
            $flock = Flock::findOrFail($flockId);

            if ($flock->status === 'closed') {
                throw new Exception("الفوج مغلق بالفعل.");
            }

            // 1. حساب إجمالي الحيوية الحالية
            // (العدد الأولي - مجموع النفوق - المبيعات السابقة)
            // سيتم وضع المنطق المعقد في الـ API Implementation

            // 2. تغيير الحالة
            $flock->status = 'closed';
            $flock->save();

            return $flock;
        });
    }

    /**
     * تحديث رصيد الحيوية (الأعداد) بعد نفوق أو مبيعات.
     */
    public function syncCurrentCount(Flock $flock)
    {
        $totalMortalities = $flock->mortalities()->sum('count');
        $totalSales = $flock->sales()->with('items')->get()->sum(function($sale) {
            return $sale->items->sum('count');
        });

        $flock->current_count = $flock->start_count - ($totalMortalities + $totalSales);
        $flock->save();

        return $flock->current_count;
    }
}
