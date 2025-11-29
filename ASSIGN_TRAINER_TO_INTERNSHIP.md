# Assign Trainer to Internship - دليل الاستخدام

## 🎯 الهدف
عند إضافة Internship جديد في CompanyDashboard، يمكن اختيار Trainer وسيتم تحديث `internship_id` في جدول Trainers تلقائياً.

## 🔄 كيف يعمل؟

### 1. في CompanyDashboard
عند فتح صفحة Post Internship:
- يتم تحميل قائمة المدربين التابعين للشركة
- يظهر dropdown لاختيار المدرب (اختياري)

### 2. عند إنشاء Internship
```
1. إنشاء Internship → يرجع internship_id
2. إذا تم اختيار Trainer → تحديث internship_id في جدول Trainers
3. عرض رسالة نجاح
```

## 📋 الحقول في Form

### Internship Details:
- Title *
- Specialization
- Capacity *
- Status
- Description *
- Requirements
- **Assign Trainer** (جديد - اختياري)

## 🔍 API Calls

### 1. تحميل المدربين
```javascript
GET /api/trainers/company/:companyId

Response:
{
  "success": true,
  "trainers": [
    {
      "id": 1,
      "user_id": 6,
      "full_name": "Ahmad Trainer",
      "specialization": "Full Stack Development",
      ...
    }
  ]
}
```

### 2. إنشاء Internship
```javascript
POST /api/internships

Body: {
  "company_email": "asal570@asal.com",
  "title": "Software Development Intern",
  "description": "...",
  "requirements": "...",
  "specialization": "Web Development",
  "capacity": 5,
  "status": "open"
}

Response:
{
  "success": true,
  "message": "Internship created successfully",
  "internshipId": 10,
  "internship": {
    "id": 10,
    "company_id": 2,
    "title": "Software Development Intern",
    ...
  }
}
```

### 3. تعيين Trainer للـ Internship
```javascript
PUT /api/trainers/:trainerId

Body: {
  "internship_id": 10
}

Response:
{
  "success": true,
  "message": "Trainer profile updated successfully"
}
```

## 📊 التغييرات في قاعدة البيانات

### قبل:
```sql
SELECT * FROM Trainers WHERE id = 1;
-- internship_id: NULL
```

### بعد:
```sql
SELECT * FROM Trainers WHERE id = 1;
-- internship_id: 10
```

## 🧪 خطوات الاختبار

### 1. تسجيل الدخول كـ Company
```
Email: asal570@asal.com
Password: (كلمة المرور)
```

### 2. الذهاب إلى Post Internship
- اضغط على "Post Internship" من القائمة

### 3. ملء البيانات
- Title: "Backend Developer Intern"
- Description: "Work on Node.js projects"
- Specialization: "Software Engineering"
- Capacity: 3
- **Assign Trainer**: اختر "Ahmad Trainer"

### 4. حفظ
- اضغط "Post Internship"
- ستظهر رسالة نجاح

### 5. التحقق
```sql
-- في قاعدة البيانات
SELECT * FROM Trainers WHERE id = 1;
-- سترى internship_id تم تحديثه

SELECT * FROM Internships WHERE id = (آخر ID);
-- سترى الـ internship الجديد
```

## 💡 ملاحظات مهمة

### Trainer Dropdown:
- يعرض فقط المدربين التابعين لنفس الشركة
- إذا لم يكن هناك مدربين، يظهر رسالة "No trainers available"
- الحقل اختياري - يمكن إنشاء internship بدون trainer

### Multiple Trainers:
- حالياً، كل trainer يمكن أن يُعيّن لـ internship واحد فقط
- إذا تم تعيين trainer لـ internship جديد، سيتم تحديث internship_id القديم

### Error Handling:
- إذا فشل تعيين الـ trainer، لن يؤثر على إنشاء الـ internship
- سيتم عرض log في console

## 🔧 الكود المُضاف

### في CompanyDashboard.js:

#### State:
```javascript
const [trainers, setTrainers] = useState([]);
const [companyId, setCompanyId] = useState(null);
```

#### Load Trainers:
```javascript
const loadTrainers = async (companyId) => {
  const response = await fetch(`http://localhost:5050/api/trainers/company/${companyId}`);
  const data = await response.json();
  setTrainers(data.trainers || []);
};
```

#### Assign Trainer:
```javascript
if (internshipData.trainer_id && data.internship && data.internship.id) {
  await fetch(`http://localhost:5050/api/trainers/${internshipData.trainer_id}`, {
    method: 'PUT',
    body: JSON.stringify({ internship_id: data.internship.id })
  });
}
```

## ✅ الخلاصة

- ✅ يمكن اختيار Trainer عند إنشاء Internship
- ✅ يتم تحديث internship_id في جدول Trainers تلقائياً
- ✅ الحقل اختياري - يمكن إنشاء internship بدون trainer
- ✅ يعرض فقط المدربين التابعين لنفس الشركة
