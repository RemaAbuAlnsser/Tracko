# إعداد File Picker للـ CV Upload

## الخطوات المطلوبة:

### 1. إضافة Permissions في AndroidManifest.xml

افتح الملف:
```
android/app/src/main/AndroidManifest.xml
```

أضف هذه الأسطر بعد `<uses-permission android:name="android.permission.INTERNET" />`:

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

يجب أن يصبح الملف هكذا:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    
    <application
      android:name=".MainApplication"
      ...
    >
      ...
    </application>
</manifest>
```

### 2. إعادة بناء التطبيق

```bash
cd /Users/user/Downloads/Tracko_Gp_noor/frontend_mobile
npm run android
```

## كيفية الاستخدام:

1. افتح تاب "CV Upload"
2. اضغط على "Choose File"
3. سيفتح File Manager (مدير الملفات)
4. اختر ملف PDF, DOC, أو DOCX من أي مكان في الجهاز
5. سيظهر اسم الملف وحجمه
6. اضغط "Upload & Analyze"

## الفرق عن السابق:

**قبل:**
- يفتح الصور فقط (Gallery)
- لا يمكن اختيار ملفات PDF أو DOC

**الآن:**
- ✅ يفتح File Manager
- ✅ يمكن اختيار PDF, DOC, DOCX
- ✅ يمكن التصفح في جميع مجلدات الجهاز
- ✅ يعرض اسم الملف الحقيقي

## المكتبات المستخدمة:

- `react-native-document-picker@^8.0.0` - لاختيار الملفات
- `rn-fetch-blob` - للتعامل مع الملفات

## ملاحظات:

- يدعم Android 5.0 وما فوق
- يطلب إذن الوصول للملفات تلقائياً
- الملفات يتم نسخها إلى cache directory مؤقتاً
