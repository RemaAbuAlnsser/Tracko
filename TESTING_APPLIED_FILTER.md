# 🧪 Testing Applied Filter - Scripts Guide

## نظرة عامة
هذا الدليل يشرح كيفية استخدام السكريبتات لاختبار وإصلاح نظام فلترة المتقدمين.

## 📝 السكريبتات المتوفرة

### 1. `testAppliedFilter.js`
**الغرض:** اختبار وعرض حالة البيانات الحالية

**الاستخدام:**
```bash
cd backend
node scripts/testAppliedFilter.js
```

**ماذا يفعل:**
- ✅ يعرض جميع الطلبات
- ✅ يعرض الطلبات النشطة (applied=1, status=pending)
- ✅ يعرض الطلبات المقبولة
- ✅ يعرض الطلبات المرفوضة
- ✅ يعرض إحصائيات شاملة
- ✅ يتحقق من وجود تناقضات في البيانات

**مثال على المخرجات:**
```
✅ Connected to database

📊 All Applications in Internship_Matches:

┌─────────┬────┬──────────────┬─────────────────────┬──────────────┬─────────┬──────────┬─────────────────────┐
│ (index) │ id │ student_name │ internship_title    │ company_name │ applied │ status   │ applied_at          │
├─────────┼────┼──────────────┼─────────────────────┼──────────────┼─────────┼──────────┼─────────────────────┤
│    0    │ 1  │ 'Ahmad Ali'  │ 'Frontend Developer'│ 'TechCorp'   │    1    │'pending' │ 2025-10-22 10:30:00 │
│    1    │ 2  │ 'Sara Omar'  │ 'Backend Developer' │ 'StartupX'   │    0    │'accepted'│ 2025-10-21 14:20:00 │
└─────────┴────┴──────────────┴─────────────────────┴──────────────┴─────────┴──────────┴─────────────────────┘

📋 Active Applications (applied = 1 AND status = pending):
...

📈 Statistics:

Total Applications: 10
Active (applied=1, status=pending): 5
Accepted: 3
Rejected: 2
Processed (applied=0): 5

🔍 Checking for inconsistencies...

✅ No inconsistencies found - all data is correct!
```

---

### 2. `fixAppliedColumn.js`
**الغرض:** إصلاح البيانات القديمة (تحديث applied إلى 0 للسجلات المقبولة/المرفوضة)

**الاستخدام:**
```bash
cd backend
node scripts/fixAppliedColumn.js
```

**ماذا يفعل:**
- ✅ يفحص السجلات التي تحتاج إصلاح
- ✅ يعرض السجلات التي سيتم تحديثها
- ✅ يقوم بتحديث `applied = 0` للسجلات المقبولة/المرفوضة
- ✅ يتحقق من نجاح التحديث
- ✅ يعرض إحصائيات نهائية

**مثال على المخرجات:**
```
✅ Connected to database

🔍 Checking current state...

Total records: 10
Records needing fix: 3

📋 Records that will be updated:

┌─────────┬────┬──────────────┬─────────────────────┬─────────┬──────────┐
│ (index) │ id │ student_name │ internship_title    │ applied │ status   │
├─────────┼────┼──────────────┼─────────────────────┼─────────┼──────────┤
│    0    │ 2  │ 'Sara Omar'  │ 'Backend Developer' │    1    │'accepted'│
│    1    │ 5  │ 'Ali Hassan' │ 'QA Engineer'       │    1    │'rejected'│
│    2    │ 7  │ 'Noor Ahmad' │ 'DevOps Engineer'   │    1    │'accepted'│
└─────────┴────┴──────────────┴─────────────────────┴─────────┴──────────┘

⚠️  This will update applied = 0 for all accepted/rejected records
🔄 Proceeding with update...

✅ Updated 3 records

🔍 Verifying the fix...

Total records: 10
Still needs fix: 0
Fixed records: 5

✅ All records fixed successfully!

📊 Final Statistics:

┌─────────┬──────────┬─────────┬───────┐
│ (index) │ status   │ applied │ count │
├─────────┼──────────┼─────────┼───────┤
│    0    │'accepted'│    0    │   3   │
│    1    │'pending' │    1    │   5   │
│    2    │'rejected'│    0    │   2   │
└─────────┴──────────┴─────────┴───────┘
```

