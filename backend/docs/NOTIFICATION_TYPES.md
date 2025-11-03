# أنواع الإشعارات (Notification Types)

## 📋 جميع أنواع الإشعارات المدعومة

### 1. `general` (عام)
**الاستخدام:** إشعارات عامة غير مصنفة  
**المستقبل:** جميع المستخدمين  
**مثال:** "System maintenance scheduled for tonight"

---

### 2. `application` (طلب تدريب)
**الاستخدام:** إشعارات متعلقة بطلبات التدريب  
**المستقبل:** الطلاب والشركات  
**أمثلة:**
- "Your application has been submitted"
- "New application received for your internship"

---

### 3. `interview` (مقابلة)
**الاستخدام:** إشعارات جدولة المقابلات  
**المستقبل:** الطلاب والشركات  
**أمثلة:**
- "Interview scheduled for [date] at [time]"
- "Interview reminder: Tomorrow at 10:00 AM"

---

### 4. `acceptance` (قبول)
**الاستخدام:** إشعارات قبول الطلب  
**المستقبل:** الطلاب  
**مثال:** "🎉 Congratulations! Your application has been accepted"

---

### 5. `rejection` (رفض)
**الاستخدام:** إشعارات رفض الطلب  
**المستقبل:** الطلاب  
**مثال:** "Your application was not selected at this time"

---

### 6. `task_submission` (تسليم مهمة)
**الاستخدام:** إشعارات تسليم المهام  
**المستقبل:** المدربين  
**مثال:** "Student [name] submitted a task for Week [X]"

---

### 7. `task_review` (مراجعة مهمة)
**الاستخدام:** إشعارات مراجعة المهام  
**المستقبل:** الطلاب  
**أمثلة:**
- "Your task has been reviewed and approved"
- "Your task needs revision"

---

### 8. `weekly_report` (تقرير أسبوعي)
**الاستخدام:** إشعارات التقارير الأسبوعية  
**المستقبل:** الطلاب والمدربين  
**أمثلة:**
- "Please submit your weekly report for Week [X]"
- "Weekly report submitted by [student]"

---

### 9. `event` (حدث)
**الاستخدام:** إشعارات الأحداث والفعاليات  
**المستقبل:** جميع المستخدمين  
**أمثلة:**
- "New event: Career Fair on [date]"
- "Event reminder: Workshop starts in 1 hour"

---

### 10. `video_call` (مكالمة فيديو)
**الاستخدام:** إشعارات المكالمات المرئية  
**المستقبل:** الطلاب والمدربين والشركات  
**أمثلة:**
- "You've been invited to a video call"
- "Video call starting in 15 minutes"

---

### 11. `registration_approved` (موافقة على التسجيل) ✨ جديد
**الاستخدام:** إشعار الموافقة على طلب التسجيل  
**المستقبل:** الطلاب الجدد  
**مثال:** "Your registration has been approved by [University]. You can now login to the system."

**متى يُرسل:**
- عندما تقوم الجامعة بالموافقة على طلب تسجيل طالب جديد

---

### 12. `registration_request` (طلب تسجيل) ✨ جديد
**الاستخدام:** إشعار بطلب تسجيل جديد  
**المستقبل:** موظفي الجامعة (University staff)  
**مثال:** "[Student Name] ([email]) has requested to register as a student. Request ID: [X]"

**متى يُرسل:**
- عندما يقوم طالب جديد بالتسجيل في النظام
- يتم إرساله لجميع موظفي الجامعة المرتبطة بالطالب (بناءً على domain البريد)

---

### 13. `task_deadline` (موعد نهائي للمهمة) ✨ جديد
**الاستخدام:** تذكير بالموعد النهائي للمهمة  
**المستقبل:** الطلاب والمدربين  
**أمثلة:**
- "⏰ Reminder: Week [X] task is due in 24 hours"
- "⚠️ Task deadline approaching: [task name]"

