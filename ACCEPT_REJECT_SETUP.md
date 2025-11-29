# نظام Accept/Reject للمتقدمين - دليل الإعداد

## ✅ ما تم إضافته

### 1️⃣ **Frontend:**
- ✅ استبدال زر "Message" بزرين:
  - **Accept** (أخضر) - لقبول المتقدم
  - **Reject** (أحمر) - لرفض المتقدم
- ✅ تأكيد عند الرفض
- ✅ تحديث القائمة تلقائياً بعد Accept/Reject

### 2️⃣ **Backend:**
- ✅ إضافة عمود `status` في جدول `Internship_Matches`
- ✅ API للقبول: `POST /api/matching/applicant/:matchId/accept`
- ✅ API للرفض: `POST /api/matching/applicant/:matchId/reject`
- ✅ Method في Model: `updateStatus(matchId, status)`

---

## 🔧 خطوات التفعيل

### 1. إضافة عمود status في قاعدة البيانات

```bash
cd backend
node scripts/addStatusColumnToMatches.js
```

**أو SQL مباشرة:**
```sql
ALTER TABLE Internship_Matches 
ADD COLUMN status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending';
```

### 2. إعادة تشغيل Backend

```bash
cd backend
npm start
```

---

## 🎨 التصميم

### **زر Accept:**
- لون أخضر (#10b981)
- أيقونة ✓
- Hover: أخضر داكن مع ظل

### **زر Reject:**
- لون أحمر (#ef4444)
- أيقونة ✕
- Hover: أحمر داكن مع ظل
- تأكيد قبل الرفض

---

## 📊 حالات الطلب (Status)

| Status | الوصف | اللون |
|--------|-------|-------|
| `pending` | قيد الانتظار (افتراضي) | أزرق |
| `accepted` | تم القبول | أخضر |
| `rejected` | تم الرفض | أحمر |

---

## 🔄 سير العمل

### **عند القبول:**
1. الشركة تضغط "Accept"
2. يتم إرسال `POST /api/matching/applicant/:matchId/accept`
3. يتم تحديث `status = 'accepted'` في قاعدة البيانات
4. رسالة تأكيد: "✅ Applicant accepted successfully!"
5. يتم تحديث القائمة
6. **المتقدم يختفي من القائمة** ✅

### **عند الرفض:**
1. الشركة تضغط "Reject"
2. رسالة تأكيد: "Are you sure you want to reject this applicant?"
3. إذا وافق → يتم إرسال `POST /api/matching/applicant/:matchId/reject`
4. يتم تحديث `status = 'rejected'` في قاعدة البيانات
5. رسالة: "❌ Applicant rejected"
6. يتم تحديث القائمة
7. **المتقدم يختفي من القائمة** ✅

### **آلية الإخفاء:**
- الـ API يجلب فقط المتقدمين بحالة `status = 'pending'`
- عند Accept/Reject → يتغير الـ status → لا يظهر في القائمة
- المتقدمون المقبولون/المرفوضون محفوظون في قاعدة البيانات

---

## 🗄️ قاعدة البيانات

### جدول Internship_Matches:
```sql
CREATE TABLE Internship_Matches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  internship_id INT,
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP NULL,
  saved BOOLEAN DEFAULT FALSE,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',  -- ✅ جديد
  match_percentage DECIMAL(5,2),
  matched_skills JSON,
  ...
);
```

---

## 📊 عرض المقبولين والمرفوضين

### حالياً:
- القائمة تعرض فقط المتقدمين بحالة `pending`
- المقبولون والمرفوضون **محفوظون في قاعدة البيانات**

### لعرض المقبولين/المرفوضين:
```sql
-- عرض المقبولين
SELECT * FROM Internship_Matches 
WHERE status = 'accepted' AND applied = TRUE;

-- عرض المرفوضين
SELECT * FROM Internship_Matches 
WHERE status = 'rejected' AND applied = TRUE;

-- عرض قيد الانتظار
SELECT * FROM Internship_Matches 
WHERE status = 'pending' AND applied = TRUE;
```

---

## 🎯 التطويرات المستقبلية

### يمكن إضافة:
1. **فلتر حسب Status في الواجهة:**
   - تبويب "Pending" (الافتراضي)
   - تبويب "Accepted" 
   - تبويب "Rejected"
   - تبويب "All"

2. **إشعارات للطالب:**
   - إرسال email عند القبول
   - إرسال email عند الرفض

3. **تغيير Status:**
   - إمكانية تغيير من accepted إلى rejected والعكس
   - زر "Undo" للتراجع

4. **سبب الرفض:**
   - إضافة حقل `rejection_reason`
   - نافذة لإدخال السبب عند الرفض

5. **إحصائيات:**
   - عدد المقبولين
   - عدد المرفوضين
   - معدل القبول
   - رسم بياني للحالات

---

## 🧪 التجربة

1. **شغل Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **افتح CompanyDashboard**

3. **اذهب إلى "Applicants List"**

4. **ستشاهد:**
   - زر "Accept" أخضر
   - زر "Reject" أحمر

5. **جرب:**
   - اضغط "Accept" → سيتم قبول المتقدم
   - اضغط "Reject" → سيظهر تأكيد → سيتم رفض المتقدم

6. **تحقق من قاعدة البيانات:**
   ```sql
   SELECT id, student_id, internship_id, status, applied_at 
   FROM Internship_Matches 
   WHERE applied = TRUE;
   ```

---

## 📝 ملاحظات

- Status الافتراضي: `pending`
- يمكن تغيير Status في أي وقت
- التغييرات تُحفظ في قاعدة البيانات
- القائمة تتحدث تلقائياً بعد كل عملية
