# دليل واجهات TrainerDashboard الجديدة

## الواجهات المضافة

تم إضافة 5 واجهات جديدة لـ TrainerDashboard:

### 1. 📚 My Students (الطلاب)
**الوصف**: عرض جميع الطلاب الذين يشرف عليهم المدرب

**المميزات**:
- عرض قائمة بجميع الطلاب المخصصين للمدرب
- معلومات الطالب: الاسم، البريد الإلكتروني، الجامعة، التخصص، الحالة
- زر "Create Report" للانتقال مباشرة لإنشاء تقرير للطالب
- حالة فارغة عندما لا يوجد طلاب

**API المطلوب**:
```
GET /api/trainers/:trainerId/students
Response: {
  success: true,
  students: [
    {
      id: 1,
      full_name: "Student Name",
      email: "student@example.com",
      university_name: "University Name",
      major: "Computer Science",
      status: "active"
    }
  ]
}
```

---

### 2. 📊 Reports (التقارير)
**الوصف**: إنشاء وإدارة تقارير أداء الطلاب

**المميزات**:
- **إنشاء تقرير جديد**:
  - اختيار الطالب من قائمة منسدلة
  - نوع التقرير: أسبوعي / شهري / نهائي
  - تأكيد الحضور (checkbox)
  - تقييم الأداء (1-10):
    - المهارات التقنية (Technical Skills)
    - مهارات التواصل (Communication Skills)
    - حل المشكلات (Problem Solving)
    - العمل الجماعي (Teamwork)
  - تقييم الأداء العام (Overall Performance Rating)
  - التعليقات والملاحظات (Comments & Feedback)

- **عرض التقارير السابقة**:
  - جدول بجميع التقارير المقدمة
  - معلومات: اسم الطالب، نوع التقرير، التقييم، الحضور، التاريخ
  - زر "View Details" لعرض تفاصيل التقرير

**API المطلوب**:
```javascript
// Create Report
POST /api/trainers/reports
Body: {
  trainer_id: 1,
  student_id: 5,
  report_type: "weekly",
  performance_rating: 8,
  attendance: true,
  technical_skills: 9,
  communication_skills: 7,
  problem_solving: 8,
  teamwork: 9,
  comments: "Excellent progress this week..."
}
Response: { success: true, message: "Report submitted successfully" }

// Get Reports
GET /api/trainers/:trainerId/reports
Response: {
  success: true,
  reports: [
    {
      id: 1,
      student_name: "Student Name",
      report_type: "weekly",
      performance_rating: 8,
      attendance: true,
      created_at: "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### 3. 📅 Schedule (الجدول الزمني)
**الوصف**: إدارة مواعيد التدريب والاجتماعات

**المميزات**:
- **إضافة حدث جديد**:
  - عنوان الحدث
  - نوع الحدث: جلسة تدريب / اجتماع / ورشة عمل / مراجعة أداء
  - وقت البداية والنهاية (datetime-local)
  - اختيار طالب محدد أو جميع الطلاب
  - وصف الحدث

- **عرض الأحداث القادمة**:
  - جدول بجميع الأحداث المجدولة
  - معلومات: العنوان، النوع، الطالب، وقت البداية، وقت النهاية
  - زر "Edit" لتعديل الحدث

**API المطلوب**:
```javascript
// Create Schedule
POST /api/trainers/schedules
Body: {
  trainer_id: 1,
  title: "Weekly Training Session",
  description: "Review progress and set goals",
  event_type: "training",
  start_time: "2025-01-20T10:00:00",
  end_time: "2025-01-20T12:00:00",
  student_id: 5 // optional
}
Response: { success: true, message: "Schedule added successfully" }

