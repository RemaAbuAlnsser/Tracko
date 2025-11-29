# دليل تجربة نظام التقديم على التدريبات

## ✅ تم تنفيذ الـ Migration بنجاح!

تم إضافة الأعمدة التالية في جدول `Internship_Matches`:
- `saved` - للتدريبات المحفوظة
- `applied` - للتدريبات المقدم عليها
- `applied_at` - تاريخ التقديم

---

## 🧪 خطوات التجربة

### 1️⃣ تشغيل Backend
```bash
cd backend
npm start
```

### 2️⃣ تشغيل Frontend
```bash
cd frontend
npm start
```

---

## 📝 سيناريو التجربة الكامل

### **كطالب:**

1. **تسجيل الدخول:**
   - افتح المتصفح على `http://localhost:3000`
   - سجل دخول كطالب

2. **تصفح التدريبات:**
   - اذهب إلى قسم "Internships" في Sidebar
   - ستشاهد قائمة التدريبات المتاحة

3. **عرض تفاصيل التدريب:**
   - اضغط على "View Details" لأي تدريب
   - سيظهر modal مع جميع التفاصيل

4. **التقديم على التدريب:**
   - اضغط على زر "Apply Now" (الأزرق)
   - ستظهر رسالة تأكيد: "Application submitted successfully!"
   - سيتم إغلاق الـ modal

5. **حفظ التدريب (اختياري):**
   - افتح تدريب آخر
   - اضغط "Save for Later"
   - اذهب إلى "Internship Details" في Sidebar
   - ستجد التدريب المحفوظ

---

### **كشركة:**

1. **تسجيل الدخول:**
   - سجل خروج من حساب الطالب
   - سجل دخول كشركة

2. **فتح قائمة المتقدمين:**
   - اذهب إلى "Applicants List" في Sidebar
   - سيتم تحميل جميع المتقدمين تلقائياً

3. **ما ستشاهده:**
   - بطاقات للمتقدمين تحتوي على:
     - اسم الطالب وصورته
     - الجامعة والتخصص
     - GPA (من تحليل الـ CV)
     - تاريخ التقديم
     - اسم التدريب المقدم عليه
     - المهارات المتطابقة
     - نسبة التطابق (ملونة)

4. **استخدام الفلاتر:**
   - **Select internship position:** لعرض متقدمين لتدريب معين
   - **Status:** لفلترة حسب الحالة (حالياً كلهم New)
   - **Match Score:** لفلترة حسب نسبة التطابق

5. **تحديث الصفحة:**
   - اضغط F5 أو Refresh
   - ستبقى الطلبات موجودة (محفوظة في قاعدة البيانات)

---

## 🔍 التحقق من البيانات في قاعدة البيانات

### فحص الطلبات:
```sql
SELECT 
  im.id,
  s.first_name,
  s.last_name,
  i.title as internship_title,
  im.applied,
  im.applied_at,
  im.match_percentage
FROM Internship_Matches im
INNER JOIN Students s ON im.student_id = s.id
INNER JOIN Internships i ON im.internship_id = i.id
WHERE im.applied = TRUE
ORDER BY im.applied_at DESC;
```

### فحص التدريبات المحفوظة:
```sql
SELECT 
  im.id,
  s.first_name,
  s.last_name,
  i.title as internship_title,
  im.saved
FROM Internship_Matches im
INNER JOIN Students s ON im.student_id = s.id
INNER JOIN Internships i ON im.internship_id = i.id
WHERE im.saved = TRUE;
```

---

## 🐛 استكشاف الأخطاء

### إذا لم تظهر الطلبات في CompanyDashboard:

1. **افتح Console في المتصفح (F12):**
   - ابحث عن رسائل مثل:
     - `🔍 Loading company data for: ...`
     - `🏢 Company ID: ...`
     - `📋 Loaded X applicants`

2. **تحقق من Backend Console:**
   - يجب أن ترى:
     - `📋 Getting all applicants for company X...`
     - `✅ Found X applicants`

3. **تحقق من قاعدة البيانات:**
   - تأكد أن `applied = TRUE` في جدول `Internship_Matches`
   - تأكد أن الـ `company_id` صحيح في جدول `Internships`

### إذا كان GPA يظهر N/A:

- تأكد أن الطالب رفع CV
- تأكد أن الـ CV تم تحليله بنجاح
- تحقق من `CVs.analysis_data` يحتوي على `gpa`

### إذا كانت المهارات لا تظهر:

- تأكد أن تم عمل AI Matching للطالب
- تحقق من `Internship_Matches.matched_skills` ليس NULL

---

## 📊 البيانات المتوقعة

### في Applicants List:
```javascript
{
  id: 1,
  student_id: 5,
  first_name: "أحمد",
  last_name: "محمد",
  university_name: "جامعة القاهرة",
  major: "Computer Science",
  year_of_study: "Junior",
  gpa: 3.8,
  applied_at: "2024-02-18T10:30:00.000Z",
  internship_title: "Software Engineering Intern",
  internship_id: 2,
  match_percentage: 85,
  matched_skills: ["JavaScript", "React", "Node.js", "Python"]
}
```

---

## ✨ الميزات المضافة

### ✅ للطلاب:
- زر Apply Now يعمل
- تخزين الطلب في قاعدة البيانات
- رسالة تأكيد عند النجاح

### ✅ للشركات:
- صفحة Applicants List كاملة
- عرض جميع البيانات المطلوبة:
  - GPA من `CVs.analysis_data`
  - تاريخ التقديم من `applied_at`
  - اسم التدريب من `Internships.title`
  - المهارات من `matched_skills`
  - نسبة التطابق من `match_percentage`
- الفلاتر تعمل
- البيانات تبقى بعد Refresh

---

## 🎯 الخطوة التالية

الآن يمكنك:
1. تجربة النظام بالكامل
2. إضافة المزيد من الطلاب والتدريبات
3. تطوير ميزة تغيير Status (New → Reviewed → Interview → Rejected)
4. إضافة نظام الرسائل بين الشركة والطالب
5. إضافة صفحة Profile للطالب عند الضغط على "View Profile"

---

## 📞 في حالة وجود مشاكل

1. تحقق من Console (F12)
2. تحقق من Backend logs
3. تحقق من قاعدة البيانات
4. تأكد أن جميع الـ migrations تمت بنجاح
