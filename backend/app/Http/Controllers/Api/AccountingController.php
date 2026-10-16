<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Sale;
use App\Models\Flock;
use App\Models\ExpenseCategory;
use App\Models\FarmContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AccountingController extends Controller
{
    /**
     * قائمة المصاريف للمدجنة (المشار إليها في farm_id).
     */
    public function getExpenses(Request $request)
    {
        return Expense::with(['category', 'flock'])->orderBy('date', 'desc')->get();
    }

    /**
     * تسجيل مصروف جديد.
     */
    public function storeExpense(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        $farmId = FarmContext::getFarmId();

        // التأكد من وجود تصنيف أو إنشاء واحد افتراضي "مصاريف عامة"
        $categoryId = $request->category_id;
        if (!$categoryId || !DB::table('expense_categories')->where('id', $categoryId)->exists()) {
            $cat = ExpenseCategory::firstOrCreate(
                ['farm_id' => $farmId, 'name' => 'مصاريف عامة'],
                ['farm_id' => $farmId, 'name' => 'مصاريف عامة']
            );
            $categoryId = $cat->id;
        }

        $expense = Expense::create([
            'farm_id' => $farmId,
            'category_id' => $categoryId,
            'flock_id' => $request->flock_id,
            'amount' => $request->amount,
            'date' => $request->date ?? now()->toDateString(),
            'description' => $request->description,
            'created_by' => Auth::id(),
        ]);

        return response()->json($expense, 201);
    }

    /**
     * تسجيل عملية مبيع مع التفاصيل (عدد، وزن، صورة).
     */
    public function storeSale(Request $request)
    {
        $request->validate([
            'flock_id' => 'required|exists:flocks,id',
            'customer_name' => 'nullable|string',
            'date' => 'required|date',
            'count' => 'required|integer|min:1',
            'total_weight' => 'required|numeric|min:0.5',
            'unit_price' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'invoice_image' => 'nullable|image|max:5120', // بحد أقصى 5 ميجا
        ]);

        $flock = Flock::where('id', $request->flock_id)->where('status', 'open')->first();
        if (!$flock) {
            return response()->json(['error' => 'الفوج غير موجود أو مغلق.'], 422);
        }

        $imagePath = null;
        if ($request->hasFile('invoice_image')) {
            $imagePath = $request->file('invoice_image')->store('invoices', 'public');
        }

        $totalAmount = round((float) ($request->total_amount ?? (($request->unit_price ?? 0) * $request->total_weight)), 2);
        $paidAmount = (float) ($request->paid_amount ?? 0);
        if ($paidAmount > $totalAmount) {
            return response()->json(['error' => 'المبلغ المدفوع يتجاوز إجمالي الفاتورة.'], 422);
        }
        $status = $paidAmount <= 0 ? 'pending' : ($paidAmount >= $totalAmount ? 'paid' : 'partially_paid');

        $sale = Sale::create([
            'farm_id' => FarmContext::getFarmId(),
            'flock_id' => $request->flock_id,
            'customer_name' => $request->customer_name,
            'total_amount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'date' => $request->date,
            'status' => $status,
            'invoice_image' => $imagePath,
            'created_by' => Auth::id(),
        ]);

        // تسجيل البند التفصيلي لعملية البيع
        \App\Models\SaleItem::create([
            'sale_id' => $sale->id,
            'count' => $request->count,
            'total_weight' => $request->total_weight,
            'unit_price' => $request->unit_price ?? 0,
            'total_price' => $totalAmount,
        ]);

        app(\App\Services\FlockService::class)->syncCurrentCount($flock);

        return response()->json($sale->load('items'), 201);
    }

    /**
     * تسجيل دفعة على فاتورة مبيع (ذمم العملاء).
     */
    public function paySale(Request $request, Sale $sale)
    {
        if ($sale->farm_id !== FarmContext::getFarmId()) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        $request->validate(['amount' => 'required|numeric|min:0.01']);

        $remaining = round($sale->total_amount - $sale->paid_amount, 2);
        if ($request->amount > $remaining) {
            return response()->json(['error' => "المبلغ يتجاوز المتبقي ({$remaining})."], 422);
        }

        $sale->paid_amount = round($sale->paid_amount + $request->amount, 2);
        $sale->status = $sale->paid_amount >= $sale->total_amount ? 'paid' : 'partially_paid';
        $sale->save();

        return response()->json($sale);
    }

    /**
     * قائمة المبيعات للمدجنة.
     */
    public function getSales(Request $request)
    {
        return Sale::orderBy('date', 'desc')->get();
    }

    /**
     * حذف مصروف.
     */
    public function destroyExpense(Expense $expense)
    {
        if ($expense->farm_id !== FarmContext::getFarmId()) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }
        $expense->delete();
        return response()->json(['message' => 'تم حذف المصروف بنجاح.']);
    }

    /**
     * حذف عملية مبيع.
     */
    public function destroySale(Sale $sale)
    {
        if ($sale->farm_id !== FarmContext::getFarmId()) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }
        DB::transaction(function () use ($sale) {
            $flock = Flock::find($sale->flock_id);
            if ($sale->invoice_image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($sale->invoice_image);
            }
            $sale->delete();
            if ($flock) {
                app(\App\Services\FlockService::class)->syncCurrentCount($flock);
            }
        });
        return response()->json(['message' => 'تم حذف المبيعات بنجاح.']);
    }
}
