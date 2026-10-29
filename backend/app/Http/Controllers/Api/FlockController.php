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
use App\Models\PartnerTransaction;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\FarmContext;

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
        // Return all flocks but separate by status logically if needed,
        // for now just all flocks ordered by creation
        return Flock::select('id', 'batch_number', 'current_count', 'age_days', 'status', 'start_date', 'end_date', 'is_historical', 'created_at')
            ->orderByRaw("CASE WHEN status = 'open' THEN 0 ELSE 1 END")
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

        return DB::transaction(function () use ($request) {
            $flock = Flock::create([
                'batch_number' => $request->batch_number,
                'start_count' => $request->start_count,
                'current_count' => $request->start_count,
                'chick_price' => $request->chick_price,
                'status' => 'open',
                'start_date' => now()->toDateString(),
                'created_by' => Auth::id(),
                'notes' => $request->notes,
            ]);

            $this->recordChicksExpense($flock, now()->toDateString());

            return response()->json($flock, 201);
        });
    }

    /**
     * تسجيل ثمن الصيصان (العدد × السعر) كمصروف في تصنيف "صيصان".
     */
    private function recordChicksExpense(Flock $flock, string $date): void
    {
        $total = round($flock->start_count * $flock->chick_price, 2);
        if ($total <= 0) {
            return;
        }
        $category = ExpenseCategory::firstOrCreate(['farm_id' => $flock->farm_id, 'name' => 'صيصان']);
        Expense::create([
            'farm_id' => $flock->farm_id,
            'flock_id' => $flock->id,
            'category_id' => $category->id,
            'amount' => $total,
            'description' => "{$flock->start_count} صوص × {$flock->chick_price} $",
            'date' => $date,
            'created_by' => Auth::id(),
        ]);
    }

    /**
     * إدخال فوج سابق (منتهٍ) دفعة واحدة: الفوج بتواريخه، المصاريف كلٌّ في تصنيفه،
     * المبيعات، النفوق، وتوزيع الربح على الشركاء بتاريخ نهاية الفوج.
     */
    public function storeHistorical(Request $request)
    {
        $request->validate([
            'batch_number' => 'required|string|unique:flocks',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date|before_or_equal:today',
            'start_count' => 'required|integer|min:1',
            'chick_price' => 'required|numeric|min:0',
            'mortality_count' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'distribute_profit' => 'boolean',
            'expenses' => 'array',
            'expenses.*.category' => 'required|string|max:100',
            'expenses.*.amount' => 'required|numeric|min:0.01',
            'expenses.*.description' => 'nullable|string',
            'expenses.*.date' => 'nullable|date',
            'sales' => 'array',
            'sales.*.customer_name' => 'nullable|string',
            'sales.*.date' => 'nullable|date',
            'sales.*.count' => 'nullable|integer|min:0',
            'sales.*.total_weight' => 'nullable|numeric|min:0',
            'sales.*.unit_price' => 'nullable|numeric|min:0',
            'sales.*.total_amount' => 'required|numeric|min:0.01',
            'sales.*.paid_amount' => 'nullable|numeric|min:0',
        ]);

        $soldCount = collect($request->sales ?? [])->sum(fn($s) => (int) ($s['count'] ?? 0));
        $mortality = (int) ($request->mortality_count ?? 0);
        if ($soldCount + $mortality > $request->start_count) {
            return response()->json(['error' => 'عدد الطيور المباعة مع النفوق أكبر من العدد الابتدائي.'], 422);
        }

        $farmId = FarmContext::getFarmId();
        if ($request->boolean('distribute_profit')) {
            $totalShare = DB::table('farm_partner_shares')->where('farm_id', $farmId)->sum('share_percentage');
            if (abs($totalShare - 100) > 0.01) {
                return response()->json(['error' => "مجموع حصص الشركاء ({$totalShare}%) لا يساوي 100%، عدّل الحصص أو ألغِ توزيع الربح."], 422);
            }
        }

        return DB::transaction(function () use ($request, $farmId, $mortality) {
            $startDate = \Carbon\Carbon::parse($request->start_date);
            $endDate = \Carbon\Carbon::parse($request->end_date);
            $userId = Auth::id();

            $flock = Flock::create([
                'farm_id' => $farmId,
                'batch_number' => $request->batch_number,
                'start_count' => $request->start_count,
                'current_count' => $request->start_count,
                'age_days' => $startDate->diffInDays($endDate),
                'status' => 'closed',
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'is_historical' => true,
                'chick_price' => $request->chick_price,
                'created_by' => $userId,
                'notes' => $request->notes,
            ]);

            // ثمن الصيصان مصروف مستقل، وبقية المصاريف كلٌّ في تصنيفه
            $this->recordChicksExpense($flock, $startDate->toDateString());
            $expenses = $request->expenses ?? [];
            foreach ($expenses as $e) {
                $category = ExpenseCategory::firstOrCreate(['farm_id' => $farmId, 'name' => trim($e['category'])]);
                Expense::create([
                    'farm_id' => $farmId,
                    'flock_id' => $flock->id,
                    'category_id' => $category->id,
                    'amount' => round($e['amount'], 2),
                    'description' => $e['description'] ?? null,
                    'date' => $e['date'] ?? $startDate->toDateString(),
                    'created_by' => $userId,
                ]);
            }

            foreach ($request->sales ?? [] as $s) {
                $total = round((float) $s['total_amount'], 2);
                $paid = isset($s['paid_amount']) ? min((float) $s['paid_amount'], $total) : $total;
                $sale = Sale::create([
                    'farm_id' => $farmId,
                    'flock_id' => $flock->id,
                    'customer_name' => $s['customer_name'] ?? null,
                    'total_amount' => $total,
                    'paid_amount' => $paid,
                    'date' => $s['date'] ?? $endDate->toDateString(),
                    'status' => $paid <= 0 ? 'pending' : ($paid >= $total ? 'paid' : 'partially_paid'),
                    'created_by' => $userId,
                ]);
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'count' => (int) ($s['count'] ?? 0),
                    'total_weight' => (float) ($s['total_weight'] ?? 0),
                    'unit_price' => (float) ($s['unit_price'] ?? 0),
                    'total_price' => $total,
                ]);
            }

            if ($mortality > 0) {
                FlockMortality::create([
                    'flock_id' => $flock->id,
                    'count' => $mortality,
                    'reason' => 'إجمالي نفوق الفوج السابق',
                    'date' => $endDate->toDateString(),
                    'created_by' => $userId,
                ]);
            }

            $this->flockService->syncCurrentCount($flock);

            $totalSales = $flock->sales()->sum('total_amount');
            $totalExpenses = $flock->expenses()->sum('amount');
            $netProfit = round($totalSales - $totalExpenses, 2);

            if ($request->boolean('distribute_profit') && $netProfit != 0) {
                $shares = DB::table('farm_partner_shares')->where('farm_id', $farmId)->get();
                foreach ($shares as $share) {
                    PartnerTransaction::create([
                        'farm_id' => $farmId,
                        'partner_id' => $share->partner_id,
                        'amount' => abs(round(($netProfit * $share->share_percentage) / 100, 2)),
                        'type' => $netProfit >= 0 ? 'profit_distribution' : 'withdrawal',
                        'date' => $endDate->toDateString(),
                        'notes' => "[توزيع فوج سابق #{$flock->batch_number}] حصة %{$share->share_percentage} من صافي " . number_format($netProfit, 2) . " $",
                        'created_by' => $userId,
                    ]);
                }
            }

            return response()->json([
                'flock' => $flock->fresh(),
                'stats' => [
                    'sales' => (float) $totalSales,
                    'expenses' => (float) $totalExpenses,
                    'net_profit' => $netProfit,
                ],
            ], 201);
        });
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
            $start_date = \Carbon\Carbon::parse($flock->start_date ?? $flock->created_at)->startOfDay();
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
     * إغلاق الفوج وتوزيع الأرباح/الخسائر آلياً بناءً على الحصص.
     */
    public function close(Flock $flock)
    {
        if ($flock->status === 'closed') {
            return response()->json(['error' => 'هذا الفوج مغلق مسبقاً.'], 422);
        }

        // حساب العمر الفعلي بالدقائق/الأيام من تاريخ الإنشاء لضمان الدقة
        $age = \Carbon\Carbon::parse($flock->created_at)->diffInDays(now());

        if ($age < 35) {
            return response()->json([
                'error' => "لا يمكن إغلاق الفوج قبل عمر 35 يوم. العمر الحالي: {$age} يوم."
            ], 403);
        }

        // حساب المبيعات والمصاريف الخاصة بهذا الفوج
        $totalSales = $flock->sales()->sum('total_amount');
        $totalExpenses = $flock->expenses()->sum('amount');
        $netProfit = $totalSales - $totalExpenses;

        $totalShare = DB::table('farm_partner_shares')->where('farm_id', $flock->farm_id)->sum('share_percentage');
        if (abs($totalShare - 100) > 0.01) {
            return response()->json(['error' => "مجموع حصص الشركاء ({$totalShare}%) لا يساوي 100%، عدّل الحصص قبل الإغلاق."], 422);
        }

        return DB::transaction(function () use ($flock, $age, $netProfit, $totalSales, $totalExpenses) {
            // 1. تحديث حالة الفوج وتوثيق البيانات النهائية
            $flock->update([
                'status' => 'closed',
                'end_date' => now()->toDateString(),
                'age_days' => $age,
                'updated_by' => Auth::id()
            ]);

            // 2. توزيع المبالغ على الشركاء آلياً بناءً على حصصهم في المدجنة
            $farm_id = $flock->farm_id;
            $shares = DB::table('farm_partner_shares')
                ->where('farm_id', $farm_id)
                ->get();

            $distributedCount = 0;
            foreach ($shares as $share) {
                // نصيب الشريك من صافي الربح أو الخسارة
                $partnerAmount = round(($netProfit * $share->share_percentage) / 100, 2);
                
                // نوع الحركة: إذا كان ربح -> توزيع (+)، إذا كانت خسارة -> سحب (-)
                $type = $netProfit >= 0 ? 'profit_distribution' : 'withdrawal';
                
                PartnerTransaction::create([
                    'farm_id' => $farm_id,
                    'partner_id' => $share->partner_id,
                    'amount' => abs($partnerAmount),
                    'type' => $type,
                    'date' => now()->toDateString(),
                    'notes' => "[توزيع آلي - إغلاق فوج #{$flock->batch_number}] " . 
                               "بناءً على حصة مساهمة تبلغ %{$share->share_percentage}. " .
                               "إجمالي صافي الربح/الخسارة: " . number_format($netProfit) . " ل.س",
                    'created_by' => Auth::id(),
                ]);
                $distributedCount++;
            }

            return response()->json([
                'message' => 'تم إغلاق الفوج بنجاح وتوزيع العوائد المالية على كافة الشركاء آلياً.',
                'stats' => [
                    'sales' => $totalSales,
                    'expenses' => $totalExpenses,
                    'net_profit' => $netProfit,
                    'partners_affected' => $distributedCount
                ]
            ]);
        });
    }
}
