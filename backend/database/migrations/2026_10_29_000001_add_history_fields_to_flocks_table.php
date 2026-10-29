<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flocks', function (Blueprint $table) {
            // تواريخ الدورة الفعلية (للأفواج السابقة التي تُدخل بعد انتهائها)
            $table->date('start_date')->nullable()->after('status');
            $table->date('end_date')->nullable()->after('start_date');
            $table->boolean('is_historical')->default(false)->after('end_date');
            $table->decimal('chick_price', 10, 3)->default(0)->after('start_count');
        });
    }

    public function down(): void
    {
        Schema::table('flocks', function (Blueprint $table) {
            $table->dropColumn(['start_date', 'end_date', 'is_historical', 'chick_price']);
        });
    }
};
