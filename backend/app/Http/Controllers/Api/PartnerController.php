<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\PartnerTransaction;
use App\Models\FarmContext;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PartnerController extends Controller
{
    /**
     * عرض قائمة الشركاء وحساباتهم الحالية.
     */
    public function index()
    {
        return Partner::all();
    }

    /**
     * تسجيل شريك جديد مع حساب دخول (مشاهدة فقط).
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|unique:partners,phone|max:20',
            'password' => 'required|string|min:6',
            'share_percentage' => 'required|numeric|min:0.01|max:100',
        ]);

        $farmId = FarmContext::getFarmId();

        // 1. التأكد من أن مجموع الحصص لا يتجاوز 100%
        $currentTotalShares = DB::table('farm_partner_shares')
            ->where('farm_id', $farmId)
            ->sum('share_percentage');

        if (($currentTotalShares + $request->share_percentage) > 100.01) {
            return response()->json([
                'error' => 'لا يمكن إضافة شريك بهذه النسبة. المتبقي هو ' . (100 - $currentTotalShares) . '%'
            ], 422);
        }

        return DB::transaction(function () use ($request, $farmId) {
            // 2. إنشاء مستخدم كـ "مشاهد" (Viewer) بالواتساب
            $user = User::create([
                'name' => $request->name,
                'email' => $request->phone . '@whatsapp.com', // استخدام الرقم كإيميل افتراضي
                'password' => Hash::make($request->password),
            ]);

            // تعيين دور المشاهد للمستخدم
            $user->assignRole('viewer');

            // ربط المستخدم بالمدجنة الحالية كعضو
            DB::table('farm_users')->insert([
                'farm_id' => $farmId,
                'user_id' => $user->id,
                'role' => 'viewer',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 3. إنشاء سجل الشريك وربطه بالمستخدم
            $partner = Partner::create([
                'user_id' => $user->id,
                'name' => $request->name,
                'phone' => $request->phone,
            ]);

            // 4. ربط الحصة بالمدجنة
            DB::table('farm_partner_shares')->insert([
                'farm_id' => $farmId,
                'partner_id' => $partner->id,
                'share_percentage' => $request->share_percentage,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'message' => 'تم إنشاء الشريك وحساب الدخول بنجاح.',
                'partner' => $partner,
                'login_details' => [
                    'username' => $request->phone . '@whatsapp.com',
                    'password' => $request->password,
                ]
            ], 201);
        });
    }

    /**
     * تسجيل عملية مالية لشريك (سحب أو مساهمة).
     */
    public function storeTransaction(Request $request)
    {
        $request->validate([
            'partner_id' => 'required|exists:partners,id',
            'amount' => 'required|numeric',
            'type' => 'required|in:capital_entry,withdrawal,profit_distribution',
            'date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $transaction = PartnerTransaction::create([
            'farm_id' => FarmContext::getFarmId(),
            'partner_id' => $request->partner_id,
            'amount' => $request->amount,
            'type' => $request->type,
            'date' => $request->date,
            'notes' => $request->notes,
            'created_by' => Auth::id(),
        ]);

        return response()->json($transaction, 201);
    }
}
