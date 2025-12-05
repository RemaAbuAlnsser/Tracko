# Trainer Profile - دليل الاستخدام

## نظرة عامة
تم إنشاء نظام كامل لإدارة ملفات المدربين (Trainers) مع صفحة Profile & Edit مخصصة.

## الميزات الرئيسية

### 1. جدول Trainers في قاعدة البيانات
يحتوي على الحقول التالية:
- `id` - المعرف الفريد
- `company_id` - معرف الشركة (Foreign Key)
- `internship_id` - معرف التدريب (اختياري)
- `user_id` - معرف المستخدم (Foreign Key)
- `specialization` - التخصص
- `experience_years` - سنوات الخبرة
- `bio` - السيرة الذاتية
- `linkedin_url` - رابط LinkedIn
- `github_url` - رابط GitHub
- `hourly_rate` - السعر بالساعة
- `max_trainees` - الحد الأقصى للمتدربين
- `status` - الحالة (active, inactive, pending)
- `created_at` - تاريخ الإنشاء
- `updated_at` - تاريخ التحديث

### 2. التسجيل التلقائي للمدربين
عند التسجيل بـ `user_type: "company"`:
- يتم استخراج الدومين من الإيميل (مثل: ahmad@asal.com → asal.com)
- البحث عن شركة لها نفس الدومين
- إذا وُجدت الشركة: يتم إنشاء سجل Trainer تلقائياً مرتبط بالشركة
- إذا لم تُوجد: يتم إنشاء شركة جديدة

### 3. صفحة Trainer Profile
صفحة مخصصة للمدربين تحتوي على:

#### Professional Information
- Specialization (التخصص)
- Years of Experience (سنوات الخبرة)
- Hourly Rate (السعر بالساعة)
- Maximum Trainees (الحد الأقصى للمتدربين)

#### Contact & Social Links
- LinkedIn URL (رابط LinkedIn)
- GitHub URL (رابط GitHub)
- Status (الحالة)

#### About Me
- Bio (السيرة الذاتية)

## API Endpoints

### Trainer Routes (`/api/trainers`)

#### 1. Get Trainer by User ID
```
GET /api/trainers/user/:userId
```
يُستخدم لجلب بيانات المدرب بناءً على user_id

#### 2. Get Trainer by ID
```
GET /api/trainers/:id
```
يُستخدم لجلب بيانات المدرب بناءً على trainer_id

#### 3. Get Trainers by Company
```
GET /api/trainers/company/:companyId
```
يُستخدم لجلب جميع المدربين التابعين لشركة معينة

#### 4. Get All Trainers
```
GET /api/trainers?status=active
```
يُستخدم لجلب جميع المدربين (مع إمكانية الفلترة حسب الحالة)

#### 5. Update Trainer Profile
```
PUT /api/trainers/:id
Body: {
  "specialization": "Full Stack Development",
  "experience_years": 5,
  "bio": "Experienced developer...",
  "linkedin_url": "https://linkedin.com/in/ahmad",
  "github_url": "https://github.com/ahmad",
  "hourly_rate": 50.00,
  "max_trainees": 10,
  "status": "active"
}
```

#### 6. Update Trainer Status
```
PATCH /api/trainers/:id/status
Body: {
  "status": "active"
}
```

#### 7. Delete Trainer
```
DELETE /api/trainers/:id
```

## الملفات المُنشأة

### Backend
1. `/backend/models/Trainer.js` - Model للتعامل مع جدول Trainers
2. `/backend/routes/trainer.js` - Routes للـ API
3. `/backend/scripts/createTrainersTable.js` - سكريبت إنشاء الجدول
4. `/backend/scripts/trainers_table.sql` - SQL لإنشاء الجدول
5. `/backend/scripts/updateTrainersTable.sql` - SQL لتحديث الجدول

### Frontend
1. `/frontend/src/pages/TrainerProfile.js` - صفحة الملف الشخصي
2. `/frontend/src/styles/TrainerProfile.css` - تنسيقات الصفحة

### Updates
- تم تحديث `/backend/routes/auth.js` لإضافة منطق إنشاء Trainer
- تم تحديث `/backend/server.js` لإضافة trainer routes
- تم تحديث `/frontend/src/App.js` لإضافة route الصفحة

## كيفية الوصول للصفحة

### للمدرب (Trainer):
1. تسجيل الدخول بحساب company
2. الانتقال إلى: `http://localhost:3000/trainer-profile`

### من Dashboard الشركة:
يمكن إضافة رابط في CompanyDashboard للانتقال إلى صفحة Trainer Profile

## مثال على الاستخدام

### 1. تسجيل مدرب جديد
```bash
curl -X POST http://localhost:5050/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Ahmad Trainer",
    "email": "ahmad@asal.com",
    "password": "password123",
    "user_type": "company"
  }'
```

### 2. جلب بيانات المدرب
```bash
curl http://localhost:5050/api/trainers/user/6
```

### 3. تحديث بيانات المدرب
```bash
curl -X PUT http://localhost:5050/api/trainers/1 \
  -H "Content-Type: application/json" \
  -d '{
    "specialization": "Full Stack Development",
    "experience_years": 5,
    "bio": "Experienced developer with 5 years in web development",
    "linkedin_url": "https://linkedin.com/in/ahmad",
    "github_url": "https://github.com/ahmad",
    "hourly_rate": 50.00,
    "max_trainees": 10,
    "status": "active"
  }'
```

## ملاحظات مهمة

1. **الحقول linkedin_url و github_url**: تم إضافتهما لجدول Trainers في قاعدة البيانات
2. **التحقق من الدومين**: يتم تلقائياً عند التسجيل
3. **الربط بالشركة**: يتم تلقائياً بناءً على دومين الإيميل
4. **الأمان**: يجب إضافة authentication middleware للـ routes

## التطوير المستقبلي

يمكن إضافة:
- رفع صورة شخصية للمدرب
- تقييمات من المتدربين
- جدول زمني للتوفر
- شهادات ومهارات
- محفظة أعمال (Portfolio)
