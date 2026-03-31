<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farm;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class FarmController extends Controller
{
    /**
     * إنشاء مدجنة جديدة + مدير لها
     */
    public function store(Request $request)
    {
        $request->validate([
            'farm_name' => 'required|string|max:255',
            'manager_name' => 'required|string|max:255',
            'manager_email' => 'required|email|unique:users,email',
            'manager_password' => 'required|min:8',
        ]);

        return DB::transaction(function () use ($request) {
            // 1. إنشاء المزرعة
            $farm = Farm::create([
                'name' => $request->farm_name,
                'location' => $request->location ?? 'غير محدد',
                'is_active' => true,
            ]);

            // 2. إنشاء المدير
            $manager = User::create([
                'name' => $request->manager_name,
                'email' => $request->manager_email,
                'password' => Hash::make($request->manager_password),
            ]);

            // 3. ربط المدير بالمزرعة
            $manager->assignRole('farm_admin');
            $manager->farms()->attach($farm->id, ['role' => 'farm_admin']);

            return response()->json([
                'message' => 'تم إنشاء المزرعة والمدير بنجاح',
                'farm' => $farm,
            ], 201);
        });
    }

    /**
     * تبديل حالة المزرعة (نشطة / متوقفة)
     */
    public function toggleStatus(Farm $farm)
    {
        $farm->update([
            'is_active' => !$farm->is_active
        ]);

        return response()->json([
            'message' => 'تم تحديث حالة المزرعة',
            'is_active' => $farm->is_active
        ]);
    }
}
