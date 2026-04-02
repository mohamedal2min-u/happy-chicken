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

        // 1. الأفواج الجارية (المفتوحة) مع الحسابات اليومية
        $activeFlocks = Flock::where('status', 'open')->get();

        $activeFlocks = $activeFlocks->map(function ($flock) {
            // حساب نفوق اليوم لهذا الفوج
            $flock->today_mortality = (int)$flock->mortalities()
                ->whereDate('date', now())
                ->sum('count');

            // حساب مصروف اليوم لهذا الفوج
            $flock->today_expense = (float)$flock->expenses()
                ->whereDate('date', now())
                ->sum('amount');

            // حساب العلف المقدر (أكياس) حسب العمر
            $age = $flock->age_days;
            $birdCount = $flock->current_count;
            // معادلة تقريبية: (العدد * جرام لكل عمر) / 50000 كغ للكيس
            $gramPerBird = $age < 7 ? 20 : ($age < 14 ? 50 : ($age < 21 ? 90 : ($age < 30 ? 140 : 180)));
            $flock->estimated_feed_bags = round(($birdCount * $gramPerBird) / 50000, 1);

            return $flock;
        });

        // 2. إجمالي عدد الطيور الحي حالياً
        $totalLiveCount = $activeFlocks->sum('current_count');

        // 3. إجمالي المصاريف (الشهر الحالي) للمزرعة بالكامل
        $totalExpenses = Expense::where('farm_id', $farmId)
            ->whereYear('date', now()->year)
            ->whereMonth('date', now()->month)
            ->sum('amount');

        // 4. إجمالي المبيعات (الشهر الحالي) للمزرعة بالكامل
        $totalSales = Sale::where('farm_id', $farmId)
            ->whereYear('date', now()->year)
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
