# إصلاح خطأ نوع الإشعارات 🔧

## المشكلة
```
WARN_DATA_TRUNCATED: Data truncated for column 'type' at row 1
```

عمود `type` في جدول `notifications` لا يحتوي على القيم الجديدة:
- `task_submission` (عند تسليم الطالب للمهمة)
- `task_review` (عند مراجعة المدرب للمهمة)

---

## الحل ✅

### الخطوة 1: تشغيل سكريبت التحديث

في terminal، اذهب لمجلد backend وشغل:

```bash
cd backend
node scripts/updateNotificationsTypeEnum.js
```

### الخطوة 2: التحقق من النجاح

يجب أن ترى:
```
🔧 Updating notifications table type column...
✅ notifications table updated successfully!
📋 New type ENUM values:
   - appointment
   - submission
   - meeting
   - general
   - training_plan
   - training_report
   - application
   - task_submission ✨ (NEW)
   - task_review ✨ (NEW)
```

### الخطوة 3: إعادة تشغيل الخادم

```bash
npm start
```

---

## ماذا يفعل السكريبت؟

يقوم بتحديث عمود `type` في جدول `notifications` ليشمل القيم الجديدة:

```sql
ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
  'appointment', 
  'submission', 
  'meeting', 
  'general', 
  'training_plan', 
  'training_report', 
  'application',
  'task_submission',  -- جديد
  'task_review'       -- جديد
) NOT NULL DEFAULT 'general';
```

---

## بعد التحديث

الآن يمكن للنظام:
- ✅ إرسال إشعارات عند تسليم الطالب للمهمة (task_submission)
- ✅ إرسال إشعارات عند مراجعة المدرب للمهمة (task_review)
- ✅ تخزين جميع الإشعارات بدون أخطاء

---

## ملاحظة مهمة

إذا كان لديك إشعارات قديمة في قاعدة البيانات، ستبقى كما هي ولن تتأثر بالتحديث.
