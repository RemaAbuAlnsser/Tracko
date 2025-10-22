# تحديث أعمدة Internships

## التاريخ
21 أكتوبر 2025

## المشكلة
عند تشغيل الـ backend، ظهرت أخطاء:
```
ER_BAD_FIELD_ERROR: Unknown column 'i.min_gpa' in 'field list'
ER_BAD_FIELD_ERROR: Unknown column 'i.work_mode' in 'field list'
```

السبب: الكود يحاول قراءة أعمدة `min_gpa` و `work_mode` من جدول `Internships` لكنها غير موجودة.

## الحل
تم إضافة العمودين المفقودين إلى جدول `Internships`.

---

## الأعمدة المضافة

### 1. `min_gpa`
- **النوع**: `DECIMAL(3,2)`
- **القيمة الافتراضية**: `NULL`
- **الوصف**: الحد الأدنى للمعدل التراكمي (GPA) المطلوب للتقديم على التدريب
- **أمثلة**:
  - `3.50` - يتطلب معدل 3.5 أو أعلى
  - `3.00` - يتطلب معدل 3.0 أو أعلى
  - `2.75` - يتطلب معدل 2.75 أو أعلى
  - `NULL` - لا يوجد متطلب معدل محدد

### 2. `work_mode`
- **النوع**: `ENUM('remote', 'on-site', 'hybrid')`
- **القيمة الافتراضية**: `NULL`
- **الوصف**: نمط العمل للتدريب
- **القيم الممكنة**:
  - `'remote'` - عمل عن بُعد بالكامل
  - `'on-site'` - عمل حضوري في مقر الشركة
  - `'hybrid'` - نظام مختلط (بعض الأيام حضوري وبعضها عن بُعد)
  - `NULL` - لم يتم تحديد نمط العمل

---

## بنية الجدول المحدثة

