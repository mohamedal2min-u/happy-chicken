<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Flock;
use App\Models\Expense;
use App\Models\Sale;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * جلب ملخص العمليات للمدجنة الحالية.
     */
    public function getSummary()
    {
        $farmId = session('current_farm_id');

        // 1. الأفواج الجارية (المفتوحة)
        $activeFlocks = Flock::where('status', 'open')->get();

        // 2. إجمالي عدد الطيور الحي حالياً
        $totalLiveCount = $activeFlocks->sum('current_count');

        // 3. إجمالي المصاريف (الفترة الحالية - الشهر مثلاً)
        $totalExpenses = Expense::whereYear('date', now()->year)
            ->whereMonth('date', now()->month)
            ->sum('amount');

        // 4. إجمالي المبيعات (الفترة الحالية)
        $totalSales = Sale::whereYear('date', now()->year)
            ->whereMonth('date', now()->month)
            ->sum('total_amount');

        return response()->json([
            'summary' => [
                'active_flocks_count' => $activeFlocks->count(),
                'total_live_birds' => (int) $totalLiveCount,
                'monthly_expenses' => (float) $totalExpenses,
                'monthly_sales' => (float) $totalSales,
                'balance' => $totalSales - $totalExpenses,
            ],
            'flocks' => $activeFlocks,
        ]);
    }
}