**متى يُرسل:**
- قبل 24 ساعة من الموعد النهائي للمهمة
- يتم إرساله تلقائياً بواسطة Cron Job

---

## 🔧 كيفية استخدام أنواع الإشعارات

### في الكود (Backend)

```javascript
import Notification from './models/Notification.js';

// مثال 1: إشعار قبول الطلب
await Notification.create({
  user_id: studentUserId,
  title: '🎉 Application Accepted!',
  message: `Congratulations! Your application for "${internshipTitle}" has been accepted.`,
  type: 'acceptance'
});

// مثال 2: إشعار طلب تسجيل جديد
await Notification.create({
  user_id: universityStaffUserId,
  title: 'New Student Registration Request',
  message: `${studentName} (${studentEmail}) has requested to register. Request ID: ${requestId}`,
  type: 'registration_request'
});

// مثال 3: إشعار موعد نهائي
await Notification.create({
  user_id: studentUserId,
  title: '⏰ Task Deadline Reminder',
  message: `Week ${weekNumber} task is due in 24 hours!`,
  type: 'task_deadline'
});
```

### في قاعدة البيانات

```sql
-- إضافة إشعار مباشرة
INSERT INTO notifications (user_id, title, message, type)
VALUES (1, 'Test Notification', 'This is a test', 'general');

-- الحصول على جميع إشعارات نوع معين
SELECT * FROM notifications 
WHERE type = 'registration_request' 
ORDER BY created_at DESC;

-- عدد الإشعارات حسب النوع
SELECT type, COUNT(*) as count 
FROM notifications 
GROUP BY type;
```

---

## 📊 إحصائيات الإشعارات

### الحصول على عدد الإشعارات غير المقروءة حسب النوع

```javascript
const unreadByType = await db.query(`
  SELECT type, COUNT(*) as count
  FROM notifications
  WHERE user_id = ? AND is_read = FALSE
  GROUP BY type
`, [userId]);
```

### الحصول على آخر إشعار من نوع معين

```javascript
const lastNotification = await db.query(`
  SELECT * FROM notifications
  WHERE user_id = ? AND type = ?
  ORDER BY created_at DESC
  LIMIT 1
`, [userId, 'task_deadline']);
```

---

## 🎨 أيقونات مقترحة لكل نوع

| النوع | الأيقونة | اللون |
|------|---------|-------|
| general | 📢 | #6B7280 |
| application | 📝 | #3B82F6 |
| interview | 🎤 | #8B5CF6 |
| acceptance | 🎉 | #10B981 |
| rejection | ❌ | #EF4444 |
| task_submission | 📤 | #F59E0B |
| task_review | ✅ | #10B981 |
| weekly_report | 📊 | #6366F1 |
| event | 📅 | #EC4899 |
| video_call | 📹 | #06B6D4 |
| registration_approved | ✅ | #10B981 |
| registration_request | 🔔 | #F59E0B |
| task_deadline | ⏰ | #EF4444 |

---

## 🔄 تحديث ENUM

إذا احتجت لإضافة نوع جديد:

```sql
ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
  'general',
  'application',
  'interview',
  'acceptance',
  'rejection',
  'task_submission',
  'task_review',
  'weekly_report',
  'event',
  'video_call',
  'registration_approved',
  'registration_request',
  'task_deadline',
  'new_type_here'  -- أضف النوع الجديد هنا
) NOT NULL DEFAULT 'general';
```

---

## ✅ Checklist للإشعارات الجديدة

عند إضافة نوع إشعار جديد:

- [ ] إضافة النوع للـ ENUM في قاعدة البيانات
- [ ] تحديث هذا الملف بالتوثيق
- [ ] إضافة أيقونة ولون في الـ Frontend
- [ ] إضافة ترجمة إذا لزم الأمر
- [ ] اختبار الإشعار في جميع السيناريوهات
- [ ] تحديث الـ migration files

---

**آخر تحديث:** November 3, 2025  
**الإصدار:** 1.1 (بعد دمج mergevideocall)
