# 🔔 Task Deadline Notifications System

## ✅ Features Implemented

### 1. **Time Remaining Display (Student View)**
- ✅ Shows days and hours remaining next to due date
- ✅ Example: `(2d 5h left)` or `(18h left)`
- ✅ **Red background** when ≤ 24 hours remaining
- ✅ Green text when > 24 hours
- ✅ Red text when overdue

### 2. **Automatic Notifications**
- ✅ Sends notification when task is due in ≤ 24 hours
- ✅ Runs every hour via cron job
- ✅ Saves to `notifications` table in database
- ✅ Prevents duplicate notifications (12-hour window)

### 3. **Notification Details**
- **Title:** `🔴 Urgent: Task Deadline in 1 Day!`
- **Message:** `⚠️ Your task "task name" for "plan name" is due in X days and Y hours. Please submit your work as soon as possible!`
- **Type:** `task_deadline`

---

## 🎨 Visual Design

### Timeline View (Normal - More than 1 day):
```
○ task1
  🕐 Due: Nov 5, 2025, 10:00 AM (2d 5h left) ← Green
  Week 1
```

### Timeline View (Urgent - Less than 1 day):
```
○ task1
  ┌──────────────────────────────────────────┐
  │ 🕐 Due: Nov 1, 2025, 10:00 AM (18h left) │ ← Red background
  └──────────────────────────────────────────┘
  Week 1
```

### Timeline View (Overdue):
```
○ task1
  🕐 Due: Oct 28, 2025, 10:00 AM (Overdue) ← Red
  Week 1
```

---

## 🔔 Notification System

### When Notification is Sent:
- ⏰ **Trigger:** Task due date is within 24 hours
- 🔄 **Frequency:** Checked every hour
- 🚫 **Duplicate Prevention:** Won't send again for 12 hours
- ✅ **Condition:** Task not yet submitted or approved

### Notification Example:
```json
{
  "user_id": 22,
  "title": "🔴 Urgent: Task Deadline in 1 Day!",
  "message": "⚠️ Your task \"Complete UI Design\" for \"UX/UI Training Plan\" is due in 18 hours. Please submit your work as soon as possible!",
  "type": "task_deadline",
  "is_read": false,
  "created_at": "2025-10-31 18:30:00"
}
```

---

## 📊 Database

### Notifications Table:
```sql
SELECT * FROM notifications 
WHERE type = 'task_deadline' 
ORDER BY created_at DESC;
```

**Result:**
```
+----+---------+----------------------------------+----------+----------+---------------------+
| id | user_id | title                            | type     | is_read  | created_at          |
+----+---------+----------------------------------+----------+----------+---------------------+
| 45 | 22      | 🔴 Urgent: Task Deadline in 1... | task_... | 0        | 2025-10-31 18:00:00 |
| 44 | 23      | 🔴 Urgent: Task Deadline in 1... | task_... | 0        | 2025-10-31 17:00:00 |
+----+---------+----------------------------------+----------+----------+---------------------+
```

---

## 🧪 Testing

### Test 1: Create Task with Due Date Tomorrow
1. Login as Trainer
2. Create/Edit plan
3. Set due date to tomorrow (e.g., Nov 1, 2025 10:00 AM)
4. Save plan
5. Wait for cron job (runs every hour)
6. Check backend console:
   ```
   🔔 Checking for upcoming task deadlines...
   📋 Found 1 upcoming deadlines
   📤 Notification queued for Ahed: 18 hours remaining
   ✅ Sent 1 deadline notifications
   ```
7. Check database:
   ```sql
   SELECT * FROM notifications WHERE type = 'task_deadline' ORDER BY id DESC LIMIT 1;
   ```

### Test 2: View as Student
1. Login as Student
2. Go to Training Plans
3. See task with red background:
   ```
   🕐 Due: Nov 1, 2025, 10:00 AM (18h left)
   ```
4. Check notifications icon
5. See notification: `🔴 Urgent: Task Deadline in 1 Day!`

### Test 3: Manual Trigger (for testing)
```bash
# Call the API endpoint manually:
POST http://localhost:5050/api/task-deadlines/check-deadlines
```

---

## ⚙️ Cron Job Schedule

### Current Schedule:
- **Upcoming Deadlines:** Every 1 hour
- **Overdue Tasks:** Every 6 hours

### Configuration:
```javascript
// backend/cron/taskDeadlineCron.js
cron.schedule('0 * * * *', checkTaskDeadlines);  // Every hour at minute 0
```

---

## 🎯 Logic Flow

```
1. Cron job runs every hour
   ↓
2. Query Plan_Weeks for tasks due in ≤ 24 hours
   ↓
3. Filter out completed tasks
   ↓
4. Check if notification already sent (last 12 hours)
   ↓
5. Calculate time remaining (days + hours)
   ↓
6. Create notification with urgent message
   ↓
7. Save to notifications table
   ↓
8. Student sees notification in UI
```

---

## 📱 Student Experience

### Step 1: See Red Warning
Student opens Training Plans and sees:
- Red background on task
- Time remaining clearly displayed
- Urgent visual indicator

### Step 2: Receive Notification
Student clicks notifications icon and sees:
- 🔴 Red urgent icon
- Clear message about deadline
- Time remaining information

### Step 3: Take Action
Student clicks "View Details" and submits work before deadline.

---

## ✅ All Features Working

- [x] Time calculation (days + hours)
- [x] Red background when ≤ 24 hours
- [x] Automatic notifications
- [x] Save to notifications table
- [x] Prevent duplicate notifications
- [x] Cron job running every hour
- [x] Beautiful UI design
- [x] Clear urgent messaging

---

## 🚀 System Status

**Frontend:** ✅ Displays time remaining with red warning
**Backend:** ✅ Sends notifications automatically
**Database:** ✅ Saves all notifications
**Cron Jobs:** ✅ Running every hour

**Everything is 100% complete! 🎉**
