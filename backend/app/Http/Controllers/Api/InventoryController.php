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

class InventoryController extends Controller
{
    public function index()
    {
        // 1. Get items for this farm
        $items = Item::with('type')->get();
        
        // 2. Summary
        $summary = [
            'feed' => $items->filter(fn($i) => str_contains($i->type?->name ?? '', 'علف'))->sum('current_quantity'),
            'medicine' => $items->filter(fn($i) => (str_contains($i->type?->name ?? '', 'دواء') || str_contains($i->type?->name ?? '', 'لقاح')))->count(),
            'coal' => $items->filter(fn($i) => str_contains($i->type?->name ?? '', 'فحم'))->sum('current_quantity'),
        ];

        // 3. Transactions
        $farmId = FarmContext::getFarmId();
        $transactions = InventoryTransaction::where('farm_id', $farmId)
            ->with(['item', 'creator'])
            ->latest()
            ->take(15)
            ->get();

        return response()->json([
            'items' => $items,
            'summary' => $summary,
            'recent_transactions' => $transactions
        ]);
    }

    public function addShipment(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:items,id',
            'quantity' => 'required|numeric|min:0.1',
            'price_per_unit' => 'nullable|numeric',
        ]);

        $item = Item::findOrFail($request->item_id);
        $farmId = FarmContext::getFarmId();

        if ($item->farm_id !== $farmId) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        return DB::transaction(function () use ($request, $item, $farmId) {
            // 1. Ensure we have a default warehouse for this farm
            $warehouseId = DB::table('warehouses')
                ->where('farm_id', $farmId)
                ->value('id');

            if (!$warehouseId) {
                $warehouseId = DB::table('warehouses')->insertGetId([
                    'farm_id' => $farmId,
                    'name' => 'المستودع الرئيسي',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 2. Ensure we have a warehouse_item entry
            $warehouseItemId = DB::table('warehouse_items')
                ->where('warehouse_id', $warehouseId)
                ->where('item_id', $item->id)
                ->value('id');

            if (!$warehouseItemId) {
                $warehouseItemId = DB::table('warehouse_items')->insertGetId([
                    'warehouse_id' => $warehouseId,
                    'item_id' => $item->id,
                    'current_stock' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 3. Handle Invoice
            $invoicePath = null;
            if ($request->hasFile('invoice')) {
                $invoicePath = $request->file('invoice')->store('invoices/inventory', 'public');
            }

            $price = $request->price_per_unit ?? 0;

            // 4. Create Transaction
            $transaction = InventoryTransaction::create([
                'farm_id' => $farmId,
                'item_id' => $item->id,
                'warehouse_item_id' => $warehouseItemId,
                'quantity' => $request->quantity,
                'type' => 'in',
                'price_per_unit' => $price,
                'total_cost' => $price * $request->quantity,
                'payment_status' => $price > 0 ? 'paid' : 'debt',
                'invoice_path' => $invoicePath,
                'created_by' => Auth::id(),
            ]);

            // 5. AUTO-ACCOUNTING: Create Expense if price provided
            if ($transaction->total_cost > 0) {
                // Find or create 'Stock Purchases' category for this farm
                $categoryId = DB::table('expense_categories')
                    ->where('farm_id', $farmId)
                    ->where('name', 'مشتريات مخزنية')
                    ->value('id');

                if (!$categoryId) {
                    $categoryId = DB::table('expense_categories')->insertGetId([
                        'farm_id' => $farmId,
                        'name' => 'مشتريات مخزنية',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // Identify Active Flock if not provided
                $flockId = $request->flock_id;
                if (!$flockId) {
                    $flockId = DB::table('flocks')
                        ->where('farm_id', $farmId)
                        ->where('is_closed', false)
                        ->orderBy('id', 'desc')
                        ->value('id');
                }

                \App\Models\Expense::create([
                    'farm_id' => $farmId,
                    'flock_id' => $flockId,
                    'category_id' => $categoryId,
                    'amount' => $transaction->total_cost,
                    'description' => "مشتريات مخزنية: {$item->name} - كمية: {$request->quantity} {$item->unit}",
                    'date' => now()->format('Y-m-d'),
                    'created_by' => Auth::id(),
                ]);
            }

            // 6. Update Item Stock (both in items and warehouse_items)
            $item->increment('current_quantity', $request->quantity);
            DB::table('warehouse_items')
                ->where('id', $warehouseItemId)
                ->increment('current_stock', $request->quantity);

            return response()->json([
                'message' => 'تم تسجيل الشحنة وتحديث المخزون والمحاسبة بنجاح.',
                'transaction' => $transaction,
                'current_stock' => $item->current_quantity
            ], 201);
        });
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'type_name' => 'required|string',
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

    public function destroy(Item $item)
    {
        if ($item->farm_id !== FarmContext::getFarmId()) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }

        if ($item->transactions()->exists()) {
             return response()->json(['error' => 'لا يمكن حذف المادة لوجود حركات سابقة مجمعة'], 422);
        }

        $item->delete();
        return response()->json(['message' => 'تم الحذف بنجاح من المستودع.']);
    }
}
