<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FlockController;
use App\Http\Controllers\Api\AccountingController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FarmUserController;
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

        // 4. الحسابات والمحاسبة
        Route::prefix('accounting')->group(function () {
            Route::get('expenses', [AccountingController::class, 'getExpenses']);
            Route::post('expenses', [AccountingController::class, 'storeExpense']);
            Route::get('sales', [AccountingController::class, 'getSales']);
            Route::post('sales', [AccountingController::class, 'storeSale']);
        });

        // 5. المخزون (Inventory)
        Route::prefix('inventory')->group(function () {
            Route::get('/', [InventoryController::class, 'index']);
            Route::post('/', [InventoryController::class, 'store']);
        });

        // 6. الشركاء (Partners)
        Route::prefix('partners')->group(function () {
            Route::get('/', [PartnerController::class, 'index']);
            Route::post('/', [PartnerController::class, 'store']);
            Route::post('/transaction', [PartnerController::class, 'storeTransaction']);
        });

        // 7. ملخص اللوحة الرئيسية (Dashboard)
        Route::get('dashboard/summary', [DashboardController::class, 'getSummary']);

        // 8. إدارة أعضاء المدجنة لمسؤولي المزرعة
        Route::prefix('members')->group(function () {
             Route::get('/', [FarmUserController::class, 'index']);
             Route::post('/', [FarmUserController::class, 'addMember']);
        });
    });

    // 9. إدارة المداجن المركزية (للمدير العام فقط - خارج سياق المزرعة)
    Route::middleware(['role:super_admin'])->group(function () {
        Route::post('/farms', [\App\Http\Controllers\Api\FarmController::class, 'store']);
        Route::patch('/farms/{farm}/toggle-status', [\App\Http\Controllers\Api\FarmController::class, 'toggleStatus']);
        Route::get('/admin/summary', [\App\Http\Controllers\Api\DashboardController::class, 'getSuperAdminSummary']);
    });

});
