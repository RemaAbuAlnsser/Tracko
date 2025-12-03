# CV Upload & Analysis Feature

ميزة CV Upload تستخدم `react-native-image-picker` الموجود مسبقاً في المشروع.

## كيفية الاستخدام:

### 1. إعادة بناء التطبيق

#### للـ Android:
```bash
cd /Users/user/Downloads/Tracko_Gp_noor/frontend_mobile
npm run android
```

#### للـ iOS:
```bash
npm run ios
```

### 2. اختيار الملف
- اضغط على "Choose File"
- اختر "From Gallery"
- اختر ملف CV (PDF أو صورة)

## ملاحظات:

- يتم استخدام `react-native-image-picker` لاختيار الملفات
- الحد الأقصى لحجم الملف: 5MB
- يتم رفع الملف إلى `/api/upload/cv`
- يتم تحليل الملف باستخدام AI على `http://localhost:5001/analyze-cv`
- النتائج تُحفظ في قاعدة البيانات عبر `/api/cvs`

## التكامل مع Backend:

تأكد من تشغيل:
1. Backend Server على Port 5050
2. AI Service على Port 5001

```bash
# في terminal منفصل
cd /Users/user/Downloads/Tracko_Gp_noor/backend
npm start

# في terminal آخر (إذا كان لديك AI service)
# python ai_service.py
```

## عملية الرفع والتحليل:

1. **Upload**: رفع الملف إلى السيرفر
2. **AI Analysis**: تحليل المحتوى باستخدام AI
3. **Save**: حفظ النتائج في قاعدة البيانات
4. **Display**: عرض النتائج في التطبيق
