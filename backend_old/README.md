# نظام إدارة ومحاسبة المداجن (MAA) Backend Foundation

## 1. تصميم قاعدة البيانات (Database Schema)
تم تصميم الجداول لضمان عزل البيانات الكامل باستخدام `farm_id` وربط الأفواج بالعمليات اليومية.

### المداجن والأفواج
- `farms`: (id, name, location, contact, is_active).
- `flocks`: (id, farm_id, batch_number, start_count, current_count, age_days, cost_per_kg, status: open/closed, created_at, updated_at).

### العمليات اليومية (Daily Logs)
- `flock_mortalities`: (flock_id, count, reason, date, created_by, updated_by).
- `flock_feed_logs`: (flock_id, warehouse_item_id, quantity, date, created_by).
- `flock_medicines`: (flock_id, medicine_id, dosage, notes, date, created_by).
- `flock_water_logs`: (flock_id, quantity, notes, date, created_by).
- `flock_notes`: (flock_id, note, date, created_by).

### المحاسبة والمبيعات
- `expense_categories`: (farm_id, name).
- `expenses`: (farm_id, flock_id, category_id, amount, description, date, created_by).
- `sales`: (farm_id, flock_id, customer_name, total_amount, paid_amount, status, date).
- `sale_items`: (sale_id, item_type_id, count, weight, unit_price, total_price).

### الشركاء
- `partners`: (id, name, phone).
- `farm_partner_shares`: (farm_id, partner_id, share_percentage).
- `partner_transactions`: (partner_id, amount, type: credit/debit, notes, created_by).

### المخزون
- `warehouses`: (farm_id, name).
- `items`: (id, name, type_id, unit).
- `item_types`: (id, name: feed, medicine, water, etc.).
- `warehouse_items`: (warehouse_id, item_id, current_stock).
- `inventory_transactions`: (warehouse_item_id, quantity, type: in/out, reference_id, created_by).

## 2. مصفوفة الصلاحيات (Roles/Permissions Matrix)
| الصلاحية | super_admin | farm_admin | partner | worker |
| :--- | :---: | :---: | :---: | :---: |
| إدارة المداجن | ✅ | ❌ | ❌ | ❌ |
| إدارة الحسابات | ✅ | ✅ | ❌ | ❌ |
| عرض التقارير المالية | ✅ | ✅ | ✅ | ❌ |
| العمليات اليومية | ✅ | ✅ | ❌ | ✅ |
| تعديل سجل (15 دقيقة) | ✅ | ✅ | ❌ | ✅ |
| تعديل سجل (بعد 15 دقيقة) | ✅ | ✅ | ❌ | ❌ |

## 3. خرائط المسارات (API Route Map)
- `POST /api/auth/login`: تسجيل الدخول.
- `GET /api/farms`: قائمة المداجن (للمدير).
- `GET /api/flocks`: قائمة الأفواج الجارية.
- `POST /api/flocks/{id}/logs`: إدخال يومي.
- `GET /api/dashboard/summary`: ملخص الحسابات والتشغيل.

## 4. قواعد العمل (Business Rules)
1. **قاعدة الـ 15 دقيقة**: يتم التحقق في الـ Policy أو Request من الوقت المنقضي بين `created_at` والآن إذا كان المستخدم `worker`.
2. **عزل البيانات**: الـ Global Scope في `BelongsToFarm` يضمن تصفية كل الاستعلامات بـ `farm_id`.
3. **صحة الحسابات**: لا يجوز بيع عدد دجاج يتخطى `current_count` الفعلي في الفوج.
4. **الفوج المغلق**: عند إغلاق الفوج (وضع `closed`) يتم قفل جميع العمليات التشغيلية (للمخزون والحسابات) لمنع التلاعب.