---

## 🔄 سير العمل الموصى به

### للتطوير والاختبار:

#### 1. **قبل البدء:**
```bash
# اختبر الحالة الحالية
node scripts/testAppliedFilter.js
```

#### 2. **إذا وجدت تناقضات:**
```bash
# أصلح البيانات
node scripts/fixAppliedColumn.js
```

#### 3. **بعد الإصلاح:**
```bash
# تحقق من النتائج
node scripts/testAppliedFilter.js
```

#### 4. **اختبار من المتصفح:**
```bash
# شغل السيرفر
npm start

# افتح المتصفح وسجل دخول كشركة
# اذهب إلى Applicants List
# يجب أن ترى فقط الطلبات المعلقة
```

---

## 📊 استعلامات SQL مفيدة

### عرض جميع الطلبات النشطة:
```sql
SELECT 
  im.id,
  u.full_name,
  i.title,
  im.applied,
  im.status,
  im.applied_at
FROM Internship_Matches im
JOIN Students s ON im.student_id = s.id
JOIN Users u ON s.user_id = u.id
JOIN Internships i ON im.internship_id = i.id
WHERE im.applied = 1 AND im.status = 'pending'
ORDER BY im.applied_at DESC;
```

### إصلاح يدوي:
```sql
-- تحديث جميع السجلات المقبولة/المرفوضة
UPDATE Internship_Matches 
SET applied = 0 
WHERE status IN ('accepted', 'rejected');
```

### التحقق من التناقضات:
```sql
-- البحث عن سجلات غير متسقة
SELECT 
  id,
  applied,
  status
FROM Internship_Matches
WHERE (status IN ('accepted', 'rejected') AND applied = 1)
   OR (status = 'pending' AND applied = 0);
```

### إحصائيات:
```sql
SELECT 
  status,
  applied,
  COUNT(*) as count
FROM Internship_Matches
GROUP BY status, applied
ORDER BY status, applied;
```

---

## 🐛 Troubleshooting

### المشكلة: "No active applications found"
**الحل:**
```bash
# تحقق من وجود بيانات
node scripts/testAppliedFilter.js

# إذا لم يكن هناك طلبات، قم بإنشاء طلب جديد:
# 1. سجل دخول كطالب
# 2. قدم على تدريب
# 3. ارجع للشركة وتحقق
```

### المشكلة: "Found inconsistencies"
**الحل:**
```bash
# أصلح البيانات تلقائياً
node scripts/fixAppliedColumn.js
```

### المشكلة: المتقدمون المقبولون يظهرون في Applicants List
**الحل:**
```bash
# تحقق من قاعدة البيانات
node scripts/testAppliedFilter.js

# إذا كان applied = 1 للمقبولين، أصلحه
node scripts/fixAppliedColumn.js
```

---

## ✅ قائمة التحقق

قبل النشر إلى الإنتاج، تأكد من:

- [ ] تشغيل `testAppliedFilter.js` والتحقق من عدم وجود تناقضات
- [ ] تشغيل `fixAppliedColumn.js` إذا لزم الأمر
- [ ] اختبار القبول من واجهة الشركة
- [ ] اختبار الرفض من واجهة الشركة
- [ ] التحقق من اختفاء المتقدمين بعد القبول/الرفض
- [ ] التحقق من ظهور المقبولين في Accepted Students
- [ ] التحقق من عدم ظهور المرفوضين في أي قائمة

---

## 📝 ملاحظات

- ✅ السكريبتات آمنة للاستخدام في الإنتاج
- ✅ لا تحذف أي بيانات - فقط تحدث `applied` column
- ✅ يمكن تشغيلها عدة مرات بدون مشاكل
- ✅ تعرض معلومات مفصلة عن كل عملية
- ✅ تتحقق من النتائج تلقائياً

---

## 🔗 ملفات ذات صلة

- `APPLICANTS_LIST_APPLIED_FILTER.md` - توثيق كامل للميزة
- `backend/models/InternshipMatch.js` - Model الرئيسي
- `backend/routes/matching.js` - API endpoints
- `frontend/src/pages/CompanyDashboard.js` - واجهة الشركة
