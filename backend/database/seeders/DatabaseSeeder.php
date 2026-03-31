<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Farm;
use App\Models\ItemType;
use App\Models\Item;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. تشغيل الأدوار أولاً
        $this->call(RoleSeeder::class);

        // إنشاء مستخدم المدير العام (Super Admin) - صلاحيات مطلقة للنظام بالكامل
        $superAdmin = User::create([
            'name' => 'المدير العام للنظام',
            'email' => 'super@admin.com',
            'password' => Hash::make('admin1234'),
        ]);
        $superAdmin->assignRole('super_admin');

        // 2. إنشاء مستخدم مدير المداجن (Farm Admin)
        $admin = User::create([
            'name' => 'مدير المدجنة',
            'email' => 'admin@farm.com',
            'password' => Hash::make('password123'),
        ]);
        $admin->assignRole('farm_admin');

        // إنشاء مستخدم تجربة ببيانات بسيطة
        $testUser = User::create([
            'name' => 'تجربة دخول',
            'email' => 'test@test.com',
            'password' => Hash::make('12345678'),
        ]);
        $testUser->assignRole('farm_admin');

        // 3. إنشاء مستخدم عامل (Worker)
        $worker = User::create([
            'name' => 'عامل المزرعة',
            'email' => 'worker@farm.com',
            'password' => Hash::make('password123'),
        ]);
        $worker->assignRole('worker');

        // 4. إنشاء المزارع
        $farm1 = Farm::create([
            'name' => 'مدجنة الأمل النموذجية',
            'location' => 'ريف دمشق',
        ]);

        $farm2 = Farm::create([
            'name' => 'مدجنة الخير البركة',
            'location' => 'ريف حمص',
        ]);

        // 5. ربط المستخدمين بالمدجنة الأولى (كمثال لمدير مزرعة)
        DB::table('farm_users')->insert([
            ['user_id' => $admin->id, 'farm_id' => $farm1->id, 'role' => 'farm_admin'],
            ['user_id' => $worker->id, 'farm_id' => $farm1->id, 'role' => 'worker'],
            ['user_id' => $testUser->id, 'farm_id' => $farm1->id, 'role' => 'farm_admin'],
        ]);

        // 6. أنواع المواد الأساسية
        $feed = ItemType::create(['name' => 'علف']);
        $medicine = ItemType::create(['name' => 'دواء']);

        Item::create(['type_id' => $feed->id, 'name' => 'علف صوص منقوع', 'unit' => 'kg']);
        Item::create(['type_id' => $medicine->id, 'name' => 'لقاح نيوكاسل', 'unit' => 'dose']);

        // 7. إنشاء فوج مفتوح تجريبي
        DB::table('flocks')->insert([
            'farm_id' => $farm1->id,
            'batch_number' => 'F-2024-001',
            'start_count' => 1000,
            'current_count' => 1000,
            'age_days' => 5,
            'status' => 'open',
            'created_by' => $admin->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
