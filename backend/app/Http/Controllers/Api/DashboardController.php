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
        $today = date('Y-m-d');

        // 1. جلب الأفواج الجارية وحساب بياناتها بدقة
        $activeFlocks = Flock::where('status', 'open')
            ->where('farm_id', $farmId)
            ->get();

        $flocksData = $activeFlocks->map(function ($flock) use ($today) {
            $data = $flock->toArray();
            
            // حساب العمر الفعلي بشكل ديناميكي (يعتبر يوم الإدخال هو اليوم 1)
            $start_date = \Carbon\Carbon::parse($flock->created_at)->startOfDay();
            $dynamic_age = max(1, $start_date->diffInDays(\Carbon\Carbon::now()->startOfDay()) + 1);
            $data['age_days'] = $dynamic_age;

            // حساب نفوق اليوم لهذا الفوج - استخدام whereDate للبحث الأدق
            $data['today_mortality'] = (int)$flock->mortalities()
                ->whereDate('date', $today)
                ->sum('count');

            // حساب مصرف اليوم لهذا الفوج
            $data['today_expense'] = (float)$flock->expenses()
                ->whereDate('date', $today)
                ->sum('amount');

            // حساب العلف المقدر (أكياس) حسب العمر الديناميكي والعدد الحالي
            $age = $dynamic_age;
            $count = (int)($flock->current_count ?? $flock->start_count);
            
            // تحويل من جرام إلى أكياس متوافق مع حساب الفرونت إند
            $gramPerBird = $age < 3 ? 15 : ($age < 7 ? 25 : ($age < 14 ? 45 : ($age < 21 ? 85 : ($age < 30 ? 130 : 175))));
            $totalGrams = $count * $gramPerBird;
            $data['estimated_feed_bags'] = round($totalGrams / 50000, 1);

            return $data;
        });

        // 2. إحصائيات المزرعة بالكامل للشهر الحالي
        $totalExpenses = Expense::where('farm_id', $farmId)
            ->whereYear('date', date('Y'))
            ->whereMonth('date', date('m'))
            ->sum('amount');

        $totalSales = Sale::where('farm_id', $farmId)
            ->whereYear('date', date('Y'))
            ->whereMonth('date', date('m'))
            ->sum('total_amount');

        return response()->json([
            'summary' => [
                'active_flocks_count' => $activeFlocks->count(),
                'total_birds' => (int) $activeFlocks->sum('current_count'),
                'today_date' => $today
            ],
            'flocks' => $flocksData,
            'status' => 'success'
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
