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
        $farmId = \App\Models\FarmContext::getFarmId();

        // 1. الأفواج الجارية (المفتوحة) - اختيار الحقول الضرورية فقط لتقليل الحمولة
        $activeFlocks = Flock::where('status', 'open')
            ->select('id', 'batch_number', 'start_count', 'current_count', 'age_days', 'cost_per_kg', 'created_at')
            ->get();

        // 2. إجمالي عدد الطيور الحي حالياً
        $totalLiveCount = $activeFlocks->sum('current_count');

        // 3. إجمالي المصاريف (الشهر الحالي)
        $totalExpenses = Expense::whereYear('date', now()->year)
            ->whereMonth('date', now()->month)
            ->sum('amount');

        // 4. إجمالي المبيعات (الشهر الحالي)
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

    /**
     * ملخص النظام للمدير العام (Super Admin)
     */
    public function getSuperAdminSummary()
    {
        $allFarms = \App\Models\Farm::withCount(['flocks', 'users'])->get();
        
        $activeFarmsCount = $allFarms->where('is_active', true)->count();
        $stoppedFarmsCount = $allFarms->where('is_active', false)->count();

        $totalUsers = \App\Models\User::count();
        $totalFlocks = Flock::count();
        $openFlocks = Flock::where('status', 'open')->count();

        // إحصائيات كل مزرعة
        $farmsDetails = $allFarms->map(function ($farm) {
            return [
                'id' => $farm->id,
                'name' => $farm->name,
                'location' => $farm->location,
                'is_active' => $farm->is_active,
                'flocks_count' => $farm->flocks_count ?? 0,
                'users_count' => $farm->users_count ?? 0,
            ];
        });

        return response()->json([
            'total_farms' => $allFarms->count(),
            'active_farms' => $activeFarmsCount,
            'stopped_farms' => $stoppedFarmsCount,
            'total_users' => $totalUsers,
            'total_flocks' => $totalFlocks,
            'open_flocks' => $openFlocks,
            'farms' => $farmsDetails,
        ]);
    }
}
