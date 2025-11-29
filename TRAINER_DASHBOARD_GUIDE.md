# Trainer Dashboard - دليل الاستخدام

## نظرة عامة
تم إنشاء صفحة TrainerDashboard كاملة ومنفصلة للمدربين مع قسم Profile & Edit.

## الميزات

### 1. Dashboard الرئيسي
يعرض:
- **Max Trainees**: الحد الأقصى للمتدربين
- **Years Experience**: سنوات الخبرة
- **Hourly Rate**: السعر بالساعة
- **Status**: حالة المدرب
- **Specialization**: التخصص

### 2. Profile & Edit
قسم كامل لتعديل معلومات المدرب:

#### Professional Information
- **Specialization** - التخصص (مثل: Full Stack Development, Data Science)
- **Years of Experience** - سنوات الخبرة
- **Hourly Rate** - السعر بالساعة (بالدولار)
- **Maximum Trainees** - الحد الأقصى للمتدربين

#### Contact & Social Links
- **LinkedIn URL** - رابط LinkedIn مع زر Preview
- **GitHub URL** - رابط GitHub مع زر Preview
- **Status** - الحالة (Active, Inactive, Pending)

#### About Me
- **Bio** - السيرة الذاتية (textarea كبيرة)

## الملفات المُنشأة

### Frontend
1. `/frontend/src/pages/TrainerDashboard.js` - صفحة Dashboard الكاملة
2. `/frontend/src/styles/TrainerDashboard.css` - تنسيقات الصفحة

### Updates
- تم تحديث `/frontend/src/App.js` لإضافة route الصفحة

## كيفية الوصول للصفحة

### الطريقة 1: مباشرة
```
http://localhost:3000/trainer-dashboard
```

### الطريقة 2: من Login
عند تسجيل الدخول بحساب trainer (user_type: company)، يمكن التوجيه تلقائياً إلى:
- `/trainer-dashboard` للمدربين

## الأقسام في الصفحة

### Sidebar
- **Profile Section**: صورة المدرب (Initials) + الاسم + Badge
- **Navigation Menu**:
  - Dashboard (الرئيسية)
  - Profile & Edit (تعديل الملف الشخصي)
  - Logout (تسجيل الخروج)

### Main Content

#### Dashboard View
- ترحيب بالمدرب
- 4 بطاقات إحصائية (Stats Cards):
  - Max Trainees (أزرق)
  - Years Experience (أخضر)
  - Hourly Rate (بنفسجي)
  - Status (برتقالي)
- بطاقة التخصص (Quick Info Card)

#### Profile & Edit View
- نموذج من قسمين (2 columns):
  - Professional Information (يسار)
  - Contact & Social Links (يمين)
- قسم Bio (عرض كامل)
- أزرار Cancel و Save Changes

## التصميم

### الألوان
- **Primary Gradient**: `#667eea` → `#764ba2`
- **Background**: `#f5f7fa`
- **Cards**: White with shadow
- **Text**: `#2d3748` (headings), `#718096` (secondary)

### الأيقونات
- استخدام SVG icons من Heroicons
- أيقونات ملونة في Stats Cards

### Responsive
- Desktop: Sidebar ثابت + 2 columns في Forms
- Tablet: 1 column في Forms
- Mobile: Sidebar كامل العرض + Stack layout

## مثال على الاستخدام

### 1. تسجيل الدخول
```javascript
// في Login.js، بعد نجاح تسجيل الدخول:
if (user.user_type === 'company') {
  // Check if user is a trainer
  const trainerResponse = await fetch(`http://localhost:5050/api/trainers/user/${user.id}`);
  if (trainerResponse.ok) {
    const trainerData = await trainerResponse.json();
    if (trainerData.success && trainerData.trainer) {
      navigate('/trainer-dashboard');
    } else {
      navigate('/company-dashboard');
    }
  }
}
```

### 2. تحديث البيانات
عند الضغط على "Save Changes":
```javascript
PUT /api/trainers/:id
Body: {
  specialization: "Full Stack Development",
  experience_years: 5,
  bio: "Experienced developer...",
  linkedin_url: "https://linkedin.com/in/ahmad",
  github_url: "https://github.com/ahmad",
  hourly_rate: 50.00,
  max_trainees: 10,
  status: "active"
}
```

### 3. عرض البيانات
عند تحميل الصفحة:
```javascript
GET /api/trainers/user/:userId
Response: {
  success: true,
  trainer: {
    id: 1,
    specialization: "Full Stack Development",
    experience_years: 5,
    ...
  }
}
```

## الفرق بين TrainerDashboard و TrainerProfile

| Feature | TrainerDashboard | TrainerProfile |
|---------|------------------|----------------|
| **Layout** | Sidebar + Main Content | Full Page |
| **Navigation** | Multiple sections | Single page |
| **Dashboard** | ✅ Yes | ❌ No |
| **Stats Cards** | ✅ Yes | ❌ No |
| **Profile Edit** | ✅ Yes | ✅ Yes |
| **Use Case** | Main trainer portal | Standalone profile page |

## التطوير المستقبلي

يمكن إضافة:
1. **Trainees Management**: إدارة المتدربين
2. **Schedule**: جدول زمني للتدريب
3. **Earnings**: تتبع الأرباح
4. **Reviews**: تقييمات من المتدربين
5. **Certificates**: شهادات المدرب
6. **Portfolio**: معرض أعمال
7. **Messages**: نظام رسائل
8. **Notifications**: إشعارات

## ملاحظات مهمة

1. **Authentication**: يجب إضافة middleware للتحقق من صلاحيات المدرب
2. **Validation**: يجب التحقق من صحة البيانات في Backend
3. **Error Handling**: معالجة الأخطاء بشكل أفضل
4. **Loading States**: إضافة حالات التحميل
5. **Image Upload**: إضافة رفع صورة شخصية للمدرب

## الوصول السريع

- **Dashboard**: `http://localhost:3000/trainer-dashboard`
- **API Endpoint**: `http://localhost:5050/api/trainers`
- **Files**:
  - Component: `/frontend/src/pages/TrainerDashboard.js`
  - Styles: `/frontend/src/styles/TrainerDashboard.css`
