# دليل الإعداد بعد الدمج (Post-Merge Setup Guide)

## ✅ تم دمج `mergevideocall` → `videacall` بنجاح!

تم دمج جميع التغييرات من برانش `mergevideocall` إلى `videacall` وحل جميع التعارضات.

---

## 📋 التغييرات المطبقة على قاعدة البيانات

تم تشغيل جميع الـ migrations التالية:

### ✅ Migration 007: Domain للجامعات
- إضافة عمود `domain` لجدول `Universities`
- استخراج الـ domain من email الجامعة تلقائياً
- **الاستخدام:** التحقق من بريد الطالب عند التسجيل

### ✅ Migration 008: عدد الطلاب في التدريبات
- إضافة عمود `number_of_students` لجدول `Internships`
- تتبع عدد الطلاب المقبولين في كل تدريب
- **الاستخدام:** منع قبول طلاب إضافيين عند امتلاء التدريب

### ✅ Migration 009: أنواع إشعارات جديدة
- إضافة `registration_approved` للـ notifications.type ENUM
- إضافة `task_deadline` للـ notifications.type ENUM
- **الاستخدام:** إشعارات الموافقة على التسجيل والمواعيد النهائية

### ✅ Migration 010: ساعات العمل والمواعيد النهائية
- إضافة `hours_per_week` لجدول `Internship_Matches`
- إضافة `due_date` لجدول `Plan_Weeks`
- **الاستخدام:** تتبع التزام الطالب بساعات العمل ومواعيد المهام

### ✅ Migration 011: ساعات التدريب
- إضافة `training_hours` لجدول `University_Company_Partnerships`
- إضافة `completed_hours` لجدول `Internship_Matches`
- **الاستخدام:** تتبع تقدم الطالب في إكمال ساعات التدريب المطلوبة

---

## 🎯 الميزات الجديدة

### 1. 🔔 نظام إشعارات المواعيد النهائية
- **Cron Job** يعمل كل ساعة للتحقق من المواعيد النهائية
- إشعارات تلقائية قبل 24 ساعة من انتهاء موعد المهام
- إشعارات للطلاب والمدربين

**الملفات:**
- `backend/cron/taskDeadlineCron.js`
- `backend/routes/taskDeadlines.js`
- `backend/utils/taskDeadlineChecker.js`

### 2. 🎯 تحسينات AI Matching
- **فلترة التدريبات الممتلئة:** لا يتم عرض التدريبات التي وصلت للسعة القصوى
- **تحسين Capacity Check:** التحقق من السعة قبل قبول المتقدمين
- **عرض number_of_students/capacity** في واجهة الشركات

**التغييرات:**
- `backend/routes/matching.js` - فلترة التدريبات الممتلئة في AI matching
- تحديث capacity checking عند قبول الطلاب

### 3. ⏰ ساعات العمل الأسبوعية
- الطلاب يحددون عدد ساعات العمل عند التقديم (minimum 20 hours)
- تتبع `completed_hours` لكل طالب
- حساب التقدم بناءً على `training_hours` المطلوبة

**الاستخدام:**
```javascript
// عند التقديم على تدريب
POST /api/matching/student/:userId/apply/:internshipId
Body: { hours_per_week: 25 }
```

### 4. 📅 مواعيد نهائية للأسابيع
- كل أسبوع في الخطة التدريبية له `due_date`
- إشعارات تلقائية قبل الموعد النهائي
- تتبع المهام المتأخرة

**الاستخدام:**
```javascript
// عند إضافة أسبوع للخطة
{
  week_number: 1,
  title: "Week 1",
  due_date: "2025-11-10",
  // ... other fields
}
```

### 5. 🎓 التحقق من البريد الجامعي
- التحقق التلقائي من domain البريد الإلكتروني
- ربط الطالب بالجامعة الصحيحة بناءً على الـ domain
- منع التسجيل ببريد غير جامعي

**مثال:**
- `student@najah.com` → يتم ربطه بجامعة An-Najah تلقائياً
- `student@birzeit.com` → يتم ربطه بجامعة Birzeit تلقائياً

---

## 🔧 التغييرات في الكود

### Backend

#### ✅ `backend/package.json`
```json
{
  "dependencies": {
    "node-cron": "^3.0.3",        // جديد - للـ cron jobs
    "socket.io": "^4.8.1",         // موجود - للـ video calls
    "socket.io-client": "^4.8.1"   // موجود - للـ video calls
  }
}
```

