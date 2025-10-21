# نظام التقديم على التدريبات - دليل الإعداد

## 📋 نظرة عامة

تم إضافة نظام كامل للتقديم على التدريبات يشمل:
- زر "Apply Now" للطلاب
- تخزين الطلبات في قاعدة البيانات
- صفحة "Applicants List" للشركات لعرض المتقدمين

---

## 🔧 الخطوة 1: إضافة الأعمدة في قاعدة البيانات

### أولاً: إضافة عمود `saved`
```bash
cd backend
node scripts/addSavedColumnToMatches.js
```

### ثانياً: إضافة عمود `applied`
```bash
node scripts/addAppliedColumnToMatches.js
```

**أو تشغيل SQL مباشرة:**
```sql
-- إضافة عمود saved
ALTER TABLE Internship_Matches ADD COLUMN saved BOOLEAN DEFAULT FALSE;

-- إضافة أعمدة applied و applied_at
ALTER TABLE Internship_Matches 
ADD COLUMN applied BOOLEAN DEFAULT FALSE,
ADD COLUMN applied_at TIMESTAMP NULL;
```

---

## 🚀 الخطوة 2: إعادة تشغيل Backend

```bash
cd backend
npm start
```

---

## ✨ الميزات المضافة

### 1️⃣ **للطلاب (StudentDashboard):**

#### زر "Apply Now"
- عند الضغط على "View Details" لأي تدريب
- يظهر modal مع تفاصيل التدريب
- زر "Apply Now" لتقديم الطلب
- يتم تخزين الطلب في `Internship_Matches` مع `applied = TRUE`

#### البيانات المخزنة:
```javascript
{
  student_id: // من جدول Students
  internship_id: // معرف التدريب
  applied: TRUE,
  applied_at: // تاريخ التقديم (الآن)
  match_percentage: // من AI matching
  matched_skills: // من AI matching
}
```

---

### 2️⃣ **للشركات (CompanyDashboard):**

#### صفحة "Applicants List"
- عرض جميع المتقدمين على تدريبات الشركة
- فلاتر حسب:
  - التدريب (Position)
  - نسبة التطابق (Match Score)
  - الحالة (Status)

#### البيانات المعروضة لكل متقدم:
- **الاسم والصورة:** من جدول `Students`
- **الجامعة:** من جدول `Universities`
- **التخصص والسنة:** من جدول `Students`
- **GPA:** من `CVs.analysis_data.gpa`
- **تاريخ التقديم:** من `Internship_Matches.applied_at`
- **اسم التدريب:** من `Internships.title`
- **المهارات:** من `Internship_Matches.matched_skills`
- **نسبة التطابق:** من `Internship_Matches.match_percentage`

---

## 🔌 Backend APIs

### 1. التقديم على تدريب
```
POST /api/matching/student/:userId/apply/:internshipId
```
**الوظيفة:** يحفظ الطلب في قاعدة البيانات

### 2. جلب متقدمين لتدريب معين
```
GET /api/matching/internship/:internshipId/applicants
```
**الوظيفة:** يجلب جميع المتقدمين لتدريب محدد

### 3. جلب جميع متقدمين الشركة
```
GET /api/matching/company/:companyId/applicants
```
**الوظيفة:** يجلب جميع المتقدمين لكل تدريبات الشركة

---

## 📊 جدول Internship_Matches

### الأعمدة الجديدة:
```sql
saved BOOLEAN DEFAULT FALSE          -- للتدريبات المحفوظة
applied BOOLEAN DEFAULT FALSE        -- للتدريبات المقدم عليها
applied_at TIMESTAMP NULL            -- تاريخ التقديم
```

### الأعمدة الموجودة:
```sql
student_id INT                       -- معرف الطالب
internship_id INT                    -- معرف التدريب
match_percentage DECIMAL(5,2)        -- نسبة التطابق
matched_skills JSON                  -- المهارات المتطابقة
matched_categories JSON              -- الفئات المتطابقة
gpa_match BOOLEAN                    -- تطابق المعدل
work_mode_match BOOLEAN              -- تطابق نمط العمل
```

---

## 🎨 التصميم

### بطاقة المتقدم تعرض:
1. **Header:**
   - صورة/أحرف الطالب
   - الاسم
   - الجامعة
   - التخصص والسنة
   - نسبة التطابق (ملونة حسب النسبة)

2. **Details:**
   - GPA
   - تاريخ التقديم
   - اسم التدريب
   - الحالة (New/Reviewed/Interview/Rejected)

3. **Skills:**
   - أول 4 مهارات متطابقة
   - عدد المهارات الإضافية

4. **Actions:**
   - View Profile
   - Message

---

## 🔄 سير العمل

### للطالب:
1. يفتح "Internships"
2. يضغط "View Details"
3. يضغط "Apply Now"
4. يتم حفظ الطلب في قاعدة البيانات

### للشركة:
1. تفتح "Applicants List"
2. تختار فلتر (اختياري)
3. تشاهد جميع المتقدمين
4. تضغط "View Profile" لرؤية التفاصيل
5. تضغط "Message" للتواصل

---

## 🎯 الألوان حسب نسبة التطابق

- **90%+:** أخضر (High Match)
- **75-89%:** أزرق (Good Match)
- **60-74%:** أصفر (Medium Match)
- **<60%:** أحمر (Low Match)

---

## ✅ التحقق من النظام

1. **تشغيل migrations:**
   ```bash
   node scripts/addSavedColumnToMatches.js
   node scripts/addAppliedColumnToMatches.js
   ```

2. **تشغيل Backend:**
   ```bash
   cd backend
   npm start
   ```

3. **التجربة:**
   - سجل دخول كطالب
   - قدم على تدريب
   - سجل دخول كشركة
   - افتح "Applicants List"
   - شاهد الطلب

---

## 📝 ملاحظات مهمة

- يتم جلب GPA من `CVs.analysis_data` (JSON)
- المهارات تأتي من `Internship_Matches.matched_skills`
- نسبة التطابق من `Internship_Matches.match_percentage`
- إذا لم يكن هناك matching، النسبة = 0
- الحالة (Status) حالياً ثابتة على "New" (يمكن تطويرها لاحقاً)