```sql
CREATE TABLE Internships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirements TEXT,
  specialization VARCHAR(100),
  capacity INT,
  status ENUM('open','closed','pending'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  min_gpa DECIMAL(3,2) DEFAULT NULL COMMENT 'Minimum GPA requirement (e.g., 3.50)',
  work_mode ENUM('remote', 'on-site', 'hybrid') DEFAULT NULL COMMENT 'Work mode for the internship',
  FOREIGN KEY (company_id) REFERENCES Company(id) ON DELETE CASCADE,
  INDEX idx_company_id (company_id),
  INDEX idx_status (status),
  INDEX idx_specialization (specialization)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## الملفات المتعلقة

### Migration File
- **الملف**: `backend/migrations/004_add_internship_columns.sql`
- **المحتوى**:
```sql
-- Add min_gpa and work_mode columns to Internships table
ALTER TABLE Internships
ADD COLUMN min_gpa DECIMAL(3,2) DEFAULT NULL COMMENT 'Minimum GPA requirement (e.g., 3.50)',
ADD COLUMN work_mode ENUM('remote', 'on-site', 'hybrid') DEFAULT NULL COMMENT 'Work mode for the internship';
```

### Scripts
1. **`backend/scripts/addInternshipColumns.js`**
   - تشغيل الـ migration وإضافة الأعمدة

2. **`backend/scripts/checkInternshipsTable.js`**
   - التحقق من بنية جدول Internships

---

## كيفية الاستخدام

### تشغيل Migration
```bash
cd backend
node scripts/addInternshipColumns.js
```

### التحقق من الأعمدة
```bash
node scripts/checkInternshipsTable.js
```

---

## استخدام الأعمدة في الكود

### مثال 1: إنشاء تدريب جديد مع المتطلبات

```javascript
// في CompanyDashboard أو API endpoint
const createInternship = async (internshipData) => {
  const query = `
    INSERT INTO Internships 
    (company_id, title, description, requirements, specialization, capacity, min_gpa, work_mode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  await db.query(query, [
    internshipData.company_id,
    internshipData.title,
    internshipData.description,
    internshipData.requirements,
    internshipData.specialization,
    internshipData.capacity,
    internshipData.min_gpa,      // e.g., 3.50
    internshipData.work_mode     // e.g., 'hybrid'
  ]);
};
```

### مثال 2: التحقق من أهلية الطالب

```javascript
// في matching service
const checkEligibility = (studentGPA, internshipMinGPA) => {
  if (internshipMinGPA === null) {
    return { eligible: true, message: 'No GPA requirement' };
  }
  
  if (studentGPA >= internshipMinGPA) {
    return { 
      eligible: true, 
      message: `Your GPA (${studentGPA}) meets the requirement (${internshipMinGPA})` 
    };
  }
  
  return { 
    eligible: false, 
    message: `Your GPA (${studentGPA}) is below the requirement (${internshipMinGPA})` 
  };
};
```

### مثال 3: عرض معلومات التدريب في Frontend

```javascript
// في InternshipDetails component
const InternshipRequirements = ({ internship }) => {
  return (
    <div className="requirements-section">
      <h3>Requirements</h3>
      
      {internship.min_gpa && (
        <div className="requirement-item">
          <span className="icon">📊</span>
          <span>Minimum GPA: {internship.min_gpa}</span>
        </div>
      )}
      
      {internship.work_mode && (
        <div className="requirement-item">
          <span className="icon">
            {internship.work_mode === 'remote' ? '🏠' : 
             internship.work_mode === 'on-site' ? '🏢' : '🔄'}
          </span>
          <span>Work Mode: {internship.work_mode}</span>
        </div>
      )}
    </div>
  );
};
```

### مثال 4: تصفية التدريبات حسب Work Mode

```javascript
// في StudentDashboard
const filterByWorkMode = (internships, preferredMode) => {
  if (!preferredMode) return internships;
  
  return internships.filter(internship => 
    internship.work_mode === preferredMode || 
    internship.work_mode === null  // Include internships without specified mode
  );
};
```

---

## التكامل مع Internship_Matches

الآن بعد إضافة هذه الأعمدة، يمكن للـ matching algorithm استخدامها لحساب:

1. **`gpa_match`** في `Internship_Matches`:
```javascript
const gpaMatch = internship.min_gpa === null || student.gpa >= internship.min_gpa;
```

2. **`work_mode_match`** في `Internship_Matches`:
```javascript
const workModeMatch = internship.work_mode === null || 
                      student.preferred_work_mode === internship.work_mode;
```

---

## الفوائد

1. **تطابق أفضل**: الطلاب يرون فقط التدريبات التي يستوفون متطلباتها
2. **شفافية**: متطلبات واضحة لكل تدريب
3. **توفير الوقت**: تجنب التقديم على تدريبات غير مناسبة
4. **مرونة**: الشركات يمكنها تحديد أو عدم تحديد هذه المتطلبات

---

## ملاحظات مهمة

- ✅ الأعمدة nullable للسماح بالتوافق مع البيانات الموجودة
- ✅ استخدام DECIMAL(3,2) للـ GPA يسمح بقيم مثل 3.50, 2.75, إلخ
- ✅ ENUM للـ work_mode يضمن قيم صحيحة فقط
- ⚠️ يجب تحديث واجهة CompanyDashboard لإضافة هذه الحقول عند إنشاء تدريب
- ⚠️ يجب تحديث الـ matching algorithm لاستخدام هذه القيم

---

## الخطوات التالية

### Backend
1. ✅ إضافة الأعمدة إلى جدول Internships
2. ⏳ تحديث API endpoints لقبول وإرجاع هذه القيم
3. ⏳ تحديث matching algorithm لحساب gpa_match و work_mode_match
4. ⏳ إضافة validation للقيم الجديدة

### Frontend
1. ⏳ تحديث CompanyDashboard لإضافة حقول min_gpa و work_mode
2. ⏳ تحديث InternshipDetails لعرض هذه المعلومات
3. ⏳ إضافة فلاتر في StudentDashboard حسب work_mode
4. ⏳ عرض رسائل توضيحية عن الأهلية

---

## الحالة
✅ **مكتمل** - تم إضافة الأعمدة بنجاح وحل مشكلة الأخطاء
