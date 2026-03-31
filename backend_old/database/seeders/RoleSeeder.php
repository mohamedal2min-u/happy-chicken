<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. إعادة تعيين ذاكرة التخزین المؤقت للصلاحيات (Spatie)
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 2. تعریف الصلاحيات الأساسية
        $permissions = [
            'manage_farms',
            'manage_users',
            'view_reports',
            'manage_flocks',
            'create_daily_logs',
            'edit_daily_logs_unrestricted',
            'manage_accounting',
            'manage_partners',
            'manage_inventory',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'api');
        }

        // 3. إنشاء الأدوار وتحصين الصلاحيات
        
        // سوبر أدمن: صلاحيات مطلقة
        Role::findOrCreate('super_admin', 'api')->syncPermissions(Permission::all());

        // مدير المزرعة: إدارة كل شيء داخل مزرعته فقط
        Role::findOrCreate('farm_admin', 'api')->syncPermissions([
            'manage_users', 'view_reports', 'manage_flocks', 'create_daily_logs', 
            'edit_daily_logs_unrestricted', 'manage_accounting', 'manage_partners', 'manage_inventory'
        ]);

        // الشريك: عرض التقارير فقط
        Role::findOrCreate('partner', 'api')->syncPermissions([
            'view_reports'
        ]);

        // العامل: إدخال بيانات يومية فقط
        Role::findOrCreate('worker', 'api')->syncPermissions([
            'manage_flocks', 'create_daily_logs'
        ]);
    }
}
