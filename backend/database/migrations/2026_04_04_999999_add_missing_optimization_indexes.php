<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->index('farm_id');
            $table->index('flock_id');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->index('farm_id');
            $table->index('flock_id');
        });

        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->index('farm_id');
            $table->index('item_id');
        });

        Schema::table('items', function (Blueprint $table) {
            $table->index('farm_id');
        });

        Schema::table('flocks', function (Blueprint $table) {
            $table->index('farm_id');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex(['farm_id']);
            $table->dropIndex(['flock_id']);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['farm_id']);
            $table->dropIndex(['flock_id']);
        });

        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->dropIndex(['farm_id']);
            $table->dropIndex(['item_id']);
        });

        Schema::table('items', function (Blueprint $table) {
            $table->dropIndex(['farm_id']);
        });

        Schema::table('flocks', function (Blueprint $table) {
            $table->dropIndex(['farm_id']);
        });
    }
};
