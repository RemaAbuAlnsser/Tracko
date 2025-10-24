# 💬 نظام الدردشة - Tracko Chat System

<div align="center">

![Chat System](https://img.shields.io/badge/Status-Ready-success)
![Real-time](https://img.shields.io/badge/Real--time-Supabase-blue)
![React](https://img.shields.io/badge/React-19.2.0-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)

**نظام دردشة فوري بين المدربين والطلاب باستخدام Supabase**

[البدء السريع](#-البدء-السريع) • [المميزات](#-المميزات) • [التوثيق](#-التوثيق) • [الدعم](#-الدعم)

</div>

---

## 📖 نظرة عامة

نظام دردشة فوري (Real-time) متكامل يربط المدربين بطلابهم، مبني على تقنية Supabase Real-time لتوفير تجربة محادثة سلسة وفورية.

### ✨ المميزات الرئيسية

- 🚀 **دردشة فورية** - الرسائل تظهر لحظياً بدون تحديث
- 👥 **إدارة الطلاب** - عرض جميع الطلاب المخصصين
- 🔔 **إشعارات** - عداد الرسائل غير المقروءة
- 💬 **واجهة جميلة** - تصميم عصري وسهل الاستخدام
- ⚡ **أداء عالي** - تحميل سريع واستجابة فورية
- 🔐 **آمن** - Row Level Security في Supabase

---

## 🚀 البدء السريع

### المتطلبات

- Node.js 14+
- MySQL Database
- Supabase Account (مجاني)

### التثبيت

#### 1️⃣ إعداد Supabase

```bash
# 1. افتح https://supabase.com/dashboard
# 2. أنشئ مشروع جديد أو استخدم موجود
# 3. اذهب إلى SQL Editor
# 4. افتح ملف SUPABASE_SETUP.sql
# 5. انسخ والصق الكود وشغّله
# 6. فعّل Real-time: Database > Replication > messages
```

#### 2️⃣ تحديث Credentials

```javascript
// في frontend/src/config/supabase.js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-public-key';
```

#### 3️⃣ تثبيت Dependencies

```bash
# Frontend (إذا لم يكن مثبت)
cd frontend
npm install

# Backend
cd backend
npm install
```

#### 4️⃣ التشغيل

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

#### 5️⃣ الاستخدام

1. افتح `http://localhost:3000`
2. سجل دخول كـ **Trainer**
3. اضغط على **Messages**
4. اختر طالب من القائمة
5. ابدأ الدردشة! 🎉

---

## 🎯 المميزات

### للمدربين

| الميزة | الوصف |
|--------|-------|
| 📋 قائمة الطلاب | عرض جميع الطلاب المخصصين مع معلوماتهم |
| 💬 دردشة فورية | إرسال واستقبال الرسائل لحظياً |
| 🔔 إشعارات | عداد الرسائل غير المقروءة لكل طالب |
| 📱 Responsive | يعمل على جميع الأجهزة |
| ⚡ سريع | استجابة فورية وأداء ممتاز |

### التقنيات

- **Frontend**: React 19.2.0, Supabase Client
- **Backend**: Node.js, Express, MySQL
- **Database**: Supabase PostgreSQL
- **Real-time**: Supabase Real-time Subscriptions
- **Styling**: Custom CSS

---

## 📁 بنية المشروع

```
Tracko_Gp/
├── frontend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js          ✨ جديد - تكوين Supabase
│   │   ├── utils/
│   │   │   └── chatService.js       ✨ جديد - خدمات الدردشة
│   │   ├── pages/
│   │   │   └── TrainerDashboard.js  🔄 محدّث - واجهة الدردشة
│   │   └── styles/
│   │       └── TrainerDashboard.css 🔄 محدّث - أنماط الدردشة
│   └── package.json                 🔄 محدّث - Supabase dependency
│
├── backend/
│   └── routes/
│       └── trainer.js               🔄 محدّث - API endpoint
│
├── CHAT_SYSTEM_GUIDE.md             ✨ دليل شامل
├── CHAT_QUICK_START.md              ✨ البدء السريع
├── SUPABASE_SETUP.sql               ✨ إعداد قاعدة البيانات
├── TEST_CHAT.md                     ✨ دليل الاختبار
├── CHAT_IMPLEMENTATION_SUMMARY.md   ✨ ملخص التطوير
└── README_CHAT.md                   ✨ هذا الملف
```

---

## 📚 التوثيق

### دليل البدء

- 📘 [**CHAT_QUICK_START.md**](CHAT_QUICK_START.md) - ابدأ من هنا!
  - خطوات التشغيل
  - حل المشاكل الشائعة
  - Checklist سريع

### دليل شامل

- 📗 [**CHAT_SYSTEM_GUIDE.md**](CHAT_SYSTEM_GUIDE.md) - كل التفاصيل
  - شرح المميزات
  - كيفية الاستخدام
  - بنية البيانات
  - استكشاف الأخطاء
  - التطوير المستقبلي

### قاعدة البيانات

- 📙 [**SUPABASE_SETUP.sql**](SUPABASE_SETUP.sql) - إعداد Supabase
  - إنشاء جدول messages
  - Indexes للأداء
  - تفعيل Real-time
  - Row Level Security
  - أمثلة اختبار

### الاختبار

- 📕 [**TEST_CHAT.md**](TEST_CHAT.md) - دليل الاختبار
  - سيناريو اختبار كامل
  - خطوات مفصلة
  - الأخطاء الشائعة
  - Checklist النهائي

### ملخص التطوير

- 📔 [**CHAT_IMPLEMENTATION_SUMMARY.md**](CHAT_IMPLEMENTATION_SUMMARY.md)
  - ما تم إنجازه
  - الملفات المُنشأة
  - التقنيات المستخدمة
  - الأداء

---

## 🔧 API Reference

### Frontend Functions

#### `chatService.js`

```javascript
// تحميل الرسائل
loadChatMessages(trainerId, studentId)

// إرسال رسالة
sendChatMessage(senderId, receiverId, messageText)

// الاشتراك في Real-time
subscribeToMessages(userId, onNewMessage)

// إلغاء الاشتراك
unsubscribeFromMessages(channel)

// تحديد كمقروءة
markMessagesAsRead(senderId, receiverId)

// عدد غير المقروءة
getUnreadCount(userId, fromUserId)
```

### Backend Endpoints

```javascript
// جلب طلاب المدرب
GET /api/trainers/:trainerId/students

Response: {
  success: true,
  students: [
    {
      id: 1,
      user_id: 5,
      full_name: "Student Name",
      email: "student@example.com",
      ...
    }
  ]
}
```

---

## 🎨 Screenshots

### قائمة الطلاب
```
┌─────────────────────────────────┐
│ My Students                     │
├─────────────────────────────────┤
│ [S] Student Name            [2] │
│     student@example.com         │
├─────────────────────────────────┤
│ [A] Another Student             │
│     another@example.com         │
└─────────────────────────────────┘
```

### منطقة الدردشة
```
┌─────────────────────────────────┐
│ [S] Student Name                │
│     student@example.com         │
├─────────────────────────────────┤
│                                 │
│  Hello! How are you?            │
│  10:30 AM                       │
│                                 │
│              I'm good, thanks!  │
│                       10:31 AM  │
│                                 │
├─────────────────────────────────┤
│ Type your message...      [Send]│
└─────────────────────────────────┘
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: لا تظهر الرسائل فوراً

**الحل**:
1. تحقق من تفعيل Real-time في Supabase
2. افتح Console (F12) وابحث عن أخطاء
3. تحقق من Network tab - يجب أن ترى WebSocket

### المشكلة: لا يظهر الطلاب

**الحل**:
```sql
-- تحقق من الطلاب المقبولين
SELECT * FROM Internship_Matches 
WHERE status = 'accepted';
```

### المشكلة: user_id is undefined

**الحل**:
```sql
-- تحديث user_id في جدول Students
UPDATE Students s
JOIN Users u ON u.email = s.email
SET s.user_id = u.id
WHERE s.user_id IS NULL;
```

**للمزيد**: راجع [TEST_CHAT.md](TEST_CHAT.md)

---

## 🔐 الأمان

### في التطوير

```javascript
// يمكنك تعطيل RLS مؤقتاً
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

### في الإنتاج

```javascript
// فعّل RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

// استخدم متغيرات البيئة
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;
```

**⚠️ مهم**: لا تشارك SUPABASE_KEY في GitHub!

---

## 📊 الأداء

### النتائج المتوقعة

| العملية | الوقت |
|---------|-------|
| إرسال رسالة | < 100ms |
| استقبال رسالة | فوري (Real-time) |
| تحميل محادثة | < 200ms |
| تحديث العداد | فوري |

### التحسينات المُنفذة

- ✅ Database Indexes
- ✅ تحميل عند الطلب
- ✅ Real-time للمحادثة النشطة فقط
- ✅ Cleanup للموارد
- ✅ Auto-scroll optimization

---

## 🚧 التطوير المستقبلي

### قريباً

- [ ] إشعارات صوتية
- [ ] Typing indicator
- [ ] البحث في الرسائل

### مستقبلاً

- [ ] إرسال صور وملفات
- [ ] رسائل صوتية
- [ ] مكالمات فيديو
- [ ] Emoji picker
- [ ] تصدير المحادثات

---

## 🤝 المساهمة

نرحب بالمساهمات! إذا كان لديك اقتراح:

1. Fork المشروع
2. أنشئ Feature Branch
3. Commit التغييرات
4. Push إلى Branch
5. افتح Pull Request

---

## 📝 License

هذا المشروع مفتوح المصدر ومتاح للاستخدام الحر.

---

## 🆘 الدعم

### الوثائق

- [CHAT_QUICK_START.md](CHAT_QUICK_START.md) - البدء السريع
- [CHAT_SYSTEM_GUIDE.md](CHAT_SYSTEM_GUIDE.md) - دليل شامل
- [TEST_CHAT.md](TEST_CHAT.md) - دليل الاختبار

### الروابط المفيدة

- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Express Docs](https://expressjs.com)

### اتصل بنا

إذا واجهت مشكلة:
1. راجع ملفات التوثيق
2. ابحث في Issues
3. افتح Issue جديد

---

## ✅ Checklist

قبل الاستخدام، تأكد من:

- [ ] Supabase project مُنشأ
- [ ] جدول messages موجود
- [ ] Real-time مفعّل
- [ ] Credentials محدّثة
- [ ] Dependencies مثبّتة
- [ ] Backend يعمل
- [ ] Frontend يعمل
- [ ] تم الاختبار

---

## 🎉 شكراً!

تم تطوير هذا النظام بعناية لتوفير أفضل تجربة دردشة ممكنة.

**نتمنى لك استخداماً سعيداً! 🚀**

---

<div align="center">

Made with ❤️ for Tracko

[⬆ العودة للأعلى](#-نظام-الدردشة---tracko-chat-system)

</div>
