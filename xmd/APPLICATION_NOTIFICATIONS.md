# نظام إشعارات قبول/رفض الطلبات

## التاريخ
21 أكتوبر 2025

## الوصف
تم إضافة نظام إشعارات تلقائي يرسل إشعارات للطلاب عندما تقوم الشركة بقبول أو رفض طلباتهم للتدريب.

---

## الميزات المضافة

### 1. إشعار القبول ✅
عندما تضغط الشركة على زر **Accept**:
- يتم تحديث حالة الطلب إلى `accepted`
- يتم إرسال إشعار للطالب تلقائياً
- الإشعار يحتوي على:
  - العنوان: "🎉 Application Accepted!"
  - الرسالة: تهنئة + اسم التدريب + اسم الشركة
  - النوع: `application`

### 2. إشعار الرفض ❌
عندما تضغط الشركة على زر **Reject**:
- يتم تحديث حالة الطلب إلى `rejected`
- يتم إرسال إشعار للطالب تلقائياً
- الإشعار يحتوي على:
  - العنوان: "Application Update"
  - الرسالة: شكر + اسم التدريب + اسم الشركة + تشجيع
  - النوع: `application`

---

## التعديلات على الكود

### 1. InternshipMatch Model
**الملف**: `backend/models/InternshipMatch.js`

**إضافة دالة جديدة**:
```javascript
// Get match details by ID (for notifications)
static getMatchDetailsById(matchId) {
  const query = `
    SELECT 
      im.*,
      s.user_id as student_user_id,
      u.full_name as student_name,
      u.email as student_email,
      i.title as internship_title,
      i.company_id,
      c.name as company_name
    FROM Internship_Matches im
    INNER JOIN Students s ON im.student_id = s.id
    INNER JOIN Users u ON s.user_id = u.id
    INNER JOIN Internships i ON im.internship_id = i.id
    INNER JOIN Company c ON i.company_id = c.id
    WHERE im.id = ?
  `;
  
  return new Promise((resolve, reject) => {
    db.query(query, [matchId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
}
```

**الفائدة**: هذه الدالة تجلب جميع المعلومات اللازمة لإنشاء الإشعار (user_id للطالب، اسم التدريب، اسم الشركة).

---

### 2. Matching Routes
**الملف**: `backend/routes/matching.js`

#### إضافة Import:
```javascript
import Notification from "../models/Notification.js";
```

#### تحديث Accept Endpoint:
```javascript
// Accept applicant
router.post("/applicant/:matchId/accept", async (req, res) => {
  try {
    const { matchId } = req.params;
    
    console.log(`✅ Accepting applicant with match ID ${matchId}...`);

    // Get match details before updating
    const matchDetails = await InternshipMatch.getMatchDetailsById(matchId);
    
    if (!matchDetails) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Update status to accepted
    await InternshipMatch.updateStatus(matchId, 'accepted');

    console.log(`✅ Applicant ${matchId} accepted`);

    // Send notification to student
    try {
      await Notification.create({
        user_id: matchDetails.student_user_id,
        title: '🎉 Application Accepted!',
        message: `Congratulations! Your application for "${matchDetails.internship_title}" at ${matchDetails.company_name} has been accepted.`,
        type: 'application'
      });
      console.log(`📧 Notification sent to student (user_id: ${matchDetails.student_user_id})`);
    } catch (notifError) {
      console.error("⚠️  Failed to send notification:", notifError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Applicant accepted successfully"
    });

  } catch (error) {
    console.error("❌ Accept applicant error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
```

#### تحديث Reject Endpoint:
```javascript
// Reject applicant
router.post("/applicant/:matchId/reject", async (req, res) => {
  try {
    const { matchId } = req.params;
    
    console.log(`❌ Rejecting applicant with match ID ${matchId}...`);

    // Get match details before updating
    const matchDetails = await InternshipMatch.getMatchDetailsById(matchId);
    
    if (!matchDetails) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Update status to rejected
    await InternshipMatch.updateStatus(matchId, 'rejected');

    console.log(`❌ Applicant ${matchId} rejected`);

    // Send notification to student
    try {
      await Notification.create({
        user_id: matchDetails.student_user_id,
        title: 'Application Update',
        message: `Thank you for your interest in "${matchDetails.internship_title}" at ${matchDetails.company_name}. Unfortunately, your application was not selected at this time. Keep looking for other opportunities!`,
        type: 'application'
      });
      console.log(`📧 Notification sent to student (user_id: ${matchDetails.student_user_id})`);
    } catch (notifError) {
      console.error("⚠️  Failed to send notification:", notifError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Applicant rejected successfully"
    });

  } catch (error) {
    console.error("❌ Reject applicant error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
```

