<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Flock;
use App\Models\FlockMortality;
use App\Models\FlockFeedLog;
use App\Models\FlockNote;
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
     * قائمة الأفواج في المدجنة الحالية (Tenant list).
     */
    public function index()
    {
        return Flock::orderBy('created_at', 'desc')->get();
    }

    /**
     * إنشاء فوج جديد.
     */
    public function store(Request $request)
    {
        $request->validate([
            'batch_number' => 'required|string|unique:flocks',
            'start_count' => 'required|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        $flock = Flock::create([
            'farm_id' => session('current_farm_id'), // تلقائي عبر الـ Trait لكننا للتأكيد نمرره
            'batch_number' => $request->batch_number,
            'start_count' => $request->start_count,
            'current_count' => $request->start_count,
            'status' => 'open',
            'created_by' => Auth::id(),
            'notes' => $request->notes,
        ]);

        return response()->json($flock, 201);
    }

    /**
     * تسجيل النفوق (Mortality entry).
     */
    public function addMortality(Request $request, Flock $flock)
    {
        $request->validate([
            'count' => 'required|integer|min:1',
            'reason' => 'nullable|string',
        ]);

        // 1. التحقق من أن الفوج مفتوح
        if ($flock->status === 'closed') {
            return response()->json(['error' => 'الفوج مغلق، لا يمكن الإدخال.'], 403);
        }

        // 2. التحقق من العدد المتبقي
        if ($request->count > $flock->current_count) {
             return response()->json(['error' => 'لا يمكن بيع عدد أكبر من العدد الحي.'], 403);
        }

        return DB::transaction(function () use ($request, $flock) {
            $log = FlockMortality::create([
                'flock_id' => $flock->id,
                'count' => $request->count,
                'reason' => $request->reason,
                'date' => now()->toDateString(),
                'created_by' => Auth::id(),
            ]);

            // مزامنة العدد الحي الحالي
            $this->flockService::syncCurrentCount($flock);

            return response()->json($log, 201);
        });
    }

    /**
     * تسجيل العلف (Feed entry).
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
}
