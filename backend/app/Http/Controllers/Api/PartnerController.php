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
    public function index()
    {
        $farmId = FarmContext::getFarmId();
        
        // Return partners belonging to this farm via shares
        return Partner::join('farm_partner_shares', 'partners.id', '=', 'farm_partner_shares.partner_id')
            ->where('farm_partner_shares.farm_id', $farmId)
            ->select(
                'partners.*', 
                'farm_partner_shares.share_percentage',
                DB::raw('(SELECT SUM(amount) FROM partner_transactions WHERE partner_id = partners.id AND farm_id = ' . $farmId . ' AND type IN (\'capital_entry\', \'profit_distribution\')) as total_in'),
                DB::raw('(SELECT SUM(amount) FROM partner_transactions WHERE partner_id = partners.id AND farm_id = ' . $farmId . ' AND type = \'withdrawal\') as total_out')
            )
            ->get()
            ->map(function($p) {
                $p->current_balance = ($p->total_in ?? 0) - ($p->total_out ?? 0);
                return $p;
            });
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:6',
            'share_percentage' => 'required|numeric|min:0.01|max:100',
            'initial_capital' => 'nullable|numeric|min:0',
        ]);

        $farmId = FarmContext::getFarmId();

        // Check total shares
        $currentTotalShares = DB::table('farm_partner_shares')
            ->where('farm_id', $farmId)
            ->sum('share_percentage');

        if (($currentTotalShares + $request->share_percentage) > 100.01) {
            return response()->json([
                'error' => 'لا يمكن إضافة شريك بهذه النسبة. المتبقي هو ' . (100 - $currentTotalShares) . '%'
            ], 422);
        }

        return DB::transaction(function () use ($request, $farmId) {
            $email = $request->phone . '@whatsapp.com';
            if (User::where('email', $email)->exists()) {
                $email = $request->phone . '_' . time() . '@whatsapp.com';
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $email,
                'password' => Hash::make($request->password),
            ]);

            // Ensure the 'partner' role exists before assigning
            if (!\Spatie\Permission\Models\Role::where('name', 'partner')->exists()) {
                \Spatie\Permission\Models\Role::create(['name' => 'partner']);
            }
            $user->assignRole('partner');

            // Insert into farm_users (Corrected: No is_active column)
            DB::table('farm_users')->insert([
                'farm_id' => $farmId,
                'user_id' => $user->id,
                'role' => 'partner',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create Partner record (Corrected: only schema columns)
            $partner = Partner::create([
                'user_id' => $user->id,
                'name' => $request->name,
                'phone' => $request->phone,
            ]);

            // Create Share record
            DB::table('farm_partner_shares')->insert([
                'farm_id' => $farmId,
                'partner_id' => $partner->id,
                'share_percentage' => $request->share_percentage,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Initial Capital log
            $capital = $request->initial_capital ?? 0;
            if ($capital > 0) {
                PartnerTransaction::create([
                    'farm_id' => $farmId,
                    'partner_id' => $partner->id,
                    'amount' => $capital,
                    'type' => 'capital_entry',
                    'date' => now()->format('Y-m-d'),
                    'notes' => 'رأس المال التأسيسي',
                    'created_by' => Auth::id(),
                ]);
            }

            return response()->json([
                'message' => 'تم إنشاء الشريك بنجاح.',
                'partner' => $partner,
            ], 201);
        });
    }

    public function storeTransaction(Request $request)
    {
        $request->validate([
            'partner_id' => 'required|exists:partners,id',
            'amount' => 'required|numeric|min:1',
            'type' => 'required|in:capital_entry,withdrawal', // تم إعادة السحب اليدوي بناءً على طلب المستخدم
            'date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
            $farmId = FarmContext::getFarmId();
            
            // تحقق من الرصيد في حال كان السحب يدوياً
            if ($request->type === 'withdrawal') {
                $total_in = PartnerTransaction::where('partner_id', $request->partner_id)
                    ->where('farm_id', $farmId)
                    ->whereIn('type', ['capital_entry', 'profit_distribution'])
                    ->sum('amount');
                $total_out = PartnerTransaction::where('partner_id', $request->partner_id)
                    ->where('farm_id', $farmId)
                    ->where('type', 'withdrawal')
                    ->sum('amount');
                
                $currentBalance = $total_in - $total_out;

                if ($request->amount > $currentBalance) {
                    return response()->json([
                        'error' => "عذراً، الرصيد المتوفر ({$currentBalance} ل.س) غير كافٍ لهذا السحب. الرصيد السالب مسموح فقط في حالات الخسارة الآلية."
                    ], 422);
                }
            }

            $transaction = PartnerTransaction::create([
                'farm_id' => $farmId,
                'partner_id' => $request->partner_id,
                'amount' => $request->amount,
                'type' => $request->type,
                'date' => $request->date,
                'notes' => $request->notes,
                'created_by' => Auth::id(),
            ]);

            return response()->json($transaction, 201);
        });
    }

    public function transactions($partnerId)
    {
        return PartnerTransaction::where('partner_id', $partnerId)
            ->where('farm_id', \App\Models\FarmContext::getFarmId())
            ->latest()
            ->get();
    }

    public function distribute(Request $request)
    {
        $request->validate([
            'total_amount' => 'required|numeric|min:1',
            'type' => 'required|in:profit_distribution,withdrawal',
            'date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $farm_id = \App\Models\FarmContext::getFarmId();
        
        $shares = DB::table('farm_partner_shares')
            ->join('partners', 'partners.id', '=', 'farm_partner_shares.partner_id')
            ->where('farm_partner_shares.farm_id', $farm_id)
            ->select('partners.id', 'farm_partner_shares.share_percentage')
            ->get();

        if ($shares->isEmpty()) {
            return response()->json(['error' => 'لا يوجد شركاء مسجلين لهذ المدجنة لتوزيع المبالغ عليهم.'], 422);
        }

        return DB::transaction(function () use ($request, $shares, $farm_id) {
            $totalDistributed = 0;
            foreach ($shares as $share) {
                $partner_amount = ($request->total_amount * $share->share_percentage) / 100;
                $totalDistributed += $partner_amount;

                PartnerTransaction::create([
                    'farm_id' => $farm_id,
                    'partner_id' => $share->id,
                    'amount' => $partner_amount,
                    'type' => $request->type,
                    'date' => $request->date,
                    'notes' => "[توزيع آلي - حصة {$share->share_percentage}%] " . ($request->notes ?? ''),
                    'created_by' => Auth::id(),
                ]);
            }

            return response()->json([
                'success' => true, 
                'message' => 'تم توزيع المبالغ بنجاح على كافة الشركاء.',
                'total_distributed' => $totalDistributed
            ]);
        });
    }
}
