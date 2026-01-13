# 💼 Trainer Internships Feature

## نظرة عامة
تم إضافة قسم "My Internships" في TrainerDashboard يعرض جميع التدريبات التي تم تعيين المدرب عليها من جدول `Internship_Trainers`.

## ✨ الميزات

### 1. **عرض التدريبات**
- قائمة بجميع التدريبات المعينة للمدرب
- معلومات الشركة (اسم، لوجو)
- تفاصيل التدريب (عنوان، تخصص، capacity)
- إحصائيات (عدد المتقدمين، عدد المقبولين)

### 2. **زر في Sidebar**
- زر "My Internships" مع أيقونة حقيبة
- يظهر بين "Profile & Edit" و "My Students"

## 🔧 التعديلات المطبقة

### 1. Backend - API Endpoint جديد

#### في `/backend/routes/internship.js`:
```javascript
// Get internships for a specific trainer
router.get("/trainer/:trainerId", async (req, res) => {
  const query = `
    SELECT 
      i.*,
      c.name as company_name,
      c.logo as company_logo,
      COUNT(DISTINCT im.id) as applicants_count,
      COUNT(DISTINCT CASE WHEN im.status = 'accepted' THEN im.id END) as accepted_count
    FROM Internships i
    INNER JOIN Internship_Trainers it ON i.id = it.internship_id
    INNER JOIN Company c ON i.company_id = c.id
    LEFT JOIN Internship_Matches im ON i.id = im.internship_id
    WHERE it.trainer_id = ?
    GROUP BY i.id, c.name, c.logo
    ORDER BY i.created_at DESC
  `;
  // ...
});
```

**الـ Query يجلب:**
- جميع بيانات التدريب من `Internships`
- اسم ولوجو الشركة من `Company`
- عدد المتقدمين من `Internship_Matches`
- عدد المقبولين (status = 'accepted')
- يفلتر بـ `trainer_id` من `Internship_Trainers`

### 2. Frontend - TrainerDashboard.js

#### إضافة State:
```javascript
const [internships, setInternships] = useState([]);
```

#### إضافة دالة loadInternships:
```javascript
const loadInternships = async () => {
  if (!trainerId) return;
  const response = await fetch(`http://localhost:5050/api/internships/trainer/${trainerId}`);
  const data = await response.json();
  if (data.success) {
    setInternships(data.internships || []);
  }
};
```

#### إضافة زر في Sidebar:
```javascript
<button 
  className={`nav-item ${activeMenu === 'internships' ? 'active' : ''}`}
  onClick={() => { setActiveMenu('internships'); loadInternships(); }}
>
  <svg>...</svg>
  My Internships
</button>
```

#### إضافة قسم العرض:
```javascript
{activeMenu === 'internships' && (
  <div className="internships-grid">
    {internships.map(internship => (
      <div className="internship-card">
        {/* Company info */}
        {/* Internship details */}
        {/* Statistics */}
      </div>
    ))}
  </div>
)}
```

## 📊 هيكل البيانات

### API Response:
```json
{
  "success": true,
  "internships": [
    {
      "id": 1,
      "title": "Frontend Developer Intern",
      "description": "...",
      "specialization": "Web Development",
      "capacity": 5,
      "status": "open",
      "created_at": "2025-10-20T...",
      "company_name": "TechCorp",
      "company_logo": "/uploads/logos/...",
      "applicants_count": 12,
      "accepted_count": 3
    }
  ]
}
```

## 🎨 التصميم

### Internship Card يعرض:
1. **Header:**
   - لوجو الشركة
   - عنوان التدريب
   - اسم الشركة
   - حالة التدريب (open/closed)

2. **Details:**
   - التخصص
   - عدد المقاعد
   - تاريخ النشر

3. **Statistics:**
   - عدد المتقدمين
   - عدد المقبولين

4. **Description:**
   - أول 150 حرف من الوصف

## 🔄 كيف يعمل النظام

### 1. عند تعيين مدرب لتدريب:
```sql
INSERT INTO Internship_Trainers (internship_id, trainer_id)
VALUES (1, 5);
```

### 2. عند دخول المدرب:
```
1. المدرب يسجل دخول
   ↓
2. يتم جلب trainer_id من قاعدة البيانات
   ↓
3. المدرب يضغط على "My Internships"
   ↓
4. يتم استدعاء loadInternships()
   ↓
5. GET /api/internships/trainer/:trainerId
   ↓
6. يتم عرض التدريبات
```

### 3. الـ Query:
```sql
SELECT i.*, c.name, c.logo, COUNT(im.id) as applicants_count
FROM Internships i
INNER JOIN Internship_Trainers it ON i.id = it.internship_id
INNER JOIN Company c ON i.company_id = c.id
LEFT JOIN Internship_Matches im ON i.id = im.internship_id
WHERE it.trainer_id = 5
GROUP BY i.id
```

## 🧪 كيفية الاختبار

### 1. تأكد من وجود بيانات:
```sql
-- تحقق من تعيينات المدربين
SELECT * FROM Internship_Trainers WHERE trainer_id = ?;

-- تحقق من التدريبات
SELECT i.title, c.name as company
FROM Internships i
JOIN Internship_Trainers it ON i.id = it.internship_id
JOIN Company c ON i.company_id = c.id
WHERE it.trainer_id = ?;
```

### 2. اختبار من المتصفح:
```
1. سجل دخول كمدرب
2. اضغط على "My Internships" في الـ sidebar
3. يجب أن تظهر قائمة التدريبات
```

### 3. اختبار API مباشرة:
```bash
curl http://localhost:5050/api/internships/trainer/1
```

## 📝 ملاحظات

- ✅ يعرض فقط التدريبات المعينة للمدرب
- ✅ يعرض إحصائيات حية (applicants, accepted)
- ✅ يدعم عرض لوجو الشركة
- ✅ يعرض حالة التدريب (open/closed)
- ✅ مرتب حسب تاريخ الإنشاء (الأحدث أولاً)

## 🔗 الملفات المعدلة

- ✅ `/backend/routes/internship.js` - API endpoint
- ✅ `/frontend/src/pages/TrainerDashboard.js` - UI
- ✅ `TRAINER_INTERNSHIPS_FEATURE.md` - توثيق

## 🎯 الخطوات التالية (اختياري)

يمكن إضافة:
1. تفاصيل أكثر عند الضغط على التدريب
2. فلترة حسب الحالة (open/closed)
3. بحث في التدريبات
4. عرض الطلاب المقبولين لكل تدريب
