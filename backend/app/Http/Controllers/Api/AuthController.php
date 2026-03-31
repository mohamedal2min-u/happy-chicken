<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * تسجيل الدخول وجلب التوكن.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'device_name' => 'required', // مطلوب للـ Sanctum (Flutter/Next.js)
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['بيانات الاعتماد غير صحيحة.'],
            ]);
        }

        // 1. إنشاء التوكن
        $token = $user->createToken($request->device_name)->plainTextToken;

        // 2. جلب المداجن المرتبط بها المستخدم
        if ($user->hasRole('super_admin')) {
            $farms = \App\Models\Farm::where('is_active', true)->get();
        } else {
            $farms = $user->farms()->where('is_active', true)->get();
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
            ],
            'token' => $token,
            'farms' => $farms, // ليتمكن المستخدم من اختيار المدجنة حالاً
        ]);
    }

    /**
     * تسجيل الخروج.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'تم تسجيل الخروج بنجاح.']);
    }
}
