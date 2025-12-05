# 🔢 Applicants Counter Feature - CompanyDashboard

## نظرة عامة
تم إضافة عداد (counter) على زر "Applicants List" في الـ sidebar الخاص بـ CompanyDashboard يعرض عدد المتقدمين الجدد منذ آخر مرة شاهدت فيها الشركة قائمة المتقدمين.

## ✨ الميزات

### 1. **عداد المتقدمين الجدد**
- يظهر badge أحمر على زر "Applicants List"
- يعرض عدد المتقدمين الجدد منذ آخر زيارة
- يختفي العداد عندما يكون العدد = 0

### 2. **تتبع آخر مشاهدة**
- يتم حفظ وقت آخر مشاهدة في localStorage
- المفتاح: `company_{companyId}_lastViewedApplicants`
- القيمة: ISO timestamp

### 3. **إعادة تعيين العداد**
- عند الضغط على زر "Applicants List"
- يتم حفظ الوقت الحالي كآخر مشاهدة
- يتم إعادة تعيين العداد إلى 0

## 🔧 التعديلات المطبقة

### 1. في `CompanyDashboard.js`:

#### إضافة State:
```javascript
const [newApplicantsCount, setNewApplicantsCount] = useState(0);
const [lastViewedTime, setLastViewedTime] = useState(null);
```

#### دالة تحميل عدد المتقدمين عند الدخول:
```javascript
const loadNewApplicantsCount = async (userData) => {
  // جلب بيانات الشركة
  // جلب المتقدمين
  // حساب عدد المتقدمين الجدد بناءً على lastViewedTime
  // تحديث العداد
};
```

#### دالة معالجة الضغط على الزر:
```javascript
const handleApplicantsMenuClick = async () => {
  setActiveMenu('applicants');
  // حفظ الوقت الحالي في localStorage
  localStorage.setItem(`company_${companyId}_lastViewedApplicants`, new Date().toISOString());
  setNewApplicantsCount(0); // إعادة تعيين العداد
};
```

#### تحديث دالة loadApplicants:
```javascript
// حساب عدد المتقدمين الجدد
const storedTime = localStorage.getItem(`company_${companyId}_lastViewedApplicants`);
if (storedTime) {
  const lastViewed = new Date(storedTime);
  const newCount = applicantsData.data.filter(app => {
    const appliedDate = new Date(app.applied_at);
    return appliedDate > lastViewed;
  }).length;
  setNewApplicantsCount(newCount);
}
```

#### تحديث زر Applicants List:
```javascript
<button 
  className={`nav-item ${activeMenu === 'applicants' ? 'active' : ''}`}
  onClick={handleApplicantsMenuClick}
>
  <svg>...</svg>
  Applicants List
  {newApplicantsCount > 0 && (
    <span className="notification-badge">
      {newApplicantsCount}
    </span>
  )}
</button>
```

### 2. في `CompanyDashboard.css`:

```css
.nav-item {
  position: relative; /* لوضع الـ badge */
}

.notification-badge {
  position: absolute;
  top: 8px;
  right: 12px;
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.nav-item.active .notification-badge {
  background: #dc2626;
}
```

## 🎯 كيف يعمل النظام

### 1. **عند دخول الشركة:**
```
1. تحميل بيانات الشركة
   ↓
2. جلب جميع المتقدمين من API
   ↓
3. قراءة آخر وقت مشاهدة من localStorage
   ↓
4. مقارنة تاريخ التقديم (applied_at) مع آخر مشاهدة
   ↓
5. حساب عدد المتقدمين الجدد
   ↓
6. عرض العداد على الزر
```

### 2. **عند الضغط على "Applicants List":**
```
1. تغيير activeMenu إلى 'applicants'
   ↓
2. حفظ الوقت الحالي في localStorage
   ↓
3. إعادة تعيين العداد إلى 0
   ↓
4. إخفاء الـ badge
```

### 3. **عند تقديم طالب جديد:**
```
1. الطالب يقدم على تدريب
   ↓
2. يتم حفظ applied_at في قاعدة البيانات
   ↓
3. عند تحديث الصفحة أو إعادة تحميل المتقدمين
   ↓
4. يتم حساب العدد الجديد تلقائياً
   ↓
5. يظهر العداد المحدث
```

## 📊 مثال على البيانات

### localStorage:
```javascript
{
  "company_1_lastViewedApplicants": "2025-10-22T13:30:00.000Z"
}
```

### حساب المتقدمين الجدد:
```javascript
// آخر مشاهدة: 2025-10-22 13:30
// المتقدمون:
[
  { id: 1, applied_at: "2025-10-22 12:00" }, // قبل آخر مشاهدة - لا يُحسب
  { id: 2, applied_at: "2025-10-22 14:00" }, // بعد آخر مشاهدة - يُحسب ✓
  { id: 3, applied_at: "2025-10-22 15:30" }, // بعد آخر مشاهدة - يُحسب ✓
]
// النتيجة: 2 متقدمين جدد
```

## 🎨 التصميم

### الـ Badge:
- **اللون**: أحمر (#ef4444)
- **الموقع**: أعلى يمين الزر
- **الحجم**: 11px
- **الشكل**: دائري (border-radius: 12px)
- **الظل**: box-shadow خفيف

### عند تفعيل الزر:
- اللون يتغير إلى أحمر داكن (#dc2626)

## 🧪 كيفية الاختبار

### 1. تسجيل دخول كشركة:
```
1. افتح http://localhost:3000
2. سجل دخول كشركة
3. انتظر تحميل الـ dashboard
4. تحقق من ظهور العداد على "Applicants List"
```

### 2. اختبار العداد:
```
1. لاحظ العدد الحالي (مثلاً: 3)
2. اضغط على "Applicants List"
3. يجب أن يختفي العداد
4. ارجع إلى Dashboard
5. العداد يجب أن يكون 0
```

### 3. اختبار متقدم جديد:
```
1. سجل دخول كطالب في نافذة أخرى
2. قدم على تدريب
3. ارجع لحساب الشركة
4. حدث الصفحة (F5)
5. يجب أن يزيد العداد بمقدار 1
```

## 🔍 Console Logs

عند تشغيل الميزة، ستظهر logs مثل:
```
🔔 3 new applicants since last view
🆕 2 new applicants since last view
✅ Marked applicants as viewed
```

## ⚙️ الإعدادات

### تخصيص اللون:
```css
.notification-badge {
  background: #your-color; /* غير اللون هنا */
}
```

### تخصيص الموقع:
```css
.notification-badge {
  top: 8px;    /* المسافة من الأعلى */
  right: 12px; /* المسافة من اليمين */
}
```

## 🐛 Troubleshooting

### إذا لم يظهر العداد:
1. تحقق من Console للأخطاء
2. تحقق من localStorage
3. تحقق من أن applied_at موجود في البيانات

### إذا لم يتم إعادة تعيين العداد:
1. تحقق من استدعاء handleApplicantsMenuClick
2. تحقق من localStorage بعد الضغط
3. تحقق من Console logs

## 📝 ملاحظات

- ✅ العداد يعمل لكل شركة بشكل منفصل
- ✅ البيانات محفوظة في localStorage
- ✅ لا يحتاج إلى backend API إضافي
- ✅ يعمل حتى بعد إغلاق المتصفح
- ✅ تلقائي بالكامل
