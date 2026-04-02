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
            // التحقق من هوية الفوج لضمان عدم وجود تداخل بيانات
            $flock->load(['mortalities.creator', 'feedLogs', 'waterLogs', 'expenses.category', 'sales.items', 'medicines']);
            
            $today = \Carbon\Carbon::today()->toDateString();
            $start_date = \Carbon\Carbon::parse($flock->created_at)->startOfDay();
            $BAG_WEIGHT = 50; 

            // تجميع البيانات اليومية
            $mortsByDate = ($flock->mortalities ?? collect())->groupBy('date');
            $feedsByDate = ($flock->feedLogs ?? collect())->groupBy('date');
            $expensesByDate = ($flock->expenses ?? collect())->groupBy('date');
            $salesByDate = ($flock->sales ?? collect())->groupBy('date');

            $total_mortality = $flock->mortalities->sum('count');
            $start_count = $flock->start_count ?: 0;
            $mortality_rate = $start_count > 0 ? round(($total_mortality / $start_count) * 100, 2) : 0;
            $survival_rate = max(0, 100 - $mortality_rate);

            $cumulative = [
                'total_mortality' => (int)$total_mortality,
                'total_feed_kg' => (float)($flock->feedLogs->sum('quantity') ?? 0),
                'total_water' => (float)($flock->waterLogs->sum('quantity') ?? 0),
                'total_expenses' => (float)($flock->expenses->sum('amount') ?? 0),
                'total_sales' => (float)($flock->sales->sum('total_amount') ?? 0),
                'total_medicine_types' => ($flock->medicines ?? collect())->unique('medicine_name')->count(),
            ];
            $cumulative['total_feed_bags'] = round($cumulative['total_feed_kg'] / $BAG_WEIGHT, 1);
            $cumulative['net_profit'] = $cumulative['total_sales'] - $cumulative['total_expenses'];

            $daily_movements = [];
            $running_count = $start_count;
            $age_days = (int)($flock->age_days ?? 0);
            $active_days = max(1, $age_days);
            $total_est_feed_kg = 0;
            
            for ($i = 0; $i < $active_days; $i++) {
                $age = $i + 1;
                $current_date = (clone $start_date)->addDays($i)->toDateString();
                
                $est_feed_per_bird = 13 + ($age * 5.2); 
                $d_estimated_feed_kg = ($est_feed_per_bird * $running_count) / 1000;
                $total_est_feed_kg += $d_estimated_feed_kg;

                $d_estimated_blackout = ($age <= 2) ? 1 : (($age >= 30) ? 2 : 6);

                $dayMorts = $mortsByDate->get($current_date, collect());
                $dayFeeds = $feedsByDate->get($current_date, collect());
                $dayExpenses = $expensesByDate->get($current_date, collect());
                $daySales = $salesByDate->get($current_date, collect());

                $d_mortality = $dayMorts->sum('count');
                $d_sales_count = $daySales->sum(fn($s) => ($s->items ?? collect())->sum('count'));
                $d_feed_kg = $dayFeeds->sum('quantity');
                $d_expense_amount = $dayExpenses->sum('amount');
                
                $d_expense_summary = $dayExpenses->map(function($ex){ 
                    return $ex->description ?: ($ex->category ? $ex->category->name : 'مصروف'); 
                })->unique()->filter()->implode('، ');

                $active_meds = ($flock->medicines ?? collect())->filter(function($m) use ($current_date) {
                    return $m->start_date <= $current_date && (!$m->end_date || $m->end_date >= $current_date);
                });

                $end_of_day = max(0, $running_count - $d_mortality - $d_sales_count);
                $first_log = $dayMorts->first();

                $daily_movements[] = [
                    'day' => $age,
                    'date' => $current_date,
                    'mortality' => (int)$d_mortality,
                    'actual_feed_bags' => round($d_feed_kg / $BAG_WEIGHT, 2),
                    'estimated_feed_bags' => round($d_estimated_feed_kg / $BAG_WEIGHT, 2),
                    'estimated_blackout' => (int)$d_estimated_blackout,
                    'expense_amount' => (float)$d_expense_amount,
                    'expense_summary' => $d_expense_summary ?: 'لا يوجد',
                    'medicine_count' => $active_meds->count(),
                    'medicine_list' => $active_meds->map(fn($m) => [
                        'name' => $m->medicine_name,
                        'dr' => $m->prescribed_by
                    ]),
                    'updated_by' => $first_log?->creator?->name ?? '---',
                    'updated_at' => $first_log?->updated_at ? $first_log->updated_at->format('H:i') : '---',
                    'notes' => $first_log?->reason ?? '',
                ];
                
                $running_count = $end_of_day;
            }

            $cumulative['total_estimated_feed_bags'] = round($total_est_feed_kg / $BAG_WEIGHT, 1);
            $last_mort = ($flock->mortalities ?? collect())->last();

            return response()->json([
                'success' => true,
                'flock' => $flock,
                'kpis' => [
                    'mortality_rate' => $mortality_rate,
                    'survival_rate' => $survival_rate,
                ],
                'today' => [
                    'date' => $today,
                    'mortality' => $mortsByDate->get($today, collect())->sum('count'),
                    'feed_bags' => round($feedsByDate->get($today, collect())->sum('quantity') / $BAG_WEIGHT, 1),
                    'expense' => $expensesByDate->get($today, collect())->sum('amount'),
                    'sales_birds' => $salesByDate->get($today, collect())->sum(fn($s) => ($s->items ?? collect())->sum('count')),
                ],
                'cumulative' => $cumulative,
                'daily_movements' => array_reverse($daily_movements),
                'last_update' => [
                    'user' => $last_mort?->creator?->name ?? 'مدير النظام',
                    'time' => $flock->updated_at ? $flock->updated_at->format('Y-m-d H:i') : '---',
                ]
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'Server Error: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    /**
     * إغلاق الفوج.
     */
    public function close(Flock $flock)
    {
        if ($flock->age_days < 35) {
            return response()->json(['error' => 'لا يمكن إغلاق الفوج قبل عمر 35 يوم.'], 403);
        }

        $flock->update(['status' => 'closed']);
        return response()->json(['message' => 'تم إغلاق الفوج بنجاح.']);
    }
}
