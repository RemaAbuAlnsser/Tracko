# Database Migrations

## Post-Merge Migrations (mergevideocall → videacall)

بعد دمج برانش `mergevideocall` في `videacall`, يجب تشغيل الـ migrations التالية:

### 1. Migration 007: Add domain to Universities
```bash
mysql -u root -p tracko_db < 007_add_domain_to_universities.sql
```
**الغرض:** إضافة عمود `domain` لجدول Universities لتسهيل التحقق من البريد الإلكتروني للطلاب.

### 2. Migration 008: Add number_of_students to Internships
```bash
mysql -u root -p tracko_db < 008_add_number_of_students_to_internships.sql
```
**الغرض:** تتبع عدد الطلاب المقبولين في كل تدريب للتحقق من السعة.

### 3. Migration 009: Update notifications type enum
```bash
mysql -u root -p tracko_db < 009_update_notifications_type_enum.sql
```
**الغرض:** إضافة أنواع إشعارات جديدة:
- `registration_approved` - إشعار الموافقة على التسجيل
- `task_deadline` - إشعارات المواعيد النهائية للمهام

### 4. Migration 010: Complete merge updates
```bash
mysql -u root -p tracko_db < 010_complete_merge_updates.sql
```
**الغرض:** إضافة الأعمدة المتبقية:
- `hours_per_week` في Internship_Matches
- `due_date` في Plan_Weeks

## تشغيل جميع الـ Migrations دفعة واحدة

```bash
cd backend/migrations
for file in 007_*.sql 008_*.sql 009_*.sql 010_*.sql; do
  echo "Running $file..."
  mysql -u root -p tracko_db < "$file"
done
```

## التحقق من التحديثات

```bash
mysql -u root -p tracko_db -e "
  SELECT 'Universities:' as '';
  DESCRIBE Universities;
  
  SELECT 'Internships:' as '';
  DESCRIBE Internships;
  
  SELECT 'Internship_Matches:' as '';
  DESCRIBE Internship_Matches;
  
  SELECT 'Plan_Weeks:' as '';
  DESCRIBE Plan_Weeks;
  
  SELECT 'Notifications type:' as '';
  SHOW COLUMNS FROM notifications WHERE Field = 'type';
"
```

## الميزات الجديدة بعد الدمج

### 1. نظام إشعارات المواعيد النهائية
- إشعارات تلقائية قبل 24 ساعة من انتهاء موعد المهام
- Cron job يعمل كل ساعة للتحقق من المواعيد

### 2. تحسينات AI Matching
- فلترة التدريبات الممتلئة تلقائياً
- عدم عرض التدريبات التي وصلت للسعة القصوى

### 3. ساعات العمل الأسبوعية
- الطلاب يحددون عدد ساعات العمل عند التقديم (minimum 20 hours)
- تتبع أفضل لالتزامات الطلاب

### 4. مواعيد نهائية للأسابيع
- كل أسبوع في الخطة التدريبية له موعد نهائي
- إشعارات تلقائية للطلاب والمدربين

## ملاحظات مهمة

⚠️ **تأكد من عمل backup لقاعدة البيانات قبل تشغيل أي migrations**

```bash
mysqldump -u root -p tracko_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

✅ **بعد تشغيل الـ migrations:**
1. أعد تشغيل السيرفر
2. تحقق من عدم وجود أخطاء في console
3. جرب عملية التسجيل للطلاب
4. تحقق من عمل AI matching
