# حل مشاكل اختيار الصور في تطبيق Tracko المحمول

## المشكلة
عند الضغط على زر "Choose Image" في الملف الشخصي، يحدث خطأ أو لا يعمل الزر.

## الأسباب المحتملة والحلول

### 1. مشاكل الصلاحيات (Permissions)

#### iOS
```xml
<!-- في ملف ios/YourApp/Info.plist -->
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to photo library to select profile pictures</string>
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera to take profile pictures</string>
```

#### Android
```xml
<!-- في ملف android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CAMERA" />
```

### 2. تثبيت المكتبة بشكل صحيح

```bash
# تأكد من تثبيت المكتبة
npm install react-native-image-picker

# لـ React Native 0.60+
cd ios && pod install
```

### 3. إعداد المكتبة لـ Android

في ملف `android/app/build.gradle`:
```gradle
android {
    compileSdkVersion 31
    
    defaultConfig {
        targetSdkVersion 31
    }
}
```

### 4. إعداد المكتبة لـ iOS

تأكد من أن `ios/Podfile` يحتوي على:
```ruby
platform :ios, '10.0'
```

## التحسينات المطبقة في الكود

### 1. معالجة شاملة للأخطاء
```typescript
// إضافة try-catch للحماية من الأخطاء
const selectImage = () => {
  try {
    // كود اختيار الصورة
  } catch (error) {
    console.error('💥 Error in selectImage function:', error);
    Alert.alert('Error', 'Failed to open image picker. Please try again.');
  }
};
```

### 2. تسجيل مفصل للتشخيص
```typescript
launchImageLibrary(options, (response: ImagePickerResponse) => {
  console.log('📷 Image picker response:', response);
  
  if (response.errorCode) {
    console.log('❌ ImagePicker Error Code:', response.errorCode);
  }
  
  if (response.errorMessage) {
    console.log('❌ ImagePicker Error Message:', response.errorMessage);
  }
});
```

### 3. رسائل خطأ واضحة
```typescript
Alert.alert('Error', `Image picker error: ${response.errorCode}\n\nThis might be due to missing permissions. Please check your device settings.`);
```

### 4. زر معلومات بديل
إضافة زر "Upload Info" يوضح للمستخدم حالة الميزة والمشاكل المحتملة.

## خطوات استكشاف الأخطاء

### 1. تحقق من سجلات وحدة التحكم
```bash
# لـ iOS
npx react-native log-ios

# لـ Android  
npx react-native log-android
```

### 2. تحقق من الصلاحيات في الجهاز
- **iOS**: الإعدادات > الخصوصية > الصور > [اسم التطبيق]
- **Android**: الإعدادات > التطبيقات > [اسم التطبيق] > الصلاحيات

### 3. أعد تشغيل التطبيق
```bash
# أعد بناء التطبيق
npx react-native run-ios
# أو
npx react-native run-android
```

### 4. امسح الكاش
```bash
# امسح كاش Metro
npx react-native start --reset-cache

# لـ iOS
cd ios && rm -rf build && cd ..

# لـ Android
cd android && ./gradlew clean && cd ..
```

## رسائل الخطأ الشائعة وحلولها

### "User did not grant library permission"
**الحل**: امنح التطبيق صلاحية الوصول إلى مكتبة الصور في إعدادات الجهاز.

### "Camera permission not granted"
**الحل**: امنح التطبيق صلاحية الوصول إلى الكاميرا في إعدادات الجهاز.

### "Module not found: react-native-image-picker"
**الحل**: 
```bash
npm install react-native-image-picker
cd ios && pod install  # لـ iOS فقط
```

### "Cannot read property 'launchImageLibrary'"
**الحل**: تأكد من صحة import:
```typescript
import { launchImageLibrary } from 'react-native-image-picker';
```

## الميزات المستقبلية

### قيد التطوير
- ✅ اختيار الصور من المكتبة
- ⏳ التقاط صور بالكاميرا
- ⏳ رفع الصور إلى الخادم
- ⏳ عرض الصور المحفوظة
- ⏳ تحرير وقص الصور

### مخطط لها
- 📱 ضغط الصور تلقائياً
- 🔄 رفع متعدد الصور
- 🎨 فلاتر وتأثيرات
- 💾 حفظ محلي للصور

## نصائح للمطورين

### 1. اختبار على أجهزة حقيقية
مكتبة اختيار الصور قد لا تعمل بشكل صحيح على المحاكيات.

### 2. تحديث المكتبات
```bash
npm update react-native-image-picker
```

### 3. مراجعة التوثيق
راجع [توثيق react-native-image-picker](https://github.com/react-native-image-picker/react-native-image-picker) للتحديثات.

### 4. اختبار الصلاحيات
```typescript
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const checkPhotoPermission = async () => {
  const result = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
  if (result !== RESULTS.GRANTED) {
    await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
  }
};
```

## الدعم التقني

إذا استمرت المشاكل:
1. تحقق من سجلات وحدة التحكم للأخطاء التفصيلية
2. تأكد من تحديث React Native إلى أحدث إصدار مستقر
3. جرب على جهاز حقيقي بدلاً من المحاكي
4. راجع issues في مستودع المكتبة على GitHub