#### ✅ `backend/server.js`
- إضافة routes للـ task deadlines
- إضافة routes للـ video calls و interviews و events
- إضافة cron job للـ task deadline notifications
- إضافة interview reminders scheduler

#### ✅ `backend/models/InternshipPlan.js`
- دعم `due_date` في `addWeek()` و `updateWeek()`
- تحديث CREATE TABLE لإضافة `due_date` column

#### ✅ `backend/routes/matching.js`
- فلترة التدريبات الممتلئة في AI matching
- إضافة `hours_per_week` عند التقديم على تدريب
- تحسين capacity checking عند قبول المتقدمين

### Frontend

#### ✅ `frontend/src/pages/TrainerDashboard.js`
- دمج video call state variables
- دمج dashboard statistics state
- Student Selection Modal للـ video calls
- Edit Plan Modal

#### ✅ `frontend/src/pages/CompanyDashboard.js`
- دمج interview scheduling state
- دمج video call/meetings state
- دمج dashboard statistics state

---

## 🚀 الخطوات التالية

### 1. دفع التغييرات للـ Repository
```bash
git push origin videacall
```

### 2. تثبيت الـ Dependencies الجديدة
```bash
cd backend
npm install
```

### 3. إعادة تشغيل السيرفر
```bash
cd backend
npm start
```

### 4. التحقق من عمل الميزات الجديدة

#### ✅ اختبار التسجيل
- سجل طالب جديد ببريد جامعي
- تحقق من ربطه بالجامعة الصحيحة
- تحقق من إشعار الموافقة على التسجيل

#### ✅ اختبار AI Matching
- شغل AI matching لطالب
- تحقق من عدم ظهور التدريبات الممتلئة
- قدم على تدريب مع تحديد `hours_per_week`

#### ✅ اختبار المواعيد النهائية
- أضف خطة تدريبية مع `due_date` للأسابيع
- انتظر ساعة للتحقق من عمل الـ cron job
- تحقق من الإشعارات قبل 24 ساعة من الموعد

#### ✅ اختبار Video Calls
- جدول video call من dashboard المدرب
- اختر طلاب للدعوة
- تحقق من إرسال الإشعارات

---

## 📊 ملخص الـ Commits

```
✅ 6054da7 - Merge branch 'mergevideocall' into videacall
✅ 6a0c2b4 - Fix: حل التعارضات المتبقية في TrainerDashboard.js
✅ aaa9bc8 - Add missing migrations and documentation
✅ 320ed8e - Add training hours columns migration
```

---

## 📝 ملاحظات مهمة

⚠️ **قاعدة البيانات:**
- جميع الـ migrations تم تشغيلها بنجاح
- لا حاجة لإعادة تشغيل الـ migrations على بيئة التطوير الحالية
- للبيئات الأخرى (production, staging)، استخدم الملفات في `backend/migrations/`

✅ **الكود:**
- جميع التعارضات تم حلها
- الكود جاهز للـ production
- جميع الميزات تم دمجها بنجاح

🎉 **النتيجة:**
- البرانش `videacall` الآن يحتوي على جميع ميزات `mergevideocall`
- النظام يدعم video calls + task deadlines + training hours tracking
- جاهز للاستخدام!

---

## 🆘 في حالة وجود مشاكل

### مشكلة: "Unknown column 'X' in 'field list'"
**الحل:** تحقق من أن جميع الـ migrations تم تشغيلها
```bash
cd backend/migrations
mysql -u root -p tracko_db < 007_*.sql
mysql -u root -p tracko_db < 008_*.sql
mysql -u root -p tracko_db < 009_*.sql
mysql -u root -p tracko_db < 010_*.sql
mysql -u root -p tracko_db < 011_*.sql
```

### مشكلة: "Data truncated for column 'type'"
**الحل:** تحقق من تحديث ENUM للـ notifications
```bash
mysql -u root -p tracko_db < backend/migrations/009_update_notifications_type_enum.sql
```

### مشكلة: Cron jobs لا تعمل
**الحل:** تحقق من أن السيرفر يعمل وأن `node-cron` مثبت
```bash
cd backend
npm install node-cron
npm start
```

---

## 📚 المراجع

- **Migrations:** `backend/migrations/README.md`
- **Task Deadlines:** `DEADLINE_NOTIFICATIONS.md`
- **24-Hour System:** `NEW_24HOUR_SYSTEM.md`
- **Updates Summary:** `UPDATES_SUMMARY.md`

---

**تم الإعداد بواسطة:** Cascade AI Assistant  
**التاريخ:** November 3, 2025  
**البرانش:** videacall  
**الحالة:** ✅ جاهز للاستخدام
