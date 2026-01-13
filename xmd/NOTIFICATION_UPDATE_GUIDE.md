# دليل تحديث حالة الإشعارات

## التغييرات المطبقة

### 1. Backend Changes

#### ✅ `backend/routes/auth.js`
- تم تحديث رسالة الإشعار لتتضمن `Request ID` في النهاية
- الآن الرسالة تكون: `"[Name] ([Email]) has requested to register as [Type]. Request ID: [ID]"`

#### ✅ `backend/routes/admin.js`
- تم إضافة endpoint جديد: `PUT /api/admin/notifications/:notificationId/read?userId=<adminId>`
- تم تحديث middleware `isAdmin` لدعم query parameters
- تم إضافة console.log لتتبع العملية

### 2. Frontend Changes

#### ✅ `frontend/src/pages/AdminDashboard.js`
- تم إضافة دالة `markNotificationAsRead(requestId)`
- تم تحديث `handleApproveRequest` لاستدعاء الدالة
- تم تحديث `handleRejectRequest` لاستدعاء الدالة
- تم إضافة console.log لتتبع العملية

## كيفية الاختبار

### الخطوة 1: إنشاء طلب تسجيل جديد
1. افتح صفحة التسجيل
2. سجل كمستخدم جديد (company, student, trainer, أو university)
3. سيتم إنشاء طلب تسجيل جديد

### الخطوة 2: التحقق من الإشعار
1. سجل دخول كـ Admin
2. اذهب إلى صفحة Notifications
3. يجب أن ترى إشعاراً جديداً مع Status = "Unread"
4. تحقق من أن الرسالة تحتوي على "Request ID: [رقم]"

### الخطوة 3: الموافقة أو الرفض
1. اذهب إلى صفحة Notifications
2. اضغط على زر "Approve" أو "Reject"
3. افتح Console في المتصفح (F12)
4. يجب أن ترى:
   ```
   🔍 Looking for notifications related to request ID: [ID]
   📋 Total notifications: [عدد]
   ✅ Found related notifications: [عدد]
   📤 Marking notification as read: [notification_id]
   📥 Response: {success: true, message: "..."}
   🔄 Refreshing notifications...
   ```

### الخطوة 4: التحقق من التحديث
1. بعد الموافقة/الرفض، يجب أن يتحدث Status الإشعار إلى "Read"
2. تحقق من قاعدة البيانات:
   ```sql
   SELECT * FROM Notifications WHERE id = [notification_id];
   ```
   يجب أن يكون `is_read = 1` (TRUE)

## استكشاف الأخطاء

### المشكلة: لا يتم تحديث Status الإشعار

#### الحل 1: تحقق من Console
- افتح Console في المتصفح
- ابحث عن رسائل الخطأ
- تحقق من أن الـ API call يتم بنجاح

#### الحل 2: تحقق من Backend Logs
- افتح terminal الخاص بالـ backend
- ابحث عن:
  ```
  📥 Received request to mark notification as read: [ID]
  ✅ Notification marked as read successfully: [ID]
  ```

#### الحل 3: تحقق من قاعدة البيانات
```sql
-- تحقق من الإشعارات الموجودة
SELECT * FROM Notifications ORDER BY created_at DESC LIMIT 10;

-- تحقق من رسالة الإشعار
SELECT id, message, is_read FROM Notifications WHERE message LIKE '%Request ID:%';

-- تحديث يدوي للاختبار
UPDATE Notifications SET is_read = TRUE WHERE id = [notification_id];
```

#### الحل 4: تحقق من أن الرسالة تحتوي على Request ID
```sql
SELECT id, message FROM Notifications WHERE message LIKE '%Request ID:%';
```

إذا لم تجد أي نتائج، فهذا يعني أن الإشعارات القديمة لا تحتوي على Request ID.
الحل: سجل طلب تسجيل جديد للاختبار.

## ملاحظات مهمة

1. **الإشعارات القديمة**: الإشعارات التي تم إنشاؤها قبل هذا التحديث لن تحتوي على "Request ID" في الرسالة، لذلك لن يتم تحديثها تلقائياً.

2. **إشعارات متعددة**: إذا كان هناك أكثر من admin، سيتم إنشاء إشعار لكل admin، وسيتم تحديث جميع الإشعارات المتعلقة بنفس الطلب.

3. **التحديث التلقائي**: بعد تحديث حالة الإشعار، يتم تحديث قائمة الإشعارات تلقائياً لإظهار الحالة الجديدة.

## API Endpoints

### Mark Notification as Read
```
PUT /api/admin/notifications/:notificationId/read?userId=<adminId>

Response:
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Get All Notifications
```
POST /api/admin/notifications
Body: { "userId": <adminId> }

Response:
{
  "success": true,
  "notifications": [...]
}
```
