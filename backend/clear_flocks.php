<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

use App\Models\Flock;

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// حذف كافة الأفواج، والبيانات المرتبطة سيتم حذفها تلقائياً بسبب Cascade Delete
$count = Flock::count();
Flock::truncate();

echo "Successfully deleted $count flocks and all related data.\n";
