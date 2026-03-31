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
        Schema::create('farm_users', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('user_id')->constrained()->onDelete('cascade');
            $blueprint->foreignId('farm_id')->constrained()->onDelete('cascade');
            $blueprint->string('role')->default('worker'); // farm_admin, worker, partner
            $blueprint->timestamps();

            // ضمان عدم تكرار المستخدم في نفس المدجنة
            $blueprint->unique(['user_id', 'farm_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('farm_users');
    }
};
