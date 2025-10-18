import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

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

// Mark notification as read
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

export default router;
