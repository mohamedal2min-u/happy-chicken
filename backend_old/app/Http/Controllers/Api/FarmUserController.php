<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Farm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FarmUserController extends Controller
{
    /**
     * قائمة المستخدمين في المدجنة الحالية.
     */
    public function index()
    {
        $farmId = session('current_farm_id');
        $farm = Farm::findOrFail($farmId);

        return $farm->users()->get();
    }

    /**
     * إضافة مستخدم حالي للمدجنة (ربط مستخدم).
     */
    public function addMember(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'role' => 'required|in:farm_admin,worker,partner',
        ]);

        $farmId = session('current_farm_id');
        $user = User::where('email', $request->email)->first();

        // 1. التحقق من عدم وجوده مسبقاً
        if (DB::table('farm_users')->where('user_id', $user->id)->where('farm_id', $farmId)->exists()) {
             return response()->json(['error' => 'المستخدم موجود مسبقاً في هذه المصلحة.'], 403);
        }

        // 2. الربط وإعطاء الدور (Role)
        DB::table('farm_users')->insert([
            'user_id' => $user->id,
            'farm_id' => $farmId,
            'role' => $request->role,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. مزامنة دور الصلاحيات (Spatie Role)
        $user->assignRole($request->role);

        return response()->json(['message' => 'تمت إضافة العضو بنجاح.'], 201);
    }
}
