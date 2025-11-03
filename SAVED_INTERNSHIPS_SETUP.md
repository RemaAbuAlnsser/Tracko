# إعداد ميزة "Save for Later"

## الخطوة 1: إضافة عمود `saved` في قاعدة البيانات

يجب تشغيل الأمر التالي لإضافة عمود `saved` في جدول `Internship_Matches`:

```bash
cd backend
node scripts/addSavedColumnToMatches.js
```

**أو** يمكنك تشغيل الـ SQL مباشرة في MySQL:

```sql
ALTER TABLE Internship_Matches 
ADD COLUMN saved BOOLEAN DEFAULT FALSE;
```

## الخطوة 2: إعادة تشغيل Backend Server

```bash
cd backend
npm start
```

## الخطوة 3: التجربة

1. افتح StudentDashboard
2. اذهب إلى "Internships"
3. اضغط على "View Details" لأي internship
4. اضغط على "Save for Later"
5. اذهب إلى "Internship Details" في sidebar
6. ستجد الـ internship المحفوظ هناك

## كيف يعمل النظام؟

### Backend:
- **Route:** `POST /api/matching/student/:userId/save/:internshipId`
  - يحفظ internship في جدول `Internship_Matches`
  - يضع `saved = TRUE`

- **Route:** `GET /api/matching/student/:userId/saved`
  - يجلب جميع الـ internships حيث `saved = TRUE`
  - يعمل JOIN مع جداول `Internships` و `Company`

### Frontend:
- عند تحميل الصفحة، يتم جلب الـ saved internships من الـ API
- عند الضغط على "Save for Later"، يتم إرسال request للـ backend
- يتم عرض الـ saved internships في قسم "Internship Details"

## ملاحظات:
- الـ internships المحفوظة تبقى محفوظة حتى بعد تسجيل الخروج
- يتم تخزينها في قاعدة البيانات في جدول `Internship_Matches`
- العمود `saved` يحدد إذا كان الـ internship محفوظاً أم لا
