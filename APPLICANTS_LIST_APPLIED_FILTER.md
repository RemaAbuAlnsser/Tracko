# 📋 Applicants List - Applied Filter Feature

## نظرة عامة
تم تعديل نظام عرض المتقدمين في CompanyDashboard بحيث:
- يعرض فقط المتقدمين الذين `applied = 1` و `status = 'pending'`
- عند قبول أو رفض المتقدم، يتم تحديث `applied` إلى `0`
- بالتالي لن يظهر المتقدم في قائمة Applicants List بعد القبول أو الرفض

## 🔧 التعديلات المطبقة

### 1. في `InternshipMatch.js` Model:

#### دالة `updateStatus`:
```javascript
// Update status and set applied to 0 when accepting or rejecting
const updateStatusQuery = `
  UPDATE Internship_Matches 
  SET status = ?, applied = 0
  WHERE id = ?
`;
```

**التغيير:**
- إضافة `applied = 0` في الـ UPDATE query
- يتم تطبيقه على كل من القبول والرفض

#### دالة `getApplicantsByCompany`:
```javascript
WHERE i.company_id = ? AND im.applied = TRUE AND im.status = 'pending'
```

**الفلترة:**
- `applied = TRUE` - فقط المتقدمين النشطين
- `status = 'pending'` - فقط الطلبات المعلقة
- يستثني المقبولين (`accepted`) والمرفوضين (`rejected`)

#### دالة `getAcceptedApplicantsByCompany`:
```javascript
WHERE i.company_id = ? AND im.status = 'accepted'
```

**الفلترة:**
- `status = 'accepted'` - فقط المقبولين
- **لا يفلتر بـ `applied`** - لأن `applied = 0` بعد القبول

## 📊 جدول Internship_Matches

### الأعمدة المهمة:
```sql
- id: معرف السجل
- student_id: معرف الطالب
- internship_id: معرف التدريب
- applied: BOOLEAN (1 = نشط، 0 = تمت معالجته)
- status: ENUM('pending', 'accepted', 'rejected')
- applied_at: تاريخ التقديم
- match_percentage: نسبة المطابقة
```

## 🔄 دورة حياة الطلب

### 1. **عند تقديم الطالب:**
```sql
INSERT INTO Internship_Matches 
SET applied = 1, status = 'pending', applied_at = NOW()
```
- يظهر في Applicants List ✅

### 2. **عند قبول الطلب:**
```sql
UPDATE Internship_Matches 
SET status = 'accepted', applied = 0
WHERE id = ?
```
- لا يظهر في Applicants List ❌
- يظهر في Accepted Students ✅

### 3. **عند رفض الطلب:**
```sql
UPDATE Internship_Matches 
SET status = 'rejected', applied = 0
WHERE id = ?
```
- لا يظهر في Applicants List ❌
- لا يظهر في Accepted Students ❌

## 📍 API Endpoints

### GET `/api/matching/company/:companyId/applicants`
**الوصف:** جلب جميع المتقدمين النشطين للشركة

**الفلترة:**
```sql
WHERE company_id = ? 
  AND applied = TRUE 
  AND status = 'pending'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": 5,
      "full_name": "Ahmad Ali",
      "applied": 1,
      "status": "pending",
      "applied_at": "2025-10-22T10:30:00.000Z",
      "match_percentage": 85
    }
  ]
}
```

### POST `/api/matching/applicant/:matchId/accept`
**الوصف:** قبول متقدم

**التحديثات:**
1. `status = 'accepted'`
2. `applied = 0`
3. تقليل capacity للتدريب
4. إرسال إشعار للطالب

### POST `/api/matching/applicant/:matchId/reject`
**الوصف:** رفض متقدم

**التحديثات:**
1. `status = 'rejected'`
2. `applied = 0`
3. إرسال إشعار للطالب

## 🎯 سيناريوهات الاستخدام

### السيناريو 1: عرض المتقدمين
```
1. الشركة تفتح Applicants List
   ↓
2. يتم جلب المتقدمين من API
   ↓
3. الفلترة: applied = 1 AND status = 'pending'
   ↓
4. يظهر فقط المتقدمين الجدد
```

### السيناريو 2: قبول متقدم
```
1. الشركة تضغط "Accept" على متقدم
   ↓
2. POST /api/matching/applicant/:matchId/accept
   ↓
3. UPDATE: status = 'accepted', applied = 0
   ↓
4. المتقدم يختفي من Applicants List
   ↓
5. المتقدم يظهر في Accepted Students
```

### السيناريو 3: رفض متقدم
```
1. الشركة تضغط "Reject" على متقدم
   ↓
2. POST /api/matching/applicant/:matchId/reject
   ↓
3. UPDATE: status = 'rejected', applied = 0
   ↓
4. المتقدم يختفي من Applicants List
   ↓
5. المتقدم لا يظهر في أي قائمة
```

