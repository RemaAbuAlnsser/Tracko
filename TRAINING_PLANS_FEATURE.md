# Training Plans Feature - ميزة خطط التدريب

## نظرة عامة
تم إضافة ميزة جديدة تسمح للـ Trainer بإنشاء وإدارة خطط تدريب مفصلة للتدريبات (Internships). يمكن للمدرب تحديد مدة التدريب، وإنشاء خطة أسبوعية مفصلة لكل أسبوع من التدريب.

## المميزات الرئيسية

### 1. إنشاء خطة تدريب جديدة
- اختيار التدريب المراد إنشاء خطة له
- تحديد عنوان ووصف الخطة
- تحديد مدة التدريب بالأسابيع
- تحديد تاريخ البداية والنهاية
- تحديد حالة الخطة (Draft, Active, Completed, Cancelled)

### 2. التخطيط الأسبوعي
لكل أسبوع في الخطة، يمكن للمدرب تحديد:
- **عنوان الأسبوع**: موضوع الأسبوع
- **الوصف**: ماذا سيتعلم الطلاب هذا الأسبوع
- **الأهداف التعليمية**: الأهداف الرئيسية للأسبوع
- **المهام**: المهام والأنشطة المطلوبة من الطلاب
- **الموارد**: روابط، مواد تعليمية، مصادر
- **المخرجات**: ما يجب على الطلاب تسليمه

### 3. عرض الخطط
- عرض جميع خطط التدريب الخاصة بالمدرب
- معلومات تفصيلية عن كل خطة
- عدد الأسابيع المخططة
- حالة الخطة
- التواريخ

### 4. عرض تفاصيل الخطة
- عند النقر على "View Details" يتم عرض:
  - معلومات الخطة الكاملة
  - التفاصيل الأسبوعية بشكل منظم
  - جميع الأهداف والمهام والموارد لكل أسبوع

## البنية التقنية

### Backend

#### 1. قاعدة البيانات
تم إنشاء جدولين جديدين:

**Internship_Plans**
```sql
- id: INT (Primary Key)
- internship_id: INT (Foreign Key -> Internships)
- trainer_id: INT (Foreign Key -> Trainers)
- title: VARCHAR(255)
- description: TEXT
- duration_weeks: INT
- start_date: DATE
- end_date: DATE
- status: ENUM('draft', 'active', 'completed', 'cancelled')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Plan_Weeks**
```sql
- id: INT (Primary Key)
- plan_id: INT (Foreign Key -> Internship_Plans)
- week_number: INT
- title: VARCHAR(255)
- description: TEXT
- objectives: TEXT
- tasks: TEXT
- resources: TEXT
- deliverables: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. Model
**File**: `/backend/models/InternshipPlan.js`

الدوال الرئيسية:
- `createTables()`: إنشاء الجداول تلقائياً
- `create()`: إنشاء خطة جديدة
- `findById()`: جلب خطة مع أسابيعها
- `findByTrainerId()`: جلب جميع خطط المدرب
- `findByInternshipId()`: جلب خطط تدريب معين
- `update()`: تحديث خطة
- `delete()`: حذف خطة
- `addWeek()`: إضافة أسبوع للخطة
- `updateWeek()`: تحديث أسبوع
- `deleteWeek()`: حذف أسبوع
- `getWeeks()`: جلب أسابيع خطة

#### 3. Routes
**File**: `/backend/routes/internshipPlan.js`

**API Endpoints**:
- `POST /api/plans` - إنشاء خطة جديدة
- `GET /api/plans/:id` - جلب خطة محددة مع أسابيعها
- `GET /api/plans/trainer/:trainerId` - جلب جميع خطط المدرب
- `GET /api/plans/internship/:internshipId` - جلب خطط تدريب معين
- `PUT /api/plans/:id` - تحديث خطة
- `DELETE /api/plans/:id` - حذف خطة
- `POST /api/plans/:planId/weeks` - إضافة أسبوع للخطة
- `PUT /api/plans/weeks/:weekId` - تحديث أسبوع
- `DELETE /api/plans/weeks/:weekId` - حذف أسبوع
- `GET /api/plans/:planId/weeks` - جلب أسابيع خطة

#### 4. Server Configuration
تم تحديث `/backend/server.js` لإضافة:
```javascript
import internshipPlanRoutes from "./routes/internshipPlan.js";
app.use("/api/plans", internshipPlanRoutes);
```

### Frontend

#### 1. Trainer Dashboard
**File**: `/frontend/src/pages/TrainerDashboard.js`

**State Variables الجديدة**:
```javascript
const [plans, setPlans] = useState([]);
const [selectedPlan, setSelectedPlan] = useState(null);
const [newPlan, setNewPlan] = useState({...});
const [planWeeks, setPlanWeeks] = useState([]);
```

**الدوال الجديدة**:
- `loadPlans()`: تحميل خطط المدرب
- `loadPlanDetails()`: تحميل تفاصيل خطة محددة
- `handleCreatePlan()`: إنشاء خطة جديدة
- `handleAddWeek()`: إضافة أسبوع للخطة
- `handleUpdateWeek()`: تحديث معلومات أسبوع
- `handleRemoveWeek()`: حذف أسبوع

