<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flock_medicines', function (Blueprint $table) {
            $table->renameColumn('date', 'start_date');
            $table->date('end_date')->nullable()->after('date');
            $table->string('prescribed_by')->nullable()->after('medicine_name');
            $table->text('notes')->nullable()->after('dosage');
        });
    }

    public function down(): void
    {
        Schema::table('flock_medicines', function (Blueprint $table) {
            $table->renameColumn('start_date', 'date');
            $table->dropColumn(['end_date', 'prescribed_by', 'notes']);
        });
    }
};
