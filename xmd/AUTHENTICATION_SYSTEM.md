# نظام الموافقة على التسجيل (Registration Approval System)

## نظرة عامة
تم تطوير نظام موافقة Admin على طلبات التسجيل الجديدة. المستخدمون الجدد لا يمكنهم الدخول مباشرة بعد التسجيل، بل يجب أن يوافق الـ Admin على طلباتهم أولاً.

## كيفية عمل النظام

### 1. عملية التسجيل (Sign Up)
عندما يقوم مستخدم جديد بالتسجيل:
- ✅ يتم حفظ بياناته في جدول `Registration_Requests` بحالة `pending`
- ✅ يتم إرسال notification تلقائي لجميع الـ Admins
- ✅ يظهر للمستخدم رسالة: "Registration request submitted successfully. Please wait for admin approval."
- ❌ **لا يتم** إنشاء حساب في جدول `Users` مباشرة
- ❌ **لا يمكن** للمستخدم تسجيل الدخول حتى الموافقة

### 2. لوحة تحكم Admin
في صفحة Admin Dashboard:
- 📊 يظهر عدد الطلبات المعلقة في Overview (Pending Registrations)
- 🔔 يظهر badge على زر Notifications يوضح عدد الطلبات المعلقة
- 📋 في قسم Notifications يوجد جدولين:
  - **Pending Registration Requests**: طلبات التسجيل المعلقة
  - **All Notifications**: كل الإشعارات

### 3. الموافقة على الطلب (Approve)
عندما يوافق Admin على طلب:
- ✅ يتم إنشاء المستخدم في جدول `Users`
- ✅ يتم إنشاء السجلات المرتبطة حسب نوع المستخدم:
  - **Company**: يتم إنشاء سجل في `Company`
  - **University**: يتم إنشاء سجل في `Universities`
  - **Student**: يتم إنشاء سجل في `Students` (مع ربطه بالجامعة إن وجدت)
  - **Trainer**: يتم إنشاء سجل في `Trainers` (مع ربطه بالشركة)
- ✅ يتم تحديث حالة الطلب إلى `approved`
- ✅ يمكن للمستخدم الآن تسجيل الدخول بنجاح

### 4. رفض الطلب (Reject)
عندما يرفض Admin طلب:
- ❌ يتم تحديث حالة الطلب إلى `rejected`
- ❌ **لا يمكن** للمستخدم تسجيل الدخول
- ❌ إذا حاول التسجيل مرة أخرى، يظهر له: "Your registration request was rejected. Please contact support."

### 5. محاولة تسجيل الدخول (Login)
- ✅ **إذا تمت الموافقة**: يمكن تسجيل الدخول بنجاح
- ❌ **إذا معلق**: لا يوجد حساب في `Users`، يظهر "Invalid email or password"
- ❌ **إذا مرفوض**: لا يوجد حساب في `Users`، يظهر "Invalid email or password"

## الجداول المستخدمة

### Registration_Requests
```sql
CREATE TABLE Registration_Requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  user_type ENUM('student', 'company', 'university', 'trainer') NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Notifications
```sql
CREATE TABLE Notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('appointment', 'submission', 'meeting', 'general') NOT NULL DEFAULT 'general',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
```

## API Endpoints

### للمستخدمين
- `POST /api/auth/signup` - تسجيل طلب جديد
- `POST /api/auth/login` - تسجيل الدخول (يعمل فقط للمستخدمين الموافق عليهم)

### للـ Admin
- `POST /api/admin/registration-requests` - جلب كل طلبات التسجيل
- `POST /api/admin/registration-requests/approve` - الموافقة على طلب
- `POST /api/admin/registration-requests/reject` - رفض طلب
- `POST /api/admin/notifications` - جلب كل الإشعارات
- `POST /api/admin/stats` - الإحصائيات (تتضمن عدد الطلبات المعلقة)

## خطوات التشغيل

### 1. إنشاء الجداول
```bash
cd backend
node scripts/createNotificationsTable.js
node scripts/createRegistrationRequestsTable.js
```

### 2. إعادة تشغيل الـ Server
```bash
npm start
```

## سيناريو الاستخدام الكامل

1. **مستخدم جديد يسجل**:
   - يملأ نموذج التسجيل
   - يضغط Sign Up
   - يظهر له: "Registration request submitted successfully. Please wait for admin approval."

2. **Admin يستلم إشعار**:
   - يظهر badge على زر Notifications
   - يدخل على Notifications
   - يرى الطلب في جدول "Pending Registration Requests"

3. **Admin يوافق**:
   - يضغط على زر "Approve"
   - يتم إنشاء الحساب
   - يختفي الطلب من قائمة Pending

4. **المستخدم يسجل دخول**:
   - يدخل Email و Password
   - يتم تسجيل الدخول بنجاح
   - ينتقل إلى Dashboard الخاص به

## ملاحظات مهمة

- ⚠️ المستخدمون الحاليون في جدول `Users` يمكنهم تسجيل الدخول مباشرة
- ⚠️ فقط المستخدمون الجدد يحتاجون موافقة Admin
- ⚠️ Admin نفسه لا يحتاج موافقة (يمكن إنشاؤه مباشرة في قاعدة البيانات)
- ⚠️ الطلبات المرفوضة تبقى في قاعدة البيانات لحفظ السجل
