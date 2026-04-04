<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Flock;
use App\Models\FlockMortality;
use App\Models\FlockFeedLog;
use App\Models\FlockWaterLog;
use App\Models\FlockMedicine;
use App\Services\FlockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class FlockController extends Controller
{
    protected $flockService;

    public function __construct(FlockService $flockService)
    {
        $this->flockService = $flockService;
    }

    /**
     * قائمة الأفواج في المدجنة الحالية.
     */
    public function index()
    {
        return Flock::where('status', 'open')
            ->select('id', 'batch_number', 'current_count', 'age_days', 'status', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * إنشاء فوج جديد.
     */
    public function store(Request $request)
    {
        // 1. التأكد من عدم وجود فوج نشط حالياً (يسمح بفوج واحد فقط مفتوح)
        $activeFlock = Flock::where('status', 'open')->first();
        if ($activeFlock) {
            return response()->json([
                'error' => "لا يمكن إنشاء فوج جديد. هناك فوج نشط حالياً برقم #{$activeFlock->batch_number}. يرجى إغلاق الفوج الحالي أولاً."
            ], 422);
        }

        $request->validate([
            'batch_number' => 'required|string|unique:flocks',
            'start_count' => 'required|integer|min:0',
            'chick_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $flock = Flock::create([
            'batch_number' => $request->batch_number,
            'start_count' => $request->start_count,
            'current_count' => $request->start_count,
            'status' => 'open',
            'created_by' => Auth::id(),
            'notes' => "سعر الصوص: {$request->chick_price} ل.س | " . ($request->notes ?? ''),
        ]);

        return response()->json($flock, 201);
    }

    /**
     * تسجيل النفوق.
     */
    public function addMortality(Request $request, Flock $flock)
    {
        $request->validate([
            'count' => 'required|integer|min:1',
            'reason' => 'nullable|string',
        ]);

        if ($flock->status === 'closed') {
            return response()->json(['error' => 'الفوج مغلق، لا يمكن الإدخال.'], 403);
        }

        if ($request->count > $flock->current_count) {
             return response()->json(['error' => 'لا يمكن تسجيل نفوق أكبر من العدد الحي.'], 403);
        }

        return DB::transaction(function () use ($request, $flock) {
            $log = FlockMortality::create([
                'flock_id' => $flock->id,
                'count' => $request->count,
                'reason' => $request->reason,
                'date' => now()->toDateString(),
                'created_by' => Auth::id(),
            ]);

            $this->flockService->syncCurrentCount($flock);
            return response()->json($log, 201);
        });
    }

    /**
     * تسجيل العلف.
     */
    public function addFeed(Request $request, Flock $flock)
    {
        $request->validate([
            'quantity' => 'required|numeric|min:0.1',
        ]);

        if ($flock->status === 'closed') {
            return response()->json(['error' => 'الفوج مغلق.'], 403);
        }

        $log = FlockFeedLog::create([
            'flock_id' => $flock->id,
            'quantity' => $request->quantity,
            'date' => now()->toDateString(),
            'created_by' => Auth::id(),
        ]);

        return response()->json($log, 201);
    }

    /**
     * تسجيل الأدوية.
     */
    public function addMedicine(Request $request, Flock $flock)
    {
        $request->validate([
            'item_id' => 'required|exists:items,id',
            'medicine_name' => 'required|string',
            'prescribed_by' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'daily_quantity' => 'required|numeric|min:0.001',
            'notes' => 'nullable|string',
        ]);

        if ($flock->status === 'closed') {
            return response()->json(['error' => 'الفوج مغلق.'], 403);
        }

        $item = \App\Models\Item::findOrFail($request->item_id);
        $start = \Carbon\Carbon::parse($request->start_date);
        $end = \Carbon\Carbon::parse($request->end_date);
        $days = $end->diffInDays($start) + 1;

        $isLiter = in_array(strtolower($item->unit), ['لتر', 'liter', 'ليتر']);
        $totalUsage = $isLiter ? ($request->daily_quantity / 1000) * $days : $request->daily_quantity * $days;

        if ($item->current_quantity < $totalUsage) {
            return response()->json([
                'error' => "الكمية المطلوبة ({$totalUsage} {$item->unit}) أكبر من الرصيد المتاح ({$item->current_quantity} {$item->unit})."
            ], 422);
        }

        return DB::transaction(function () use ($request, $flock, $item, $totalUsage) {
            $log = FlockMedicine::create([
                'flock_id' => $flock->id,
                'item_id' => $item->id,
                'medicine_name' => $request->medicine_name,
                'prescribed_by' => $request->prescribed_by,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'daily_quantity' => $request->daily_quantity,
                'notes' => $request->notes,
                'created_by' => Auth::id(),
            ]);

            $item->decrement('current_quantity', $totalUsage);
            return response()->json($log, 201);
        });
    }

    /**
     * تفاصيل الفوج - السجل العملي والمحاسبي المدمج.
     */
    public function show(Flock $flock)
    {
        try {
            // تحميل العلاقات بشكل فردي مع حماية تامة
            try { $flock->load(['mortalities.creator']); } catch(\Throwable $e) {}
            try { $flock->load(['feedLogs', 'waterLogs']); } catch(\Throwable $e) {}
            try { $flock->load(['expenses.category', 'sales.items', 'medicines']); } catch(\Throwable $e) {}
            
            $today = \Carbon\Carbon::now()->toDateString();
            $start_date = \Carbon\Carbon::parse($flock->created_at)->startOfDay();
            $BAG_WEIGHT = 50; 

            // تجميع محمي للبيانات
            $mortsByDate = optional($flock->mortalities)->groupBy('date') ?? collect();
            $feedsByDate = optional($flock->feedLogs)->groupBy('date') ?? collect();
            $expensesByDate = optional($flock->expenses)->groupBy('date') ?? collect();
            $salesByDate = optional($flock->sales)->groupBy('date') ?? collect();

            $total_mortality = (int)($flock->mortalities->sum('count') ?? 0);
            $start_count = (int)($flock->start_count ?? 0);
            $mortality_rate = $start_count > 0 ? round(($total_mortality / $start_count) * 100, 2) : 0;

            $cumulative = [
                'total_mortality' => $total_mortality,
                'total_feed_kg' => (float)($flock->feedLogs->sum('quantity') ?? 0),
                'total_water' => (float)($flock->waterLogs->sum('quantity') ?? 0),
                'total_expenses' => (float)($flock->expenses->sum('amount') ?? 0),
                'total_sales' => (float)($flock->sales->sum('total_amount') ?? 0),
                'total_medicine_types' => optional($flock->medicines)->unique('medicine_name')->count() ?? 0,
            ];
            $cumulative['total_feed_bags'] = round($cumulative['total_feed_kg'] / $BAG_WEIGHT, 1);
            $cumulative['net_profit'] = $cumulative['total_sales'] - $cumulative['total_expenses'];

            $daily_movements = [];
            $running_count = $start_count;
            $active_days = max(1, (int)($flock->age_days ?? 1));
            
            // حد أقصى للأيام المسجلة للتأكد من عدم توقف الصفحة (أمان إضافي)
            $active_days = min($active_days, 100); 

            for ($i = 0; $i < $active_days; $i++) {
                $age = $i + 1;
                $current_date = (clone $start_date)->addDays($i)->toDateString();
                
                $dayMorts = $mortsByDate->get($current_date, collect());
                $d_mortality = $dayMorts->sum('count');
                $d_sales_count = ($salesByDate->get($current_date, collect()))->sum(fn($s) => optional($s->items)->sum('count') ?? 0);
                
                $end_of_day = max(0, $running_count - $d_mortality - $d_sales_count);

                $daily_movements[] = [
                    'day' => $age,
                    'date' => $current_date,
                    'mortality' => (int)$d_mortality,
                    'actual_feed_bags' => round(($feedsByDate->get($current_date, collect()))->sum('quantity') / $BAG_WEIGHT, 2),
                    'estimated_feed_bags' => round(((13 + (($age - 1) * 4.8)) * $running_count / 1000) / $BAG_WEIGHT, 2),
                    'expense_amount' => (float)($expensesByDate->get($current_date, collect()))->sum('amount'),
                    'expense_summary' => '---',
                    'updated_by' => 'مدير النظام',
                ];
                $running_count = $end_of_day;
            }

            return response()->json([
                'success' => true,
                'flock' => $flock,
                'kpis' => ['mortality_rate' => $mortality_rate, 'survival_rate' => 100 - $mortality_rate],
                'today' => ['date' => $today, 'mortality' => 0, 'feed_bags' => 0, 'expense' => 0, 'sales_birds' => 0],
                'cumulative' => $cumulative,
                'daily_movements' => array_reverse($daily_movements),
                'last_update' => ['user' => 'مدير النظام', 'time' => now()->format('Y-m-d H:i')]
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'Fatal: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine()
            ], 200); // سنعيدها بكود 200 لتظهر الرسالة بالفرونت إند ولا تنهار الصفحة
        }
    }

    /**
     * إغلاق الفوج.
     */
    public function close(Flock $flock)
    {
        // حساب العمر الفعلي بالدقائق/الأيام من تاريخ الإنشاء لضمان الدقة
        $age = \Carbon\Carbon::parse($flock->created_at)->diffInDays(now());

        if ($age < 35) {
            return response()->json([
                'error' => "لا يمكن إغلاق الفوج قبل عمر 35 يوم. العمر الحالي: {$age} يوم."
            ], 403);
        }

        $flock->update([
            'status' => 'closed',
            'age_days' => $age, // تخزين العمر النهائي عند الإغلاق
            'updated_by' => Auth::id()
        ]);
        
        return response()->json(['message' => 'تم إغلاق الفوج بنجاح وأرشفة البيانات.']);
    }
}
