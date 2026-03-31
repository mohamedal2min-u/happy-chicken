<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\PartnerTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PartnerController extends Controller
{
    /**
     * قائمة الشركاء المرتبطين بالمدجنة الحالية.
     */
    public function index()
    {
        return Partner::whereHas('farms', function($q) {
            $q->where('farm_id', session('current_farm_id'));
        })->get();
    }

    /**
     * تسجيل سحوبات أو أرباح لشريك.
     */
    public function registerTransaction(Request $request)
    {
        $request->validate([
            'partner_id' => 'required|exists:partners,id',
            'amount' => 'required|numeric',
            'type' => 'required|in:capital_entry,withdrawal,profit_distribution',
            'date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $transaction = PartnerTransaction::create([
            'partner_id' => $request->partner_id,
            'farm_id' => session('current_farm_id'),
            'amount' => $request->amount,
            'type' => $request->type,
            'notes' => $request->notes,
            'date' => $request->date,
            'created_by' => Auth::id(),
        ]);

        return response()->json($transaction, 201);
    }
}
