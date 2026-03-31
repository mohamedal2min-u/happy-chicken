<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFarmContext
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // استخراج farm_id من رأس الطلب X-Farm-ID
        $farmId = $request->header('X-Farm-ID');

        if ($farmId) {
            // تخزينه في الجلسة لاستخدامه في Traits/Scopes
            session(['current_farm_id' => (int) $farmId]);
        }

        return $next($request);
    }
}
