<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

$table = 'inventory_transactions';

echo "=== Schema Diagnostics for table: $table ===\n";

if (!Schema::hasTable($table)) {
    echo "Table '$table' does not exist!\n";
    exit(1);
}

$columns = Schema::getColumnListing($table);
echo "Current Columns:\n";
foreach ($columns as $column) {
    echo "- $column\n";
}

echo "\n=== Migration Status ===\n";
try {
    $migrations = DB::table('migrations')->get();
    foreach ($migrations as $m) {
        echo "- {$m->migration} (Batch: {$m->batch})\n";
    }
} catch (\Exception $e) {
    echo "Error reading migrations table: " . $e->getMessage() . "\n";
}

echo "\n=== Missing Column item_id? ===\n";
if (Schema::hasColumn($table, 'item_id')) {
    echo "YES, item_id EXISTS.\n";
} else {
    echo "NO, item_id IS MISSING.\n";
}
