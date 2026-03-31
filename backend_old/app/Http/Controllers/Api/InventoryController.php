<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Models\WarehouseItem;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    /**
     * جلب مخزون المستودعات للمدجنة الحالية.
     */
    public function getInventory()
    {
        return Warehouse::with('items.item')->get();
    }

    /**
     * إضافة مخزون (إدخال مستودعي).
     */
    public function addStock(Request $request)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'item_id' => 'required|exists:items,id',
            'quantity' => 'required|numeric|min:0.1',
        ]);

        return DB::transaction(function () use ($request) {
            $warehouseItem = WarehouseItem::firstOrCreate([
                'warehouse_id' => $request->warehouse_id,
                'item_id' => $request->item_id,
            ]);

            $warehouseItem->increment('current_stock', $request->quantity);

            // تسجيل الحركة
            InventoryTransaction::create([
                'warehouse_item_id' => $warehouseItem->id,
                'quantity' => $request->quantity,
                'type' => 'in',
                'created_by' => Auth::id(),
            ]);

            return response()->json($warehouseItem->load('item'), 201);
        });
    }
}