---

## كيفية العمل

### سيناريو القبول:
1. الشركة تفتح CompanyDashboard
2. تذهب إلى قسم "Applications" أو "Applicants"
3. تضغط على زر **Accept** لطالب معين
4. يتم إرسال POST request إلى `/api/matching/applicant/:matchId/accept`
5. Backend يقوم بـ:
   - جلب معلومات الطالب والتدريب
   - تحديث حالة الطلب إلى `accepted`
   - إنشاء إشعار جديد في جدول `Notifications`
6. الطالب يرى الإشعار في StudentDashboard

### سيناريو الرفض:
نفس الخطوات لكن مع رسالة مختلفة وحالة `rejected`

---

## أمثلة على الإشعارات

### إشعار القبول:
```
Title: 🎉 Application Accepted!
Message: Congratulations! Your application for "Full Stack Developer Internship" at TechCorp has been accepted.
Type: application
```

### إشعار الرفض:
```
Title: Application Update
Message: Thank you for your interest in "Full Stack Developer Internship" at TechCorp. Unfortunately, your application was not selected at this time. Keep looking for other opportunities!
Type: application
```

---

## معالجة الأخطاء

- إذا فشل إرسال الإشعار، لن يفشل الـ request بالكامل
- يتم تسجيل الخطأ في console لكن يتم إرجاع success للشركة
- هذا يضمن أن عملية القبول/الرفض تتم حتى لو كان هناك مشكلة في الإشعارات

```javascript
try {
  await Notification.create({...});
  console.log(`📧 Notification sent`);
} catch (notifError) {
  console.error("⚠️  Failed to send notification:", notifError);
  // Don't fail the request if notification fails
}
```

---

## الاختبار

### اختبار القبول:
1. سجل دخول كـ Company
2. اذهب إلى Applications
3. اضغط Accept على أي طلب
4. سجل دخول كـ Student
5. افتح Notifications
6. يجب أن ترى إشعار القبول

### اختبار الرفض:
1. سجل دخول كـ Company
2. اذهب إلى Applications
3. اضغط Reject على أي طلب
4. سجل دخول كـ Student
5. افتح Notifications
6. يجب أن ترى إشعار الرفض

---

## Console Logs

عند تشغيل العملية، ستظهر هذه الرسائل في console:

**عند القبول:**
```
✅ Accepting applicant with match ID 9...
✅ Applicant 9 accepted
📧 Notification sent to student (user_id: 7)
```

**عند الرفض:**
```
❌ Rejecting applicant with match ID 10...
❌ Applicant 10 rejected
📧 Notification sent to student (user_id: 8)
```

---

## الملفات المعدلة

1. ✅ `backend/models/InternshipMatch.js`
   - إضافة `getMatchDetailsById()`

2. ✅ `backend/routes/matching.js`
   - إضافة import للـ Notification
   - تحديث `/applicant/:matchId/accept`
   - تحديث `/applicant/:matchId/reject`

3. ✅ `backend/migrations/005_add_application_type.sql`
   - إضافة `'application'` إلى ENUM للـ type في جدول Notifications

4. ✅ `backend/scripts/addApplicationType.js`
   - Script لتشغيل الـ migration

---

## خطوات التثبيت

### 1. تحديث جدول Notifications
قبل استخدام النظام، يجب إضافة نوع `'application'` إلى جدول Notifications:

```bash
cd backend
node scripts/addApplicationType.js
```

هذا سيضيف `'application'` إلى الـ ENUM values للـ `type` column.

### 2. اختبار النظام
للتأكد من أن كل شيء يعمل:

```bash
node scripts/testNotificationSystem.js
```

### 3. التحقق من بنية الجدول
للتحقق من أن التحديث تم بنجاح:

```bash
node scripts/checkNotificationsTable.js
```

يجب أن ترى:
```
type | enum('appointment','submission','meeting','general','application')
```

---

## الفوائد

1. **تجربة مستخدم أفضل**: الطلاب يعرفون فوراً حالة طلباتهم
2. **شفافية**: تواصل واضح بين الشركة والطالب
3. **توفير الوقت**: لا حاجة للطالب للتحقق يدوياً من حالة كل طلب
4. **احترافية**: نظام إشعارات تلقائي يعطي انطباع احترافي

---

## الحالة
✅ **مكتمل** - النظام جاهز للاستخدام
