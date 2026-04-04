<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\DB;

class CheckFarmContext
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. محاولة جلب farm_id من رأس الطلب (X-Farm-ID)
        $farmId = $request->header('X-Farm-ID');

        // 2. إذا لم يتوفر، نحاول استنتاجه من المستخدم المسجل (للسلامة البرمجية)
        if (empty($farmId) && $request->user()) {
            $user = $request->user();
            
            // إذا كان مدير عام، نأخذ أول مدجنة في النظام كوضع افتراضي
            if ($user->role === 'super_admin') {
                $farmId = DB::table('farms')->value('id');
            } else {
                // للموظف أو مدير المزرعة، نأخذ أول مدجنة مرتبط بها
                $farmId = DB::table('farm_users')
                    ->where('user_id', $user->id)
                    ->value('farm_id');
            }
        }

        if ($farmId) {
            \App\Models\FarmContext::setFarmId((int) $farmId);
        }

        return $next($request);
    }
}
