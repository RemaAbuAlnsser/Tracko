# Login Flow - كيف يعمل التوجيه

## 🔐 عملية تسجيل الدخول

### 1. المستخدم يدخل Email و Password
- يتم إرسال الطلب إلى: `POST /api/auth/login`

### 2. التحقق من نوع المستخدم
بعد نجاح تسجيل الدخول، يتم التحقق من `user_type`:

#### Student → `/student-dashboard`
- مباشرة إلى Student Dashboard

#### University → `/university-dashboard`
- مباشرة إلى University Dashboard

#### Trainer → `/trainer-dashboard`
- مباشرة إلى Trainer Dashboard (نوع جديد)

#### Company → يتم التحقق إذا كان Trainer
1. **طلب API**: `GET /api/trainers/user/:userId`
2. **إذا وُجد سجل في جدول Trainers**:
   - ✅ توجيه إلى: `/trainer-dashboard`
3. **إذا لم يُوجد سجل**:
   - ✅ توجيه إلى: `/company-dashboard`

## 📊 مثال على التدفق

### Trainer (مثل ahmad@asal.com):
```
1. Login → user_type: "company"
2. Check Trainers table → Found (user_id: 6)
3. Redirect → /trainer-dashboard ✅
```

### Company (بدون trainer record):
```
1. Login → user_type: "company"
2. Check Trainers table → Not Found
3. Redirect → /company-dashboard ✅
```

## 🧪 للاختبار

### Trainer Login:
```bash
Email: ahmad@asal.com
Password: password123
Expected: يفتح TrainerDashboard
```

### Company Login:
```bash
Email: asal570@asal.com
Password: (كلمة المرور)
Expected: يفتح CompanyDashboard
```

## 🔍 كيف يتم التحديد؟

الكود يتحقق من جدول `Trainers`:
```sql
SELECT * FROM Trainers WHERE user_id = ?
```

- **إذا وُجد سجل**: المستخدم = Trainer
- **إذا لم يُوجد**: المستخدم = Company عادي

## ⚙️ الكود في Login.js

```javascript
case 'company':
  // Check if user is a trainer
  const trainerResponse = await fetch(`http://localhost:5050/api/trainers/user/${data.user.id}`);
  if (trainerResponse.ok) {
    const trainerData = await trainerResponse.json();
    if (trainerData.success && trainerData.trainer) {
      navigate('/trainer-dashboard'); // Trainer
    } else {
      navigate('/company-dashboard'); // Company
    }
  }
  break;
```

## ✅ متى يتم إنشاء Trainer؟

### الطريقة الأولى: التسجيل كـ Company (القديمة)
عند التسجيل (Signup) بـ `user_type: "company"`:
1. يتم استخراج الدومين من الإيميل
2. البحث عن شركة بنفس الدومين
3. **إذا وُجدت**: يتم إنشاء سجل Trainer تلقائياً
4. **إذا لم تُوجد**: يتم إنشاء شركة جديدة فقط

### الطريقة الثانية: التسجيل كـ Trainer (الجديدة) ⭐
عند التسجيل (Signup) بـ `user_type: "trainer"`:
1. يتم استخراج الدومين من الإيميل (مثل: `noor@ghadeer.com` → `ghadeer.com`)
2. البحث عن شركة لها نفس الدومين في جدول Company
3. **إذا وُجدت الشركة**:
   - ✅ يتم إنشاء User بـ `user_type: "trainer"`
   - ✅ يتم إنشاء سجل في جدول Trainers مع `company_id` و `user_id`
   - ✅ يتم تسجيل الدخول تلقائياً والتوجيه إلى `/trainer-dashboard`
4. **إذا لم تُوجد الشركة**:
   - ❌ يظهر خطأ: "No company found with domain. Please contact your company administrator."

### مثال على التسجيل كـ Trainer:
```
Email: noor@ghadeer.com
Password: 123456
User Type: Trainer

→ البحث عن شركة بدومين: ghadeer.com
→ إذا وُجدت شركة Ghadeer_Company
→ إنشاء Trainer مرتبط بـ company_id
→ التوجيه إلى TrainerDashboard ✅
```

## 🎯 الخلاصة

- **Trainer (نوع مستقل)**: `user_type: "trainer"` → مباشرة إلى TrainerDashboard
- **Trainer (من Company)**: لديه سجل في جدول Trainers → TrainerDashboard
- **Company**: ليس لديه سجل في جدول Trainers → CompanyDashboard
- التحقق يتم تلقائياً عند تسجيل الدخول
