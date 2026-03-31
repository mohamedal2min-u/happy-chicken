<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

$table = 'inventory_transactions';

echo "<h1>Schema Diagnostics for table: $table</h1>";

if (!Schema::hasTable($table)) {
    echo "Table '$table' does not exist!<br>";
    exit(1);
}

$columns = Schema::getColumnListing($table);
echo "<h2>Current Columns:</h2><ul>";
foreach ($columns as $column) {
    echo "<li>$column</li>";
}
echo "</ul>";

echo "<h2>Migration Status</h2><ul>";
try {
    $migrations = DB::table('migrations')->orderBy('id', 'desc')->limit(20)->get();
    foreach ($migrations as $m) {
        echo "<li>{$m->migration} (Batch: {$m->batch})</li>";
    }
} catch (\Exception $e) {
    echo "<li>Error reading migrations table: " . $e->getMessage() . "</li>";
}
echo "</ul>";

echo "<h2>Check item_id Column</h2>";
if (Schema::hasColumn($table, 'item_id')) {
    echo "<p style='color:green'>YES, item_id EXISTS.</p>";
} else {
    echo "<p style='color:red'>NO, item_id IS MISSING.</p>";
}
