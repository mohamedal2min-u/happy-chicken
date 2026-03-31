<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('flocks', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('farm_id')->constrained()->onDelete('cascade');
            $blueprint->string('batch_number')->unique(); // مثلا: F-2024-001
            $blueprint->integer('start_count')->default(0);
            $blueprint->integer('current_count')->default(0);
            $blueprint->integer('age_days')->default(0);
            $blueprint->decimal('cost_per_kg', 10, 2)->default(0.00);
            $blueprint->enum('status', ['open', 'closed'])->default('open');
            $blueprint->text('notes')->nullable();
            
            // للأغراض الرقابية
            $blueprint->foreignId('created_by')->nullable()->constrained('users');
            $blueprint->foreignId('updated_by')->nullable()->constrained('users');
            
            $blueprint->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flocks');
    }
};
