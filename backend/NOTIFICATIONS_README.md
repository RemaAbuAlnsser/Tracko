# Notifications System Documentation

## Database Table Structure

### Notifications Table
```sql
CREATE TABLE Notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('appointment', 'submission', 'meeting', 'general') NOT NULL DEFAULT 'general',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
```

## Setup Instructions

### 1. Create the Notifications Table
Run the following command to create the table:
```bash
cd backend
node scripts/createNotificationsTable.js
```

## API Endpoints

### User Endpoints (`/api/notifications`)

#### 1. Get All Notifications for User
- **Method**: POST
- **Endpoint**: `/api/notifications/`
- **Body**:
```json
{
  "userId": 1
}
```
- **Response**:
```json
{
  "success": true,
  "notifications": [...]
}
```

#### 2. Get Unread Count
- **Method**: POST
- **Endpoint**: `/api/notifications/unread-count`
- **Body**:
```json
{
  "userId": 1
}
```
- **Response**:
```json
{
  "success": true,
  "count": 5
}
```

#### 3. Get Unread Notifications Only
- **Method**: POST
- **Endpoint**: `/api/notifications/unread`
- **Body**:
```json
{
  "userId": 1
}
```

#### 4. Create Notification
- **Method**: POST
- **Endpoint**: `/api/notifications/create`
- **Body**:
```json
{
  "userId": 1,
  "title": "New Assignment",
  "message": "You have a new assignment due tomorrow",
  "type": "submission"
}
```

#### 5. Mark Notification as Read
- **Method**: POST
- **Endpoint**: `/api/notifications/mark-read`
- **Body**:
```json
{
  "notificationId": 1
}
```

#### 6. Mark All Notifications as Read
- **Method**: POST
- **Endpoint**: `/api/notifications/mark-all-read`
- **Body**:
```json
{
  "userId": 1
}
```

#### 7. Delete Notification
- **Method**: POST
- **Endpoint**: `/api/notifications/delete`
- **Body**:
```json
{
  "notificationId": 1
}
```

#### 8. Delete All Notifications
- **Method**: POST
- **Endpoint**: `/api/notifications/delete-all`
- **Body**:
```json
{
  "userId": 1
}
```

### Admin Endpoints (`/api/admin`)

#### Get All Notifications (Admin Only)
- **Method**: POST
- **Endpoint**: `/api/admin/notifications`
- **Body**:
```json
{
  "userId": 1
}
```
- **Response**:
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "user_id": 5,
      "full_name": "John Doe",
      "email": "john@example.com",
      "title": "Meeting Reminder",
      "message": "You have a meeting at 3 PM",
      "type": "meeting",
      "is_read": false,
      "created_at": "2025-01-18T10:00:00.000Z"
    }
  ]
}
```

## Notification Types

- **appointment**: موعد (Appointment reminders)
- **submission**: تسليم (Submission deadlines)
- **meeting**: اجتماع (Meeting notifications)
- **general**: عام (General notifications)

## Model Methods

### Notification Model Methods

1. **create(notificationData)** - Create a new notification
2. **getByUserId(userId, filters)** - Get notifications for a specific user
3. **findById(id)** - Get notification by ID
4. **markAsRead(id)** - Mark notification as read
5. **markAllAsRead(userId)** - Mark all user notifications as read
6. **delete(id)** - Delete a notification
7. **deleteAllByUserId(userId)** - Delete all notifications for a user
8. **getUnreadCount(userId)** - Get count of unread notifications
9. **getAll(filters)** - Get all notifications (admin)
10. **createBulk(notifications)** - Create multiple notifications at once

## Usage Examples

### Creating a Notification
```javascript
const notification = await Notification.create({
  user_id: 5,
  title: "New Internship Available",
  message: "A new internship opportunity matches your profile",
  type: "general"
});
```

### Getting Unread Notifications
```javascript
const unreadNotifications = await Notification.getByUserId(5, { 
  is_read: false 
});
```

### Bulk Create Notifications
```javascript
const notifications = [
  { user_id: 1, title: "Title 1", message: "Message 1", type: "general" },
  { user_id: 2, title: "Title 2", message: "Message 2", type: "meeting" }
];
await Notification.createBulk(notifications);
```

## Statistics

The admin dashboard now includes:
- **Total Notifications**: Total count of all notifications
- **Unread Notifications**: Count of unread notifications across all users

## Notes

- Notifications are automatically deleted when a user is deleted (CASCADE)
- Default notification type is 'general'
- Notifications are sorted by creation date (newest first)
- The system supports filtering by type and read status
