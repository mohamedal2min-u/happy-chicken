<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. الشركاء
        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->timestamps();
        });

        // 2. حصص الشركاء في كل مدجنة
        Schema::create('farm_partner_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farm_id')->constrained()->onDelete('cascade');
            $table->foreignId('partner_id')->constrained()->onDelete('cascade');
            $table->decimal('share_percentage', 5, 2); // مثلاً: 25.00%
            $table->timestamps();
            $table->unique(['farm_id', 'partner_id']);
        });

        // 3. التحركات المالية للشركاء (إيداع، سحب، أرباح)
        Schema::create('partner_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->onDelete('cascade');
            $table->foreignId('farm_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 12, 2);
            $table->enum('type', ['capital_entry', 'withdrawal', 'profit_distribution']);
            $table->text('notes')->nullable();
            $table->date('date');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_transactions');
        Schema::dropIfExists('farm_partner_shares');
        Schema::dropIfExists('partners');
    }
};
