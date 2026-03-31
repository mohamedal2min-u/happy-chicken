<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FlockController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// 1. المسارات العامة
Route::post('/login', [AuthController::class, 'login']);

// 2. المسارات المحمية (طلب التوكن)
Route::middleware(['auth:sanctum'])->group(function () {
    
    // تسجيل الخروج
    Route::post('/logout', [AuthController::class, 'logout']);

    // 3. المسارات المعزولة بمبدأ Farm Context
    Route::middleware(['check.farm'])->group(function () {
        
        // إدارة الأفواج
        Route::apiResource('flocks', FlockController::class);

        // سجلات تشغيلية سريعة للفوج
        Route::prefix('flocks/{flock}')->group(function () {
            Route::post('mortalities', [FlockController::class, 'addMortality']);
            Route::post('feed', [FlockController::class, 'addFeed']);
            Route::post('medicine', [FlockController::class, 'addMedicine']);
            Route::post('water', [FlockController::class, 'addWater']);
            Route::post('notes', [FlockController::class, 'addNote']);
        });

        // 4. الحسابات (المصاريف والمبيعات)
        Route::get('expenses', [AccountingController::class, 'getExpenses']);
        Route::post('expenses', [AccountingController::class, 'storeExpense']);
        Route::post('sales', [AccountingController::class, 'storeSale']);

        // 5. ملخص اللوحة الرئيسية (Dashboard)
        Route::get('dashboard/summary', [\App\Http\Controllers\Api\DashboardController::class, 'getSummary']);

        // 6. إدارة أعضاء المدجنة لمسؤولي المزرعة
        Route::prefix('members')->group(function () {
             Route::get('/', [\App\Http\Controllers\Api\FarmUserController::class, 'index']);
             Route::post('/', [\App\Http\Controllers\Api\FarmUserController::class, 'addMember']);
        });

        // سيتم إضافة مسارات الحسابات، المبيعات، الشركاء والمخزون تباعاً
    });
});