## 📈 مثال على البيانات

### قبل القبول/الرفض:
```sql
SELECT * FROM Internship_Matches WHERE id = 1;

| id | student_id | internship_id | applied | status  | applied_at          |
|----|------------|---------------|---------|---------|---------------------|
| 1  | 5          | 10            | 1       | pending | 2025-10-22 10:30:00 |
```

### بعد القبول:
```sql
| id | student_id | internship_id | applied | status   | applied_at          |
|----|------------|---------------|---------|----------|---------------------|
| 1  | 5          | 10            | 0       | accepted | 2025-10-22 10:30:00 |
```

### بعد الرفض:
```sql
| id | student_id | internship_id | applied | status   | applied_at          |
|----|------------|---------------|---------|----------|---------------------|
| 1  | 5          | 10            | 0       | rejected | 2025-10-22 10:30:00 |
```

## 🧪 كيفية الاختبار

### 1. اختبار عرض المتقدمين:
```bash
# تسجيل دخول كشركة
# الذهاب إلى Applicants List
# يجب أن تظهر فقط الطلبات المعلقة (status = 'pending')
```

### 2. اختبار القبول:
```bash
# اضغط "Accept" على متقدم
# تحقق من اختفاء المتقدم من القائمة
# تحقق من ظهوره في Accepted Students
# تحقق من قاعدة البيانات:
SELECT applied, status FROM Internship_Matches WHERE id = ?;
# يجب أن يكون: applied = 0, status = 'accepted'
```

### 3. اختبار الرفض:
```bash
# اضغط "Reject" على متقدم
# تحقق من اختفاء المتقدم من القائمة
# تحقق من قاعدة البيانات:
SELECT applied, status FROM Internship_Matches WHERE id = ?;
# يجب أن يكون: applied = 0, status = 'rejected'
```

### 4. اختبار SQL مباشر:
```sql
-- عرض جميع المتقدمين النشطين
SELECT 
  im.id,
  u.full_name,
  i.title,
  im.applied,
  im.status
FROM Internship_Matches im
JOIN Students s ON im.student_id = s.id
JOIN Users u ON s.user_id = u.id
JOIN Internships i ON im.internship_id = i.id
WHERE im.applied = 1 AND im.status = 'pending';

-- تحديث يدوي (للاختبار)
UPDATE Internship_Matches 
SET status = 'accepted', applied = 0 
WHERE id = 1;

-- التحقق
SELECT * FROM Internship_Matches WHERE id = 1;
```

## 🔍 Console Logs

عند تنفيذ العمليات، ستظهر logs مثل:

### عند القبول:
```
✅ Accepting applicant with match ID 1...
✅ Applicant 1 accepted successfully
📉 Frontend Developer Intern capacity: 5 → 4
📧 Notification sent to student (user_id: 7)
```

### عند الرفض:
```
❌ Rejecting applicant with match ID 2...
❌ Applicant 2 rejected
📧 Notification sent to student (user_id: 8)
```

### عند جلب المتقدمين:
```
📋 Getting all applicants for company 1...
✅ Found 3 applicants
```

## ✅ الفوائد

1. **تنظيم أفضل**: فصل واضح بين المتقدمين النشطين والمعالجين
2. **أداء أفضل**: تقليل عدد السجلات المعروضة
3. **تجربة مستخدم أفضل**: عدم ازدحام القائمة بالطلبات المعالجة
4. **تتبع أفضل**: يمكن الاستعلام عن الطلبات المعالجة بسهولة

## 📝 ملاحظات مهمة

- ✅ `applied = 0` لا يعني حذف السجل - السجل موجود في قاعدة البيانات
- ✅ يمكن الاستعلام عن جميع الطلبات (المقبولة والمرفوضة) بدون فلتر `applied`
- ✅ `applied_at` يبقى كما هو - يحفظ تاريخ التقديم الأصلي
- ✅ التغيير يحدث تلقائياً عند القبول أو الرفض
- ✅ لا حاجة لتعديل الـ frontend - يعتمد على API

## 🔄 استعلامات مفيدة

### جميع الطلبات المعلقة:
```sql
SELECT * FROM Internship_Matches 
WHERE applied = 1 AND status = 'pending';
```

### جميع الطلبات المقبولة:
```sql
SELECT * FROM Internship_Matches 
WHERE status = 'accepted';
```

### جميع الطلبات المرفوضة:
```sql
SELECT * FROM Internship_Matches 
WHERE status = 'rejected';
```

### جميع الطلبات (بغض النظر عن applied):
```sql
SELECT * FROM Internship_Matches;
```
