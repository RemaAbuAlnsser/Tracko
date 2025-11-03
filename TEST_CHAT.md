# 🧪 اختبار نظام الدردشة

## سيناريو الاختبار الكامل

### المتطلبات الأولية

قبل البدء، تأكد من:
- ✅ Supabase تم إعداده بشكل صحيح
- ✅ جدول `messages` موجود
- ✅ Real-time مفعّل
- ✅ Backend يعمل على port 5050
- ✅ Frontend يعمل على port 3000

---

## 📝 خطوات الاختبار

### 1. إعداد البيانات التجريبية

#### أ. إنشاء مدرب (Trainer)
```sql
-- في MySQL (Backend Database)
-- تأكد من وجود مدرب في النظام
SELECT * FROM Trainers LIMIT 1;
```

#### ب. إنشاء طالب مقبول
```sql
-- تأكد من وجود طالب مقبول في تدريب المدرب
SELECT 
  s.id,
  s.user_id,
  u.full_name,
  u.email,
  im.status
FROM Students s
JOIN Users u ON s.user_id = u.id
JOIN Internship_Matches im ON s.id = im.student_id
WHERE im.status = 'accepted'
LIMIT 1;
```

### 2. اختبار تسجيل الدخول

1. افتح المتصفح: `http://localhost:3000`
2. سجل دخول كـ **Trainer** (user_type = 'company')
3. يجب أن تظهر TrainerDashboard

### 3. اختبار قسم Messages

#### أ. فتح Messages
1. اضغط على زر **"Messages"** في Sidebar
2. **النتيجة المتوقعة**:
   - تظهر قائمة الطلاب في الجانب الأيسر
   - إذا لم يكن هناك طلاب، تظهر رسالة "No students yet"

#### ب. اختيار طالب
1. اضغط على اسم طالب من القائمة
2. **النتيجة المتوقعة**:
   - تظهر منطقة الدردشة
   - يظهر اسم الطالب في الأعلى
   - تظهر رسالة "No messages yet" إذا لم تكن هناك رسائل سابقة

#### ج. إرسال رسالة
1. اكتب رسالة في حقل الإدخال: "مرحباً! هذه رسالة اختبار"
2. اضغط **Send** أو Enter
3. **النتيجة المتوقعة**:
   - تظهر الرسالة فوراً في منطقة الدردشة
   - الرسالة باللون الأزرق على اليمين
   - يظهر وقت الإرسال

### 4. اختبار Real-time

#### أ. فتح نافذتين
1. افتح نافذة متصفح جديدة (Incognito/Private)
2. سجل دخول كـ **Student** (نفس الطالب)
3. في النافذة الأولى (Trainer): أرسل رسالة
4. **النتيجة المتوقعة**:
   - تظهر الرسالة في نافذة الطالب فوراً
   - تظهر على اليسار بخلفية بيضاء

#### ب. اختبار الرد
1. في نافذة الطالب: أرسل رد
2. **النتيجة المتوقعة**:
   - تظهر الرسالة في نافذة المدرب فوراً
   - يُحدث عداد الرسائل غير المقروءة

### 5. اختبار عداد الرسائل غير المقروءة

1. في نافذة الطالب: أرسل 3 رسائل
2. في نافذة المدرب: لا تفتح المحادثة
3. **النتيجة المتوقعة**:
   - يظهر عداد "3" بجانب اسم الطالب
   - عند فتح المحادثة، يختفي العداد

---

## 🔍 فحص Console

### في المتصفح (F12 > Console)

يجب أن ترى:
```
📥 Loaded trainer data: {...}
👥 Getting accepted students for trainer X...
✅ Found Y accepted students for trainer X
```

### في Supabase Dashboard

1. اذهب إلى: `Table Editor` > `messages`
2. يجب أن ترى الرسائل المرسلة
3. تحقق من:
   - `sender_id` صحيح
   - `receiver_id` صحيح
   - `message` يحتوي على النص
   - `read` = false للرسائل الجديدة

---

## 🐛 الأخطاء الشائعة وحلولها

### ❌ "No students yet"

**السبب**: لا يوجد طلاب مقبولين للمدرب

**الحل**:
```sql
-- تحقق من جدول Internship_Trainers
SELECT * FROM Internship_Trainers WHERE trainer_id = YOUR_TRAINER_ID;

-- تحقق من الطلاب المقبولين
SELECT * FROM Internship_Matches 
WHERE internship_id IN (
  SELECT internship_id FROM Internship_Trainers 
  WHERE trainer_id = YOUR_TRAINER_ID
) AND status = 'accepted';
```

### ❌ الرسائل لا تظهر فوراً

**الأسباب المحتملة**:
1. Real-time غير مفعّل في Supabase
2. خطأ في SUPABASE_URL أو SUPABASE_KEY
3. مشكلة في الاتصال

**الحل**:
```javascript
// افتح Console وتحقق من:
// 1. لا توجد أخطاء في Console
// 2. تحقق من Network tab - يجب أن ترى WebSocket connection
// 3. في Supabase Dashboard > Database > Replication
//    تأكد من تفعيل Real-time للجدول messages
```

### ❌ "user_id is undefined"

**السبب**: جدول Students لا يحتوي على user_id

**الحل**:
```sql
-- تحقق من جدول Students
SELECT id, user_id FROM Students LIMIT 5;

-- إذا كان user_id = NULL، قم بتحديثه:
UPDATE Students s
JOIN Users u ON u.email = s.email
SET s.user_id = u.id
WHERE s.user_id IS NULL;
```

---

## ✅ Checklist النهائي

قبل الانتهاء، تأكد من:

- [ ] جدول messages موجود في Supabase
- [ ] Real-time مفعّل للجدول messages
- [ ] SUPABASE_URL و SUPABASE_KEY صحيحان
- [ ] Backend endpoint `/api/trainers/:id/students` يعمل
- [ ] Students لديهم user_id
- [ ] يمكن إرسال واستقبال الرسائل
- [ ] Real-time يعمل بشكل صحيح
- [ ] عداد الرسائل غير المقروءة يعمل
- [ ] التمرير التلقائي يعمل
- [ ] الواجهة تظهر بشكل صحيح

---

## 📊 نتائج الاختبار المتوقعة

### ✅ نجاح الاختبار إذا:

1. ✅ قائمة الطلاب تظهر بشكل صحيح
2. ✅ يمكن فتح محادثة مع طالب
3. ✅ يمكن إرسال رسالة
4. ✅ الرسالة تظهر فوراً
5. ✅ Real-time يعمل (الرسائل تظهر في النافذتين)
6. ✅ عداد الرسائل غير المقروءة يعمل
7. ✅ التمرير التلقائي يعمل
8. ✅ الواجهة جميلة وسهلة الاستخدام

---

## 🎉 تهانينا!

إذا نجحت جميع الاختبارات، فإن نظام الدردشة يعمل بشكل مثالي! 🚀

للمزيد من المعلومات، راجع:
- `CHAT_SYSTEM_GUIDE.md` - دليل شامل
- `CHAT_QUICK_START.md` - دليل البدء السريع
- `SUPABASE_SETUP.sql` - إعداد قاعدة البيانات
