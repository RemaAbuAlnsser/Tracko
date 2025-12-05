# نظام المكالمات الفيديو - ZEGOCLOUD Integration

## نظرة عامة
تم إنشاء نظام مكالمات فيديو متكامل بين المدربين والطلاب باستخدام ZEGOCLOUD API.

## المميزات
- ✅ المدرب يمكنه اختيار التدريب
- ✅ المدرب يمكنه اختيار الطلاب المشاركين
- ✅ إنشاء غرفة فيديو تلقائياً
- ✅ إرسال روابط الدعوة للطلاب المحددين
- ✅ الطلاب يتلقون إشعارات مع رابط الانضمام
- ✅ مكالمات جماعية (Group Call)
- ✅ مشاركة الشاشة
- ✅ واجهة مستخدم احترافية

## التثبيت

### 1. تثبيت ZEGOCLOUD Package
```bash
cd frontend
npm install @zegocloud/zego-uikit-prebuilt
```

### 2. بيانات الاعتماد (Credentials)
تم استخدام البيانات التالية في الكود:
- **App ID**: 1157513066
- **Server Secret**: 9c6df6b74a544dd002fb60d233dc08c9

⚠️ **ملاحظة مهمة**: هذه البيانات للتطوير فقط. يجب استبدالها ببيانات حسابك الخاص من [ZEGOCLOUD Console](https://console.zegocloud.com/)

## كيفية الاستخدام

### للمدرب (Trainer):
1. تسجيل الدخول إلى لوحة التحكم
2. الذهاب إلى قسم **Video Call** من القائمة الجانبية
3. اختيار التدريب من القائمة المنسدلة
4. اختيار الطلاب المراد دعوتهم (يمكن اختيار أكثر من طالب)
5. الضغط على زر **Start Video Call**
6. سيتم فتح غرفة الفيديو تلقائياً
7. سيتم إرسال إشعارات للطلاب المحددين مع رابط الانضمام

### للطالب (Student):
1. سيتلقى الطالب إشعار في قسم **Notifications**
2. الضغط على زر **📞 Join Call** في الإشعار
3. سيتم فتح غرفة الفيديو في نافذة جديدة
4. الانضمام للمكالمة مباشرة

## الملفات المضافة/المعدلة

### Frontend:
- ✅ `frontend/src/components/VideoCall.js` - مكون المكالمة الفيديو
- ✅ `frontend/src/pages/VideoCallPage.js` - صفحة المكالمة المستقلة
- ✅ `frontend/src/pages/TrainerDashboard.js` - إضافة واجهة Video Call
- ✅ `frontend/src/pages/StudentDashboard.js` - إضافة زر Join Call
- ✅ `frontend/src/App.js` - إضافة route للفيديو كول

### Backend:
- ✅ `backend/routes/videoCall.js` - API endpoints للمكالمات
- ✅ `backend/routes/internship.js` - إضافة endpoint للحصول على الطلاب
- ✅ `backend/server.js` - تسجيل routes الجديدة

## API Endpoints

### POST `/api/video-call/invite`
إرسال دعوات المكالمة للطلاب

**Request Body:**
```json
{
  "trainerId": 1,
  "trainerName": "Ahmed Ali",
  "studentIds": [1, 2, 3],
  "roomId": "tracko-1-1234567890-abc123",
  "videoCallLink": "http://localhost:3000/video-call?roomID=tracko-1-1234567890-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video call invitations sent successfully",
  "roomId": "tracko-1-1234567890-abc123",
  "videoCallLink": "http://localhost:3000/video-call?roomID=tracko-1-1234567890-abc123"
}
```

### GET `/api/internships/:internshipId/students`
الحصول على قائمة الطلاب المقبولين في تدريب معين

**Response:**
```json
{
  "success": true,
  "students": [
    {
      "student_id": 1,
      "user_id": 5,
      "full_name": "محمد أحمد",
      "email": "student@example.com",
      "student_img": "/uploads/students/image.jpg",
      "university_name": "جامعة القاهرة"
    }
  ]
}
```

## قاعدة البيانات

### جدول Notifications
يتم تخزين دعوات المكالمات في جدول الإشعارات:

```sql
- type: 'video_call'
- title: 'Video Call Invitation'
- message: '[Trainer Name] has invited you to join a video call...'
- data: JSON string containing:
  {
    "roomId": "room-id",
    "videoCallLink": "full-url",
    "trainerId": 1,
    "trainerName": "Trainer Name"
  }
```

## المميزات التقنية

### ZEGOCLOUD Features:
- ✅ Group Video Calls
- ✅ Screen Sharing
- ✅ Audio/Video Controls
- ✅ Chat (built-in)
- ✅ Participant List
- ✅ Recording (optional)

### Security:
- ✅ Token-based authentication
- ✅ Unique room IDs per session
- ✅ Server-side validation

## استكشاف الأخطاء

### المشكلة: لا يظهر الفيديو
**الحل**: تأكد من منح الأذونات للكاميرا والميكروفون في المتصفح

### المشكلة: لا يتم إرسال الإشعارات
**الحل**: تحقق من:
1. الطالب مقبول في التدريب (status = 'accepted')
2. البيانات صحيحة في جدول students
3. Backend server يعمل بشكل صحيح

### المشكلة: خطأ في Token
**الحل**: تحقق من App ID و Server Secret في `VideoCall.js`

## التطوير المستقبلي
- [ ] إضافة تسجيل المكالمات
- [ ] إضافة جدولة المكالمات
- [ ] إضافة تقارير حضور المكالمات
- [ ] إضافة مكالمات فردية (1-on-1)
- [ ] إضافة رسائل داخل المكالمة

## الدعم
للمزيد من المعلومات حول ZEGOCLOUD:
- [Documentation](https://docs.zegocloud.com/)
- [API Reference](https://docs.zegocloud.com/article/api)
- [Console](https://console.zegocloud.com/)

---
تم التطوير بواسطة Tracko Team 🚀
