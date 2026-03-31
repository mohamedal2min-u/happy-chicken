<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Sale;
use App\Models\Flock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
            'category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:1',
            'flock_id' => 'nullable|exists:flocks,id',
            'date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        $expense = Expense::create([
            'farm_id' => session('current_farm_id'),
            'category_id' => $request->category_id,
            'flock_id' => $request->flock_id,
            'amount' => $request->amount,
            'date' => $request->date ?? now()->toDateString(),
            'description' => $request->description,
            'created_by' => Auth::id(),
        ]);

        return response()->json($expense, 201);
    }

    /**
     * تسجيل عملية بيع.
     */
    public function storeSale(Request $request)
    {
        $request->validate([
            'flock_id' => 'required|exists:flocks,id',
            'customer_name' => 'nullable|string',
            'total_amount' => 'required|numeric|min:1',
            'paid_amount' => 'nullable|numeric|min:0',
            'date' => 'required|date',
        ]);

        $sale = Sale::create([
            'farm_id' => session('current_farm_id'),
            'flock_id' => $request->flock_id,
            'customer_name' => $request->customer_name,
            'total_amount' => $request->total_amount,
            'paid_amount' => $request->paid_amount ?? 0,
            'date' => $request->date,
            'status' => ($request->paid_amount >= $request->total_amount) ? 'paid' : 'pending',
            'created_by' => Auth::id(),
        ]);

        return response()->json($sale, 201);
    }
}
