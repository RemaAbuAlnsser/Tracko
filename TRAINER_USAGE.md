# TrainerDashboard - دليل الاستخدام السريع

## 🚀 كيفية الوصول

1. افتح المتصفح واذهب إلى: `http://localhost:3000/trainer-dashboard`
2. سجل الدخول بحساب trainer (مثل: ahmad@asal.com)

## 📋 الحقول المتاحة

### Professional Information
- **Specialization**: التخصص (مثل: Full Stack Development)
- **Years of Experience**: سنوات الخبرة (رقم)
- **Hourly Rate**: السعر بالساعة بالدولار (رقم عشري)
- **Maximum Trainees**: الحد الأقصى للمتدربين (رقم صحيح، الحد الأدنى 1)

### Contact & Social Links
- **LinkedIn URL**: رابط LinkedIn الخاص بك
- **GitHub URL**: رابط GitHub الخاص بك
- **Status**: الحالة (Active, Inactive, Pending)

### About Me
- **Bio**: السيرة الذاتية (نص طويل)

## ✅ كيفية الحفظ

1. اضغط على **Profile & Edit** من القائمة الجانبية
2. املأ الحقول المطلوبة
3. اضغط على **Save Changes**
4. ستظهر رسالة نجاح في الأعلى
5. البيانات تُحفظ في جدول **Trainers** في قاعدة البيانات

## 🔍 التحقق من البيانات

### في Dashboard:
- عدد المتدربين الأقصى
- سنوات الخبرة
- السعر بالساعة
- الحالة
- التخصص
- السيرة الذاتية (إذا موجودة)
- روابط LinkedIn و GitHub (إذا موجودة)

### في قاعدة البيانات:
```sql
SELECT * FROM Trainers WHERE user_id = 6;
```

## 🎯 مثال على البيانات

```json
{
  "specialization": "Full Stack Development",
  "experience_years": 5,
  "bio": "Experienced developer with 5 years in web development",
  "linkedin_url": "https://linkedin.com/in/ahmad",
  "github_url": "https://github.com/ahmad",
  "hourly_rate": 50.00,
  "max_trainees": 10,
  "status": "active"
}
```

## ⚠️ Validation Rules

- **Hourly Rate**: لا يمكن أن يكون سالب
- **Max Trainees**: يجب أن يكون 1 على الأقل
- **Experience Years**: لا يمكن أن يكون سالب
- **LinkedIn/GitHub URLs**: يجب أن تبدأ بـ https://

## 🔧 API Endpoint

```
PUT http://localhost:5050/api/trainers/:id
Content-Type: application/json

Body: {
  "specialization": "string",
  "experience_years": number,
  "bio": "string",
  "linkedin_url": "string",
  "github_url": "string",
  "hourly_rate": number,
  "max_trainees": number,
  "status": "active|inactive|pending"
}
```

## 📊 الجدول في قاعدة البيانات

```sql
-- جدول Trainers
CREATE TABLE Trainers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  internship_id INT,
  user_id INT NOT NULL,
  specialization VARCHAR(255),
  experience_years INT,
  bio TEXT,
  linkedin_url VARCHAR(255),
  github_url VARCHAR(255),
  hourly_rate DECIMAL(10, 2),
  max_trainees INT DEFAULT 5,
  status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES Company(id) ON DELETE CASCADE,
  FOREIGN KEY (internship_id) REFERENCES Internships(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
```

## 🎨 الألوان المستخدمة

- **Primary**: `#1e88e5` (أزرق)
- **Secondary**: `#1565c0` (أزرق غامق)
- **Success**: `#48bb78` (أخضر)
- **Error**: `#dc2626` (أحمر)
- **Background**: `#f8f9fa` (رمادي فاتح)

## 📱 Responsive

الصفحة متجاوبة مع جميع الأحجام:
- Desktop: عرض كامل مع sidebar
- Tablet: عمود واحد للـ forms
- Mobile: stack layout كامل
