<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. تصنيفات المصاريف
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farm_id')->constrained()->onDelete('cascade');
            $table->string('name'); // مثلاً: كهرباء، أجار، تدفئة
            $table->timestamps();
        });

        // 2. المصاريف
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farm_id')->constrained()->onDelete('cascade');
            $table->foreignId('flock_id')->nullable()->constrained()->onDelete('set null'); // مصاريف عامة للمدجنة أو للفوج
            $table->foreignId('category_id')->constrained('expense_categories');
            $table->decimal('amount', 12, 2);
            $table->string('description')->nullable();
            $table->date('date');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        // 3. المبيعات
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farm_id')->constrained()->onDelete('cascade');
            $table->foreignId('flock_id')->constrained()->onDelete('cascade');
            $table->string('customer_name')->nullable();
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->date('date');
            $table->enum('status', ['pending', 'partially_paid', 'paid'])->default('pending');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        // 4. بنود المبيعات
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->onDelete('cascade');
            $table->integer('count')->default(0); // عدد الطيور
            $table->decimal('total_weight', 10, 2)->default(0); // الوزن الإجمالي
            $table->decimal('unit_price', 10, 2); // سعر الكيلو
            $table->decimal('total_price', 12, 2); // إجمالي السعر
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('expense_categories');
    }
};
