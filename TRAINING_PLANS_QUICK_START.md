# Training Plans - دليل البدء السريع

## 🚀 البدء السريع

### 1. تشغيل Backend
```bash
cd backend
npm start
```
الجداول ستُنشأ تلقائياً عند أول تشغيل.

### 2. تشغيل Frontend
```bash
cd frontend
npm start
```

### 3. استخدام الميزة

#### كمدرب (Trainer):
1. سجل الدخول كـ Trainer
2. اضغط على **"Training Plans"** في الـ Sidebar
3. اختر التدريب من القائمة
4. املأ معلومات الخطة:
   - العنوان
   - الوصف
   - المدة بالأسابيع
5. اضغط **"+ Add Week"** لإضافة أسابيع
6. املأ تفاصيل كل أسبوع:
   - العنوان
   - الوصف
   - الأهداف
   - المهام
   - الموارد
   - المخرجات
7. اضغط **"Create Plan"**

## 📋 API Endpoints

### إنشاء خطة
```http
POST /api/plans
Content-Type: application/json

{
  "internship_id": 1,
  "trainer_id": 1,
  "title": "خطة تدريب Full Stack",
  "description": "خطة شاملة لتعليم Full Stack Development",
  "duration_weeks": 8,
  "start_date": "2025-01-01",
  "end_date": "2025-02-26",
  "status": "active",
  "weeks": [
    {
      "week_number": 1,
      "title": "مقدمة في HTML و CSS",
      "description": "تعلم أساسيات HTML و CSS",
      "objectives": "فهم بنية HTML\nإتقان CSS Basics",
      "tasks": "بناء صفحة ويب بسيطة\nتطبيق Flexbox",
      "resources": "MDN Web Docs\nCSS Tricks",
      "deliverables": "صفحة Landing Page"
    }
  ]
}
```

### جلب خطط المدرب
```http
GET /api/plans/trainer/:trainerId
```

### جلب تفاصيل خطة
```http
GET /api/plans/:planId
```

### جلب خطط تدريب معين
```http
GET /api/plans/internship/:internshipId
```

## 🗄️ بنية قاعدة البيانات

### Internship_Plans
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| internship_id | INT | FK -> Internships |
| trainer_id | INT | FK -> Trainers |
| title | VARCHAR(255) | عنوان الخطة |
| description | TEXT | وصف الخطة |
| duration_weeks | INT | المدة بالأسابيع |
| start_date | DATE | تاريخ البداية |
| end_date | DATE | تاريخ النهاية |
| status | ENUM | draft/active/completed/cancelled |

### Plan_Weeks
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key |
| plan_id | INT | FK -> Internship_Plans |
| week_number | INT | رقم الأسبوع |
| title | VARCHAR(255) | عنوان الأسبوع |
| description | TEXT | وصف الأسبوع |
| objectives | TEXT | الأهداف التعليمية |
| tasks | TEXT | المهام |
| resources | TEXT | الموارد |
| deliverables | TEXT | المخرجات |

## 🎨 الواجهة

### قسم Training Plans يحتوي على:
- ✅ نموذج إنشاء خطة جديدة
- ✅ إضافة/حذف أسابيع ديناميكياً
- ✅ عرض جميع الخطط في Grid
- ✅ Modal لعرض التفاصيل الكاملة
- ✅ معلومات التدريب والشركة
- ✅ حالة الخطة (Status Badge)

## 🔧 الملفات الرئيسية

### Backend:
- `backend/models/InternshipPlan.js` - Model
- `backend/routes/internshipPlan.js` - Routes
- `backend/server.js` - Server config

### Frontend:
- `frontend/src/pages/TrainerDashboard.js` - UI
- `frontend/src/styles/TrainerDashboard.css` - Styles

## ✨ المميزات

- ✅ إنشاء خطط تدريب مفصلة
- ✅ تخطيط أسبوعي شامل
- ✅ ربط الخطة بالتدريب والمدرب
- ✅ حالات متعددة للخطة
- ✅ واجهة سهلة الاستخدام
- ✅ عرض تفاصيل كاملة
- ✅ تصميم responsive

## 🎯 حالات الخطة

- **Draft**: مسودة (قيد الإعداد)
- **Active**: نشطة (جارية حالياً)
- **Completed**: مكتملة
- **Cancelled**: ملغاة

## 📱 للطلاب (قريباً)

سيتمكن الطلاب المقبولين في التدريب من:
- عرض خطة التدريب الخاصة بهم
- متابعة التقدم الأسبوعي
- رفع المخرجات المطلوبة
- التواصل مع المدرب

---

**تم التطوير بنجاح! 🎉**