#### 2. UI Components
تم إضافة قسم "Training Plans" في الـ Sidebar يحتوي على:
- نموذج إنشاء خطة جديدة
- قائمة بجميع الخطط الموجودة
- Modal لعرض تفاصيل الخطة

#### 3. Styling
**File**: `/frontend/src/styles/TrainerDashboard.css`

تم إضافة CSS للعناصر التالية:
- `.weeks-section`: قسم الأسابيع
- `.week-card`: بطاقة الأسبوع
- `.plans-grid`: شبكة عرض الخطط
- `.plan-card`: بطاقة الخطة
- `.modal-overlay`: خلفية الـ Modal
- `.modal-content`: محتوى الـ Modal
- `.week-detail-card`: بطاقة تفاصيل الأسبوع

## كيفية الاستخدام

### للمدرب (Trainer):

1. **الوصول للميزة**:
   - تسجيل الدخول كـ Trainer
   - الضغط على "Training Plans" في الـ Sidebar

2. **إنشاء خطة جديدة**:
   - اختيار التدريب من القائمة المنسدلة
   - إدخال عنوان الخطة ووصفها
   - تحديد مدة التدريب بالأسابيع
   - (اختياري) تحديد تاريخ البداية والنهاية
   - الضغط على "+ Add Week" لإضافة أسابيع
   - ملء تفاصيل كل أسبوع
   - الضغط على "Create Plan"

3. **عرض الخطط**:
   - جميع الخطط تظهر في قسم "My Training Plans"
   - كل خطة تعرض معلومات ملخصة

4. **عرض التفاصيل**:
   - الضغط على "View Details" لأي خطة
   - يفتح Modal يعرض جميع التفاصيل والأسابيع

### للطلاب (Students):
الخطط مرئية للطلاب المقبولين في التدريب (سيتم تطوير هذا الجزء لاحقاً)

## الملفات المضافة/المعدلة

### Backend:
- ✅ `/backend/models/InternshipPlan.js` (جديد)
- ✅ `/backend/routes/internshipPlan.js` (جديد)
- ✅ `/backend/server.js` (معدل)
- ✅ `/backend/scripts/createInternshipPlansTable.js` (جديد)
- ✅ `/backend/scripts/createPlanWeeksTable.js` (جديد)

### Frontend:
- ✅ `/frontend/src/pages/TrainerDashboard.js` (معدل)
- ✅ `/frontend/src/styles/TrainerDashboard.css` (معدل)

## التطويرات المستقبلية المقترحة

1. **للطلاب**:
   - إضافة صفحة لعرض خطة التدريب للطلاب المقبولين
   - تتبع التقدم الأسبوعي
   - رفع المخرجات (Deliverables)

2. **للمدرب**:
   - تعديل الخطط الموجودة
   - نسخ خطة لتدريب آخر
   - قوالب جاهزة للخطط
   - تصدير الخطة كـ PDF

3. **الإشعارات**:
   - إشعار للطلاب عند إنشاء خطة جديدة
   - تذكير أسبوعي بالمهام المطلوبة

4. **التقييم**:
   - ربط الخطة بنظام التقييم
   - تقييم المخرجات الأسبوعية

## الاختبار

### اختبار Backend:
```bash
# تشغيل السيرفر
cd backend
npm start

# اختبار API
# إنشاء خطة
POST http://localhost:5050/api/plans
Content-Type: application/json
{
  "internship_id": 1,
  "trainer_id": 1,
  "title": "Full Stack Development Plan",
  "description": "Complete training plan",
  "duration_weeks": 8,
  "weeks": [...]
}

# جلب خطط المدرب
GET http://localhost:5050/api/plans/trainer/1
```

### اختبار Frontend:
```bash
# تشغيل التطبيق
cd frontend
npm start

# الخطوات:
1. تسجيل الدخول كـ Trainer
2. الضغط على "Training Plans"
3. إنشاء خطة جديدة
4. عرض الخطط
5. عرض تفاصيل خطة
```

## ملاحظات مهمة

1. **الجداول تُنشأ تلقائياً**: عند تشغيل السيرفر، يتم إنشاء الجداول تلقائياً إذا لم تكن موجودة
2. **العلاقات**: الخطط مرتبطة بـ Internships و Trainers، وعند حذف أي منهما تُحذف الخطط المرتبطة (CASCADE)
3. **الأسابيع فريدة**: لا يمكن إضافة أسبوعين بنفس الرقم لنفس الخطة
4. **الحالات**: يمكن تغيير حالة الخطة بين Draft, Active, Completed, Cancelled

## الدعم والمساعدة

إذا واجهت أي مشاكل:
1. تأكد من تشغيل قاعدة البيانات
2. تأكد من تشغيل Backend Server على المنفذ 5050
3. تأكد من تشغيل Frontend على المنفذ 3000
4. راجع Console للأخطاء

---

تم التطوير بنجاح ✅
التاريخ: 2025
