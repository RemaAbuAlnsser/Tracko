# الخطوات النهائية لتفعيل ميزة Save/Unsave

## 1️⃣ إضافة عمود `saved` في قاعدة البيانات

**الطريقة الأولى - تشغيل الـ script:**
```bash
cd backend
node scripts/addSavedColumnToMatches.js
```

**الطريقة الثانية - SQL مباشرة:**
```sql
ALTER TABLE Internship_Matches ADD COLUMN saved BOOLEAN DEFAULT FALSE;
```

## 2️⃣ إعادة تشغيل Backend Server

```bash
cd backend
npm start
```

## 3️⃣ التجربة

### ✅ ما تم إضافته:

1. **زر Save/Unsave ديناميكي:**
   - إذا كان الـ internship محفوظاً: يظهر "Unsave" مع أيقونة ممتلئة وخلفية زرقاء
   - إذا لم يكن محفوظاً: يظهر "Save for Later" مع أيقونة فارغة وخلفية بيضاء

2. **قسم Saved Internships:**
   - في sidebar تحت "Internship Details"
   - يعرض جميع الـ internships المحفوظة
   - يبقى محفوظاً حتى بعد refresh أو تسجيل خروج

3. **Backend APIs:**
   - `POST /api/matching/student/:userId/save/:internshipId` - حفظ
   - `POST /api/matching/student/:userId/unsave/:internshipId` - إلغاء الحفظ
   - `GET /api/matching/student/:userId/saved` - جلب المحفوظات

### 🎯 كيفية الاستخدام:

1. اذهب إلى "Internships" في StudentDashboard
2. اضغط على "View Details" لأي internship
3. ستظهر نافذة منبثقة (modal) مع تفاصيل التدريب
4. في الأسفل:
   - إذا لم يكن محفوظاً: اضغط "Save for Later" → سيتم حفظه
   - إذا كان محفوظاً: اضغط "Unsave" → سيتم إلغاء الحفظ
5. اذهب إلى "Internship Details" في sidebar لرؤية جميع المحفوظات

### 📊 التخزين في قاعدة البيانات:

```
جدول: Internship_Matches
├── student_id (من الطالب المسجل)
├── internship_id (التدريب)
├── saved (TRUE/FALSE)
└── match_percentage (نسبة التطابق)
```

عند الحفظ:
- إذا كان الـ match موجود: يتم تحديث `saved = TRUE`
- إذا لم يكن موجود: يتم إنشاء match جديد مع `saved = TRUE` و `match_percentage = 0`

عند إلغاء الحفظ:
- يتم تحديث `saved = FALSE`
- لا يتم حذف الـ record (للحفاظ على match_percentage إذا كان موجوداً)
