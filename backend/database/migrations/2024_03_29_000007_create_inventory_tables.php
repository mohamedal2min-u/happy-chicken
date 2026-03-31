<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. أنواع المواد (علف، دواء، تدفئة، إلخ)
        Schema::create('item_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // 2. المواد (مثلاً: علف صوص منقوع، علف نهائي)
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('type_id')->constrained('item_types');
            $table->string('name');
            $table->string('unit')->default('kg'); // kg, liter, package
            $table->decimal('min_quantity', 10, 2)->default(0); // حد الطلب
            $table->timestamps();
        });

        // 3. المستودعات في كل مدجنة
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farm_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->timestamps();
        });

        // 4. رصيد المخزون الفعلي في المزرعة لمواد معينة
        Schema::create('warehouse_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
            $table->foreignId('item_id')->constrained()->onDelete('cascade');
            $table->decimal('current_stock', 12, 2)->default(0);
            $table->timestamps();
            $table->unique(['warehouse_id', 'item_id']);
        });

        // 5. حركات المخزون (إدخال، إخراج، استهلاك)
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_item_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity', 10, 2);
            $table->enum('type', ['in', 'out', 'transfer', 'consumption']);
            $table->string('reference_type')->nullable(); // مثلا "sale", "flock_feed_log"
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
        Schema::dropIfExists('warehouse_items');
        Schema::dropIfExists('warehouses');
        Schema::dropIfExists('items');
        Schema::dropIfExists('item_types');
    }
};
