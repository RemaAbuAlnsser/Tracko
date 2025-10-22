# 🔔 New Internship Notifications Feature

## Overview
عند نشر تدريب جديد من قبل الشركة، يتم تلقائياً إرسال إشعارات للطلاب الذين تتطابق ملفاتهم الشخصية مع متطلبات التدريب بنسبة أعلى من 50%.

## How It Works

### 1. عند إنشاء تدريب جديد
عندما تقوم الشركة بإنشاء تدريب جديد عبر `POST /api/internships`:
- يتم حفظ التدريب في قاعدة البيانات
- يتم استدعاء دالة `notifyMatchingStudents()` بشكل غير متزامن

### 2. عملية المطابقة
الدالة `notifyMatchingStudents()` تقوم بـ:
1. جلب جميع الطلاب من قاعدة البيانات
2. لكل طالب:
   - التحقق من وجود CV محلل
   - استخراج GPA و work mode preference من CV
   - حساب نسبة المطابقة باستخدام `aiMatchingService`
   - إذا كانت النسبة > 50%، يتم إرسال إشعار

### 3. محتوى الإشعار
```javascript
{
  title: '🎯 New Matching Internship!',
  message: 'A new internship "[اسم التدريب]" at [اسم الشركة] matches your profile with [النسبة]% compatibility!',
  type: 'general'
}
```

## Matching Criteria

### العوامل المؤثرة في نسبة المطابقة:
1. **Skills Matching** - المهارات المطلوبة مقابل مهارات الطالب
2. **GPA Requirements** - إذا كان GPA الطالب يلبي الحد الأدنى
3. **Work Mode Preference** - تطابق نوع العمل (onsite/online/hybrid)
4. **Specialization** - التخصص المطلوب

### Threshold
- **50%+** = يتم إرسال إشعار
- **أقل من 50%** = لا يتم إرسال إشعار

## Code Location

### Main Implementation
- **File**: `/backend/routes/internship.js`
- **Function**: `notifyMatchingStudents(internshipId, internshipData)`
- **Called from**: POST `/api/internships` endpoint (line 66-77)

### Dependencies
- `Student.findAll()` - جلب جميع الطلاب
- `CV.findByStudentId()` - جلب CV الطالب
- `aiMatchingService.calculateMatch()` - حساب نسبة المطابقة
- `Notification.create()` - إنشاء الإشعار

## Example Flow

```
1. Company creates internship:
   POST /api/internships
   {
     "title": "Frontend Developer Intern",
     "requirements": "React, JavaScript, HTML, CSS",
     "specialization": "Frontend",
     "min_gpa": 3.0,
     "work_mode": "hybrid"
   }

2. System processes:
   - Internship saved ✅
   - notifyMatchingStudents() triggered 🔔
   
3. For each student:
   - Student A: 75% match → Notification sent ✅
   - Student B: 45% match → No notification ❌
   - Student C: 82% match → Notification sent ✅
   
4. Result:
   - 2 notifications sent
   - Students can see notifications in their dashboard
```

## Benefits

✅ **Automatic** - لا حاجة لتدخل يدوي
✅ **Relevant** - فقط الطلاب المناسبين يتلقون الإشعارات
✅ **Real-time** - الإشعارات تُرسل فوراً بعد نشر التدريب
✅ **Non-blocking** - لا تؤثر على سرعة إنشاء التدريب

## Logs

عند تشغيل الميزة، ستظهر logs مثل:
```
🔔 Starting notification process for internship 123...
📊 Found 50 students to check
✅ Notification sent to Ahmad (75% match)
✅ Notification sent to Sara (82% match)
✅ Notification process completed: 2 notifications sent
```

## Future Enhancements

- [ ] إضافة تصفية حسب الجامعة (university partnerships)
- [ ] إرسال إشعارات email بالإضافة للإشعارات داخل النظام
- [ ] السماح للطلاب بتخصيص نسبة المطابقة المفضلة
- [ ] إضافة إحصائيات عن عدد الإشعارات المرسلة
