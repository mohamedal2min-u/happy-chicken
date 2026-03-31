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
        Schema::table('flocks', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->index('date');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->index('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('flocks', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex(['date']);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['date']);
        });
    }
};