// Get Schedules
GET /api/trainers/:trainerId/schedules
Response: {
  success: true,
  schedules: [
    {
      id: 1,
      title: "Weekly Training Session",
      event_type: "training",
      student_name: "Student Name", // or null for all students
      start_time: "2025-01-20T10:00:00Z",
      end_time: "2025-01-20T12:00:00Z"
    }
  ]
}
```

---

### 4. 🔔 Notifications (الإشعارات)
**الوصف**: عرض جميع الإشعارات الخاصة بالمدرب

**المميزات**:
- عرض جميع الإشعارات في جدول
- معلومات: العنوان، الرسالة، النوع، الحالة (مقروء/غير مقروء), التاريخ
- تمييز الإشعارات غير المقروءة بخلفية زرقاء فاتحة
- عداد الإشعارات غير المقروءة في زر التنقل
- حالة فارغة عندما لا توجد إشعارات

**API المطلوب**:
```
GET /api/notifications/user/:userId
Response: {
  success: true,
  notifications: [
    {
      id: 1,
      title: "New Student Assigned",
      message: "You have been assigned a new student: John Doe",
      type: "general",
      is_read: false,
      created_at: "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### 5. 💬 Messages / Chat (المحادثات)
**الوصف**: نظام محادثات فوري للتواصل مع الطلاب والزملاء

**المميزات**:
- **قائمة المحادثات**:
  - عرض جميع المحادثات في قائمة جانبية
  - صورة رمزية لكل محادثة
  - اسم المشارك في المحادثة
  - آخر رسالة مرسلة
  - عداد الرسائل غير المقروءة
  - تمييز المحادثة النشطة

- **منطقة الدردشة**:
  - عرض جميع الرسائل في المحادثة
  - تمييز الرسائل المرسلة والمستقبلة
  - عرض وقت إرسال كل رسالة
  - تصميم فقاعات الرسائل (message bubbles)
  - رسائل المدرب باللون الأزرق على اليمين
  - رسائل الطرف الآخر بخلفية بيضاء على اليسار

- **إرسال الرسائل**:
  - حقل إدخال نصي مع تصميم دائري
  - زر إرسال مع أيقونة
  - تعطيل زر الإرسال عند عدم وجود نص
  - إرسال عند الضغط على Enter

- **تصميم متجاوب**:
  - واجهة مقسمة: قائمة المحادثات + منطقة الدردشة
  - تصميم responsive للشاشات الصغيرة

**API المطلوب**:
```javascript
// Get User Conversations
GET /api/messages/conversations/:userId
Response: {
  success: true,
  conversations: [
    {
      id: 1,
      participant_id: 5,
      participant_name: "Student Name",
      last_message: "Thank you for the feedback!",
      unread_count: 2,
      updated_at: "2025-01-15T10:00:00Z"
    }
  ]
}

// Get Conversation Messages
GET /api/messages/conversation/:conversationId
Response: {
  success: true,
  messages: [
    {
      id: 1,
      sender_id: 3,
      message: "Hello, how are you?",
      created_at: "2025-01-15T10:00:00Z"
    }
  ]
}

// Send Message
POST /api/messages/send
Body: {
  sender_id: 3,
  conversation_id: 1,
  message: "I'm doing great, thanks!"
}
Response: { success: true, message: "Message sent successfully" }
```

---

## بنية قاعدة البيانات المطلوبة

### جدول Trainer_Reports
```sql
CREATE TABLE Trainer_Reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trainer_id INT NOT NULL,
  student_id INT NOT NULL,
  report_type ENUM('weekly', 'monthly', 'final') NOT NULL,
  performance_rating INT CHECK (performance_rating BETWEEN 1 AND 10),
  attendance BOOLEAN DEFAULT TRUE,
  technical_skills INT CHECK (technical_skills BETWEEN 1 AND 10),
  communication_skills INT CHECK (communication_skills BETWEEN 1 AND 10),
  problem_solving INT CHECK (problem_solving BETWEEN 1 AND 10),
  teamwork INT CHECK (teamwork BETWEEN 1 AND 10),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
  INDEX idx_trainer_id (trainer_id),
  INDEX idx_student_id (student_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### جدول Trainer_Schedules
```sql
CREATE TABLE Trainer_Schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trainer_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type ENUM('training', 'meeting', 'workshop', 'review') NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  student_id INT, -- NULL means all students
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE SET NULL,
  INDEX idx_trainer_id (trainer_id),
  INDEX idx_start_time (start_time),
  INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### جدول Trainer_Students (علاقة المدرب بالطلاب)
```sql
CREATE TABLE Trainer_Students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trainer_id INT NOT NULL,
  student_id INT NOT NULL,
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'completed', 'inactive') DEFAULT 'active',
  FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_trainer_student (trainer_id, student_id),
  INDEX idx_trainer_id (trainer_id),
  INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### جدول Conversations
```sql
CREATE TABLE Conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  participant1_id INT NOT NULL,
  participant2_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (participant1_id) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (participant2_id) REFERENCES Users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_conversation (participant1_id, participant2_id),
  INDEX idx_participant1 (participant1_id),
  INDEX idx_participant2 (participant2_id),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### جدول Messages
```sql
CREATE TABLE Messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES Conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## الملفات المعدلة

### Frontend
- ✅ `frontend/src/pages/TrainerDashboard.js` (1355 سطر) - تم إضافة:
  - State للواجهات الجديدة (students, notifications, reports, schedules, messages, conversations)
  - دوال لجلب البيانات:
    - `loadStudents()` - جلب الطلاب
    - `loadNotifications()` - جلب الإشعارات
    - `loadReports()` - جلب التقارير
    - `loadSchedules()` - جلب الجدول الزمني
    - `loadConversations()` - جلب المحادثات
    - `loadMessages(conversationId)` - جلب رسائل محادثة معينة
  - دوال لإضافة البيانات:
    - `handleSubmitReport()` - إرسال تقرير جديد
    - `handleAddSchedule()` - إضافة حدث جديد
    - `handleSendMessage()` - إرسال رسالة
  - 6 أزرار تنقل في الـ sidebar
  - 5 واجهات كاملة: Students, Reports, Schedule, Notifications, Messages

- ✅ `frontend/src/styles/TrainerDashboard.css` (929 سطر) - تم إضافة:
  - أنماط notification-badge
  - أنماط form-row للنماذج
  - أنماط table-section و data-table
  - أنماط badges (7 أنواع)
  - أنماط btn-view
  - أنماط empty-state
  - **أنماط Chat/Messages**:
    - chat-container (grid layout)
    - conversations-sidebar
    - conversation-item مع حالة active
    - conversation-avatar
    - messages-list
    - message-item (sent/received)
    - message-bubble مع تصميم مختلف للمرسل والمستقبل
    - message-input-form
    - send-button
  - responsive design شامل

---

## الخطوات التالية (Backend)

### 1. إنشاء الجداول
```bash
cd backend
node scripts/createTrainerReportsTable.js
node scripts/createTrainerSchedulesTable.js
node scripts/createTrainerStudentsTable.js
node scripts/createConversationsTable.js
node scripts/createMessagesTable.js
```

### 2. إنشاء Routes
يجب إنشاء الـ endpoints التالية:

**في `backend/routes/trainers.js`:**
```javascript
// Get trainer's students
router.get('/:trainerId/students', async (req, res) => { ... });

// Create report
router.post('/reports', async (req, res) => { ... });

// Get trainer's reports
router.get('/:trainerId/reports', async (req, res) => { ... });

// Create schedule
router.post('/schedules', async (req, res) => { ... });

// Get trainer's schedules
router.get('/:trainerId/schedules', async (req, res) => { ... });
```

**في `backend/routes/messages.js` (ملف جديد):**
```javascript
// Get user conversations
router.get('/conversations/:userId', async (req, res) => { ... });

// Get conversation messages
router.get('/conversation/:conversationId', async (req, res) => { ... });

// Send message
router.post('/send', async (req, res) => { ... });

// Mark messages as read
router.put('/conversation/:conversationId/read', async (req, res) => { ... });
```

### 3. إنشاء Models (اختياري)
- `backend/models/TrainerReport.js`
- `backend/models/TrainerSchedule.js`
- `backend/models/Conversation.js`
- `backend/models/Message.js`

---

## الاختبار

### 1. اختبار Students
1. سجل دخول كـ Trainer
2. اضغط على "My Students"
3. يجب أن ترى قائمة بالطلاب (أو رسالة "No Students Yet")

### 2. اختبار Reports
1. اضغط على "Reports"
2. املأ نموذج التقرير
3. اضغط "Submit Report"
4. يجب أن يظهر التقرير في جدول "Previous Reports"

### 3. اختبار Schedule
1. اضغط على "Schedule"
2. املأ نموذج الحدث
3. اضغط "Add Event"
4. يجب أن يظهر الحدث في جدول "Upcoming Events"

### 4. اختبار Notifications
1. اضغط على "Notifications"
2. يجب أن ترى جميع الإشعارات
3. الإشعارات غير المقروءة يجب أن تكون بخلفية زرقاء
4. عداد الإشعارات يجب أن يظهر في زر التنقل

### 5. اختبار Messages
1. اضغط على "Messages"
2. يجب أن ترى قائمة المحادثات في الجانب الأيسر
3. اضغط على محادثة لعرض الرسائل
4. يجب أن تظهر جميع الرسائل:
   - رسائلك باللون الأزرق على اليمين
   - رسائل الطرف الآخر بخلفية بيضاء على اليسار
5. اكتب رسالة في حقل الإدخال
6. اضغط "Send" أو Enter
7. يجب أن تظهر الرسالة فوراً في قائمة الرسائل
8. تحقق من عداد الرسائل غير المقروءة في قائمة المحادثات

---

## ملاحظات

- ✅ جميع الواجهات responsive
- ✅ تصميم متناسق مع باقي الواجهات
- ✅ رسائل خطأ ونجاح واضحة
- ✅ حالات فارغة لجميع الجداول
- ✅ Validation للنماذج
- ⚠️ يحتاج Backend APIs للعمل بشكل كامل
