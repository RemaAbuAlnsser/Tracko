# دليل إنشاء الجداول المطلوبة 📋

## الجداول المطلوبة

### 1. جدول Task_Submissions (تسليمات الطلاب) ✅
### 2. تحديث جدول notifications (الإشعارات) ✅

---

## خطوات الإنشاء

### الخطوة 1: إنشاء جدول التسليمات

في terminal، اذهب لمجلد backend وشغل:

```bash
cd backend
node scripts/createTaskSubmissionsTable.js
```

**ماذا يفعل؟**
ينشئ جدول `Task_Submissions` الذي يخزن:
- ✅ تسليم كل طالب (submission_file, submission_text, submission_link)
- ✅ تاريخ التسليم (submitted_at)
- ✅ حالة القبول/الرفض (status: pending/approved/rejected)
- ✅ تعليق المدرب (trainer_comment)
- ✅ تاريخ المراجعة (reviewed_at)

---

### الخطوة 2: تحديث جدول الإشعارات

```bash
node scripts/updateNotificationsTypeEnum.js
```

**ماذا يفعل؟**
يضيف أنواع جديدة لجدول `notifications`:
- ✅ `task_submission` - عند تسليم الطالب
- ✅ `task_review` - عند مراجعة المدرب (يحتوي على تعليق المدرب)

---

## بنية الجداول

### Task_Submissions
```sql
CREATE TABLE Task_Submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,              -- رقم الطالب
  trainer_id INT NOT NULL,              -- رقم المدرب
  week_id INT NOT NULL,                 -- رقم الأسبوع
  plan_id INT NOT NULL,                 -- رقم الخطة
  task_title VARCHAR(255) NOT NULL,     -- اسم المهمة
  
  -- طرق التسليم (واحدة على الأقل)
  submission_file VARCHAR(500),         -- ملف مرفوع
  submission_text TEXT,                 -- نص مكتوب
  submission_link VARCHAR(500),         -- رابط
  
  -- المراجعة
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  trainer_comment TEXT,                 -- تعليق المدرب
  
  -- التواريخ
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### notifications (محدث)
```sql
type ENUM(
  'appointment', 
  'submission', 
  'meeting', 
  'general', 
  'training_plan', 
  'training_report', 
  'application',
  'task_submission',  -- جديد: عند تسليم الطالب
  'task_review'       -- جديد: عند مراجعة المدرب (يحتوي على التعليق)
)
```

---

## سير العمل الكامل

### 1. الطالب يسلم المهمة:
```javascript
// يتم تخزين في Task_Submissions
{
  student_id: 1,
  trainer_id: 1,
  task_title: "Task 1",
  submission_file: "/uploads/files/solution.pdf",
  status: "pending",
  submitted_at: "2025-10-24 19:30:00"
}

// يتم إنشاء إشعار للمدرب في notifications
{
  user_id: 5, // المدرب
  title: "New Task Submission",
  message: "noor has submitted a solution for: Task 1",
  type: "task_submission"
}
```

### 2. المدرب يراجع ويعلق:
```javascript
// يتم تحديث في Task_Submissions
{
  status: "approved", // أو "rejected"
  trainer_comment: "عمل ممتاز! استمر",
  reviewed_at: "2025-10-24 20:00:00"
}

// يتم إنشاء إشعار للطالب في notifications
{
  user_id: 7, // الطالب
  title: "Task Approved ✅",
  message: "Your submission for 'Task 1' has been approved! Comment: عمل ممتاز! استمر",
  type: "task_review"
}
```

### 3. الطالب يستقبل الإشعار:
- يظهر في قسم Notifications
- يحتوي على تعليق المدرب
- مخزن في جدول notifications

---

## التحقق من النجاح

بعد تشغيل السكريبتات، تحقق من:

```sql
-- تحقق من جدول التسليمات
SHOW TABLES LIKE 'Task_Submissions';
DESC Task_Submissions;

-- تحقق من جدول الإشعارات
DESC notifications;
SHOW COLUMNS FROM notifications LIKE 'type';
```

---

## ملاحظات مهمة

1. ✅ **التسليمات**: كل تسليم يُخزن مع تاريخه
2. ✅ **المراجعة**: حالة القبول/الرفض تُخزن في نفس الجدول
3. ✅ **التعليقات**: تعليق المدرب يُخزن في حقلين:
   - `Task_Submissions.trainer_comment` - في جدول التسليمات
   - `notifications.message` - في الإشعار المرسل للطالب
4. ✅ **الإشعارات**: تُخزن في جدول notifications وتُرسل تلقائياً

---

## جاهز للاستخدام! 🎉

بعد تشغيل السكريبتات:
1. ✅ جدول التسليمات جاهز
2. ✅ جدول الإشعارات محدث
3. ✅ النظام يعمل بالكامل
4. ✅ كل شيء يُخزن في قاعدة البيانات
