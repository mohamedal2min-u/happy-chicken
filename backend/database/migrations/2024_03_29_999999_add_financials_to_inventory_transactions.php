<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->foreignId('farm_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->foreignId('item_id')->nullable()->after('farm_id')->constrained()->onDelete('cascade');
            $table->decimal('price_per_unit', 12, 2)->nullable();
            $table->decimal('total_cost', 15, 2)->nullable();
            $table->string('invoice_path')->nullable();
            $table->string('payment_status')->default('paid'); // paid, debt
        });
    }

    public function down(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->dropColumn(['price_per_unit', 'total_cost', 'invoice_path', 'payment_status', 'farm_id', 'item_id']);
        });
    }
};
