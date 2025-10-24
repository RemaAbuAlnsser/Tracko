# نظام الدردشة (Chat System) - دليل الاستخدام

## 🎯 نظرة عامة

تم تطوير نظام دردشة فوري (Real-time Chat) بين المدربين والطلاب باستخدام **Supabase** لتوفير تواصل سلس ومباشر.

## 🚀 المميزات

- ✅ دردشة فورية (Real-time) باستخدام Supabase
- ✅ عرض قائمة الطلاب المخصصين لكل مدرب
- ✅ إرسال واستقبال الرسائل لحظياً
- ✅ عداد الرسائل غير المقروءة
- ✅ تمييز الرسائل المرسلة والمستقبلة
- ✅ تمرير تلقائي للرسائل الجديدة
- ✅ واجهة مستخدم جميلة وسهلة الاستخدام

## 📋 المتطلبات

### 1. Supabase Setup

يجب إنشاء جدول `messages` في Supabase:

```sql
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء Index لتحسين الأداء
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- تفعيل Real-time
ALTER TABLE messages REPLICA IDENTITY FULL;
```

### 2. تثبيت المكتبات

```bash
cd frontend
npm install @supabase/supabase-js
```

## 📁 الملفات المضافة

### Frontend

1. **`frontend/src/config/supabase.js`**
   - تكوين اتصال Supabase
   - يحتوي على SUPABASE_URL و SUPABASE_KEY

2. **`frontend/src/utils/chatService.js`**
   - دوال خدمة الدردشة
   - `loadChatMessages()` - تحميل الرسائل
   - `sendChatMessage()` - إرسال رسالة
   - `subscribeToMessages()` - الاشتراك في الرسائل الفورية
   - `markMessagesAsRead()` - تحديد الرسائل كمقروءة
   - `getUnreadCount()` - الحصول على عدد الرسائل غير المقروءة

3. **`frontend/src/pages/TrainerDashboard.js`** (محدّث)
   - إضافة Real-time subscription
   - تحديث قسم Messages
   - عرض الطلاب كمحادثات

4. **`frontend/src/styles/TrainerDashboard.css`** (محدّث)
   - إضافة أنماط chat-header
   - تحسين عرض البريد الإلكتروني للطالب

## 🔧 كيفية الاستخدام

### للمدرب (Trainer):

1. **الدخول إلى Messages**
   - سجل الدخول كـ Trainer
   - اضغط على "Messages" في الـ Sidebar

2. **اختيار طالب**
   - ستظهر قائمة بجميع الطلاب المخصصين لك
   - اضغط على اسم الطالب لفتح المحادثة

3. **إرسال رسالة**
   - اكتب رسالتك في حقل الإدخال
   - اضغط "Send" أو Enter
   - ستظهر الرسالة فوراً

4. **استقبال الرسائل**
   - الرسائل الجديدة تظهر تلقائياً
   - عداد الرسائل غير المقروءة يظهر بجانب اسم الطالب
   - الرسائل غير المقروءة تُحدد كمقروءة عند فتح المحادثة

## 🎨 واجهة المستخدم

### قسم Messages يحتوي على:

#### 1. قائمة الطلاب (Conversations Sidebar)
- عرض جميع الطلاب المخصصين للمدرب
- صورة رمزية لكل طالب (أول حرف من الاسم)
- اسم الطالب والبريد الإلكتروني
- عداد الرسائل غير المقروءة
- تمييز المحادثة النشطة

#### 2. منطقة الدردشة (Chat Area)
- **رأس المحادثة (Chat Header)**:
  - صورة رمزية للطالب
  - اسم الطالب
  - البريد الإلكتروني

- **قائمة الرسائل**:
  - رسائل المدرب: باللون الأزرق على اليمين
  - رسائل الطالب: بخلفية بيضاء على اليسار
  - وقت إرسال كل رسالة
  - تمرير تلقائي للرسائل الجديدة

- **حقل الإدخال**:
  - حقل نصي لكتابة الرسالة
  - زر إرسال مع أيقونة
  - تعطيل زر الإرسال عند عدم وجود نص

## 🔄 Real-time Functionality

### كيف يعمل النظام:

1. **عند تحميل الصفحة**:
   - يتم الاشتراك في قناة Supabase للرسائل
   - يستمع لأي رسائل جديدة موجهة للمدرب

2. **عند إرسال رسالة**:
   - يتم إرسال الرسالة إلى Supabase
   - Supabase يبث الرسالة فوراً لجميع المشتركين
   - تظهر الرسالة في المحادثة تلقائياً

3. **عند استقبال رسالة**:
   - يتم استقبال الرسالة عبر Real-time subscription
   - تُضاف الرسالة إلى قائمة الرسائل
   - يتم التمرير التلقائي للأسفل
   - يُحدث عداد الرسائل غير المقروءة

4. **عند إغلاق الصفحة**:
   - يتم إلغاء الاشتراك من قناة Supabase
   - تنظيف الموارد

## 🔐 الأمان

- ✅ استخدام معرفات المستخدمين (user_id) للتحقق
- ✅ فلترة الرسائل حسب المرسل والمستقبل
- ✅ Supabase Row Level Security (يُنصح بتفعيله)

## 📊 بنية البيانات

### جدول Messages في Supabase

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | معرف الرسالة (Primary Key) |
| sender_id | INTEGER | معرف المرسل |
| receiver_id | INTEGER | معرف المستقبل |
| message | TEXT | نص الرسالة |
| read | BOOLEAN | حالة القراءة |
| created_at | TIMESTAMP | وقت الإرسال |

## 🐛 استكشاف الأخطاء

### المشكلة: الرسائل لا تظهر فوراً
**الحل**:
- تأكد من تفعيل Real-time في Supabase
- تحقق من صحة SUPABASE_URL و SUPABASE_KEY
- افتح Console في المتصفح وتحقق من الأخطاء

### المشكلة: لا يظهر الطلاب في القائمة
**الحل**:
- تأكد من أن المدرب لديه طلاب مخصصين
- تحقق من endpoint: `/api/trainers/${trainerId}/students`
- تأكد من وجود بيانات في جدول Trainer_Students

### المشكلة: عداد الرسائل غير المقروءة لا يعمل
**الحل**:
- تأكد من تحديث حقل `read` في جدول messages
- تحقق من دالة `markMessagesAsRead()` في chatService.js

## 📝 ملاحظات مهمة

1. **معرفات المستخدمين**:
   - يجب أن يكون لكل طالب `user_id` في جدول Students
   - المدرب يستخدم `user.id` من localStorage

2. **Supabase Credentials**:
   - لا تشارك SUPABASE_KEY في الكود العام
   - استخدم متغيرات البيئة في الإنتاج

3. **الأداء**:
   - يتم تحميل الرسائل فقط عند فتح المحادثة
   - Real-time subscription يعمل فقط للمحادثة النشطة

## 🎯 التطوير المستقبلي

- [ ] إضافة إشعارات صوتية للرسائل الجديدة
- [ ] إمكانية إرسال الصور والملفات
- [ ] حالة "يكتب الآن..." (Typing indicator)
- [ ] البحث في الرسائل
- [ ] أرشفة المحادثات
- [ ] تصدير المحادثات كـ PDF

## 🔗 الروابط المفيدة

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Real-time](https://supabase.com/docs/guides/realtime)
- [React Hooks](https://react.dev/reference/react)

---

**تم التطوير بنجاح! 🎉**

للمساعدة أو الأسئلة، راجع التوثيق أو اتصل بفريق التطوير.
