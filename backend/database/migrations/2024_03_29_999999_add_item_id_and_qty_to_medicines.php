<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flock_medicines', function (Blueprint $table) {
            $table->foreignId('item_id')->nullable()->constrained('items')->onDelete('set null');
            $table->decimal('daily_quantity', 12, 4)->default(0); // مثلاً بالمللي أو بالجرعة
            // تأكد من أن end_date سيصبح مطلوباً إذا كان هناك استهلاك محسوب
        });
    }

    public function down(): void
    {
        Schema::table('flock_medicines', function (Blueprint $table) {
            $table->dropConstrainedForeignId('item_id');
            $table->dropColumn('daily_quantity');
        });
    }
};
