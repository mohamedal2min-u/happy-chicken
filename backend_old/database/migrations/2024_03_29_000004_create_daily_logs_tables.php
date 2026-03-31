<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. النفوق
        Schema::create('flock_mortalities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flock_id')->constrained()->onDelete('cascade');
            $table->integer('count')->default(0);
            $table->string('reason')->nullable();
            $table->date('date');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
        });

        // 2. العلف (سيتم الربط مع المخزون لاحقاً)
        Schema::create('flock_feed_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flock_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity', 10, 2); // بالكيلو
            $table->date('date');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
        });

        // 3. الأدوية
        Schema::create('flock_medicines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flock_id')->constrained()->onDelete('cascade');
            $table->string('medicine_name'); // للتجربة الآن، لاحقاً نربطه بالمخزون
            $table->string('dosage')->nullable();
            $table->date('date');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
        });

        // 4. المياه
        Schema::create('flock_water_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flock_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity', 10, 2); // بلتر
            $table->date('date');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
        });

        // 5. الملاحظات
        Schema::create('flock_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flock_id')->constrained()->onDelete('cascade');
            $table->text('note');
            $table->date('date');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flock_notes');
        Schema::dropIfExists('flock_water_logs');
        Schema::dropIfExists('flock_medicines');
        Schema::dropIfExists('flock_feed_logs');
        Schema::dropIfExists('flock_mortalities');
    }
};
