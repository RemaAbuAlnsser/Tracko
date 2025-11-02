import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

// Get all notifications for a user (GET method)
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required" 
      });
    }
    
    const notifications = await Notification.getByUserId(userId);
    
    res.json({ 
      success: true,
      notifications 
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Get all notifications for logged-in user
router.post("/", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required" 
      });
    }
    
    const notifications = await Notification.getByUserId(userId);
    
    res.json({ 
      success: true,
      notifications 
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Get unread notifications count
router.post("/unread-count", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required" 
      });
    }
    
    const count = await Notification.getUnreadCount(userId);
    
    res.json({ 
      success: true,
      count 
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Get unread notifications only
router.post("/unread", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required" 
      });
    }
    
    const notifications = await Notification.getByUserId(userId, { is_read: false });
    
    res.json({ 
      success: true,
      notifications 
    });
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Create a new notification
router.post("/create", async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    
    if (!userId || !title || !message) {
      return res.status(400).json({ 
        success: false,
        message: "User ID, title, and message are required" 
      });
    }
    
    const result = await Notification.create({
      user_id: userId,
      title,
      message,
      type: type || 'general'
    });
    
    res.json({ 
      success: true,
      message: "Notification created successfully",
      notificationId: result.insertId
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Mark notification as read (PUT method with ID in URL)
router.put("/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    if (!notificationId) {
      return res.status(400).json({ 
        success: false,
        message: "Notification ID is required" 
      });
    }
    
    await Notification.markAsRead(notificationId);
    
    res.json({ 
      success: true,
      message: "Notification marked as read" 
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Mark notification as read (POST method - legacy)
router.post("/mark-read", async (req, res) => {
  try {
    const { notificationId } = req.body;
    
    if (!notificationId) {
      return res.status(400).json({ 
        success: false,
        message: "Notification ID is required" 
      });
    }
    
    await Notification.markAsRead(notificationId);
    
    res.json({ 
      success: true,
      message: "Notification marked as read" 
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Mark all notifications as read
router.post("/mark-all-read", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required" 
      });
    }
    
    await Notification.markAllAsRead(userId);
    
    res.json({ 
      success: true,
      message: "All notifications marked as read" 
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Delete a notification
router.post("/delete", async (req, res) => {
  try {
    const { notificationId } = req.body;
    
    if (!notificationId) {
      return res.status(400).json({ 
        success: false,
        message: "Notification ID is required" 
      });
    }
    
    await Notification.delete(notificationId);
    
    res.json({ 
      success: true,
      message: "Notification deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Delete all notifications for a user
router.post("/delete-all", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required" 
      });
    }
    
    await Notification.deleteAllByUserId(userId);
    
    res.json({ 
      success: true,
      message: "All notifications deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// Send video call invitations to selected students
router.post("/video-call-invite", async (req, res) => {
  try {
    const { trainer_id, trainer_name, student_ids, room_id, video_call_link } = req.body;
    
    if (!trainer_id || !trainer_name || !student_ids || !Array.isArray(student_ids) || student_ids.length === 0 || !room_id || !video_call_link) {
      return res.status(400).json({ 
        success: false,
        message: "Trainer ID, trainer name, student IDs array, room ID, and video call link are required" 
      });
    }

    // Get student user IDs from student IDs
    const studentQuery = `
      SELECT s.id as student_id, s.user_id, u.full_name 
      FROM Students s
      JOIN Users u ON s.user_id = u.id
      WHERE s.id IN (?)
    `;
    
    const db = (await import("../config/database.js")).default;
    
    db.query(studentQuery, [student_ids], async (err, students) => {
      if (err) {
        console.error("Error fetching students:", err);
        return res.status(500).json({ 
          success: false,
          message: "Error fetching student information" 
        });
      }

      if (students.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: "No students found" 
        });
      }

      // Create notifications for each student
      const notifications = students.map(student => ({
        user_id: student.user_id,
        title: `📹 Video Call Invitation from ${trainer_name}`,
        message: `${trainer_name} has invited you to join a video call. Click the link to join: ${video_call_link}`,
        type: 'video_call'
      }));

      try {
        await Notification.createBulk(notifications);
        
        console.log(`✅ Video call invitations sent to ${students.length} student(s)`);
        console.log(`   Room ID: ${room_id}`);
        console.log(`   Students:`, students.map(s => s.full_name).join(', '));
        
        res.json({ 
          success: true,
          message: `Video call invitations sent to ${students.length} student(s)`,
          room_id: room_id,
          invited_students: students.length
        });
      } catch (error) {
        console.error("Error creating notifications:", error);
        res.status(500).json({ 
          success: false,
          message: "Failed to send notifications" 
        });
      }
    });
  } catch (error) {
    console.error("Error sending video call invitations:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

export default router;
