<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\ItemType;
use App\Models\InventoryTransaction;
use App\Models\FarmContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class InventoryController extends Controller
{
    /**
     * عرض قائمة المخزون للمدجنة الحالية مع التفاصيل والملخص.
     */
    public function index()
    {
        $items = Item::with('type')->get();

        // ملخص البطاقات (Cards)
        $summary = [
            'feed' => $items->filter(fn($i) => str_contains($i->type->name, 'علف'))->sum('current_quantity'),
            'medicine' => $items->filter(fn($i) => str_contains($i->type->name, 'دواء'))->count(),
            'coal' => $items->filter(fn($i) => str_contains($i->type->name, 'فحم'))->sum('current_quantity'),
        ];

        return response()->json([
            'items' => $items,
            'summary' => $summary,
            'recent_transactions' => InventoryTransaction::whereHas('item', function($q) {
                $q->where('farm_id', \App\Models\FarmContext::getFarmId());
            })->with('item')
            ->latest()
            ->take(10)
            ->get()
        ]);
    }

    /**
     * تسجيل حمولة جديدة (Shipment IN).
     */
    public function addShipment(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:items,id',
            'quantity' => 'required|numeric|min:0.1',
            'price_per_unit' => 'nullable|numeric',
            'invoice' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $item = Item::findOrFail($request->item_id);
        
        return DB::transaction(function () use ($request, $item) {
            $invoicePath = null;
            if ($request->hasFile('invoice')) {
                $invoicePath = $request->file('invoice')->store('invoices/inventory', 'public');
            }
            $price = $request->price_per_unit ?? 0;
            $total = $price * $request->quantity;

            $transaction = InventoryTransaction::create([
                'item_id' => $item->id,
                'quantity' => $request->quantity,
                'type' => 'in',
                'price_per_unit' => $price,
                'total_cost' => $total,
                'payment_status' => $price > 0 ? 'paid' : 'debt',
                'invoice_path' => $invoicePath,
                'created_by' => Auth::id(),
            ]);

            $item->increment('current_quantity', $request->quantity);

            return response()->json($transaction, 201);
        });
    }

    /**
     * إضافة مادة جديدة للمخزن.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'type_name' => 'required|string', // علف، دواء، فحم
            'unit' => 'required|string',
        ]);

        $type = ItemType::firstOrCreate(['name' => $request->type_name]);

        $item = Item::create([
            'farm_id' => FarmContext::getFarmId(),
            'type_id' => $type->id,
            'name' => $request->name,
            'unit' => $request->unit,
            'current_quantity' => 0,
        ]);

        return response()->json($item, 201);
    }
}
