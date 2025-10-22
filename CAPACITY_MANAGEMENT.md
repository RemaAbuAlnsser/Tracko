# إدارة Capacity التدريبات

## 📋 نظرة عامة

تم إضافة نظام تلقائي لإدارة capacity التدريبات:
- عند قبول متقدم → capacity تقل بمقدار 1
- منع القبول إذا كان capacity = 0
- استخدام Transactions لضمان سلامة البيانات

---

## 🔧 كيف يعمل النظام

### 1️⃣ **عند Accept:**

```javascript
// الخطوات:
1. فحص capacity الحالي
2. إذا capacity > 0:
   - تحديث status = 'accepted'
   - تقليل capacity بمقدار 1
3. إذا capacity = 0:
   - رفض الطلب
   - رسالة: "This internship has reached its maximum capacity"
```

### 2️⃣ **مثال:**

```
التدريب: Software Development Intern
Capacity الأولي: 10

Accept 1 → Capacity = 9
Accept 2 → Capacity = 8
Accept 3 → Capacity = 7
...
Accept 10 → Capacity = 0
Accept 11 → ❌ رفض (Capacity ممتلئ)
```

---

## 💾 Database Transaction

### استخدام Transaction لضمان:
- إما تنفيذ العمليتين معاً (status + capacity)
- أو إلغاء الكل في حالة الخطأ

```sql
BEGIN TRANSACTION;

-- 1. تحديث status
UPDATE Internship_Matches 
SET status = 'accepted' 
WHERE id = ?;

-- 2. تقليل capacity
UPDATE Internships i
INNER JOIN Internship_Matches im ON i.id = im.internship_id
SET i.capacity = i.capacity - 1
WHERE im.id = ? AND i.capacity > 0;

COMMIT;
```

---

## 🎯 الحماية من الأخطاء

### ✅ **منع القبول عند capacity = 0:**
```javascript
if (internship.capacity <= 0) {
  return res.status(400).json({
    success: false,
    message: "This internship has reached its maximum capacity"
  });
}
```

### ✅ **Rollback في حالة الخطأ:**
```javascript
db.beginTransaction((err) => {
  // ... operations
  if (err) {
    db.rollback(() => {
      reject(err);
    });
  }
});
```

---

## 📊 Logs

### عند Accept ناجح:
```
✅ Accepting applicant with match ID 123...
✅ Applicant 123 accepted successfully
📉 Software Development Intern capacity: 10 → 9
```

### عند capacity ممتلئ:
```
✅ Accepting applicant with match ID 124...
⚠️ Cannot accept: Software Development Intern has no available capacity
```

---

## 🔍 التحقق من Capacity

### SQL Query:
```sql
-- عرض التدريبات مع capacity
SELECT 
  id,
  title,
  capacity,
  (SELECT COUNT(*) FROM Internship_Matches 
   WHERE internship_id = Internships.id 
   AND status = 'accepted') as accepted_count
FROM Internships;
```

### مثال النتيجة:
```
| id | title                    | capacity | accepted_count |
|----|--------------------------|----------|----------------|
| 14 | Software Dev Intern      | 7        | 3              |
| 15 | Data Science Intern      | 10       | 0              |
| 16 | UI/UX Design Intern      | 0        | 5              |
```

---

## 🎨 Frontend

### رسالة النجاح:
```
✅ Applicant accepted successfully!
📉 Internship capacity decreased by 1
```

### رسالة الخطأ:
```
❌ This internship has reached its maximum capacity
```

---

## 🔄 سير العمل الكامل

### **السيناريو 1: Accept ناجح**
1. الشركة تضغط "Accept"
2. Backend يفحص capacity
3. capacity > 0 ✅
4. تحديث status = 'accepted'
5. تقليل capacity بمقدار 1
6. رسالة نجاح
7. تحديث القائمة

### **السيناريو 2: Capacity ممتلئ**
1. الشركة تضغط "Accept"
2. Backend يفحص capacity
3. capacity = 0 ❌
4. رفض الطلب
5. رسالة: "Internship has reached maximum capacity"
6. لا يتم تحديث أي شيء

---

## 🎯 التطويرات المستقبلية

### يمكن إضافة:

1. **زيادة Capacity عند Reject:**
   - إذا تم رفض متقدم مقبول سابقاً
   - capacity تزيد بمقدار 1

2. **تنبيه عند اقتراب الامتلاء:**
   - إشعار عندما capacity < 3
   - تغيير لون capacity في الواجهة

3. **Waitlist:**
   - قائمة انتظار عند امتلاء capacity
   - قبول تلقائي عند توفر مكان

4. **إحصائيات:**
   - نسبة الامتلاء لكل تدريب
   - متوسط وقت الامتلاء

5. **تاريخ Capacity:**
   - جدول لتتبع تغييرات capacity
   - من قبل/رفض المتقدم

---

## 🧪 التجربة

### 1. إنشاء تدريب بـ capacity صغير:
```sql
INSERT INTO Internships (title, capacity, company_id, ...)
VALUES ('Test Internship', 2, 1, ...);
```

### 2. قبول متقدمين:
- Accept 1 → capacity = 1 ✅
- Accept 2 → capacity = 0 ✅
- Accept 3 → ❌ رفض

### 3. التحقق:
```sql
SELECT capacity FROM Internships WHERE title = 'Test Internship';
-- النتيجة: 0
```

---

## ⚠️ ملاحظات مهمة

1. **Transaction:** يضمن عدم حدوث تعارض
2. **Capacity لا يمكن أن يكون سالب:** الشرط `capacity > 0`
3. **Reject لا يؤثر على Capacity:** فقط Accept يقلل
4. **التحديث التلقائي:** Frontend يحدث القائمة والـ capacity

---

## 📝 الملفات المعدلة

- ✅ `backend/models/InternshipMatch.js` - updateStatus method
- ✅ `backend/routes/matching.js` - Accept route
- ✅ `frontend/src/pages/CompanyDashboard.js` - handleAcceptApplicant

النظام جاهز للاستخدام! 🎉
