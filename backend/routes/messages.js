import express from 'express';
import db from '../config/database.js';

const router = express.Router();

console.log('📨 Messages routes loaded successfully');

// Get messages between two users
router.get('/between/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    
    console.log(`📨 Loading messages between users ${userId1} and ${userId2}`);
    
    // Return mock messages for now
    const mockMessages = [
      {
        id: 1,
        sender_id: parseInt(userId2),
        receiver_id: parseInt(userId1),
        message: 'Hello! How is your internship progress going?',
        created_at: '2024-11-20 10:00:00'
      },
      {
        id: 2,
        sender_id: parseInt(userId1),
        receiver_id: parseInt(userId2),
        message: 'Hi! It\'s going well, thank you for asking.',
        created_at: '2024-11-20 10:05:00'
      },
      {
        id: 3,
        sender_id: parseInt(userId2),
        receiver_id: parseInt(userId1),
        message: 'Great! Do you have any questions about your current tasks?',
        created_at: '2024-11-20 10:10:00'
      }
    ];
    
    console.log(`✅ Found ${mockMessages.length} mock messages`);
    
    res.json({
      success: true,
      messages: mockMessages
    });
    
  } catch (error) {
    console.error('❌ Error loading messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading messages',
      error: error.message
    });
  }
});

// Send a new message
router.post('/send', async (req, res) => {
  try {
    const { sender_id, receiver_id, message } = req.body;
    
    console.log(`📤 Sending message from ${sender_id} to ${receiver_id}: ${message}`);
    
    if (!sender_id || !receiver_id || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sender_id, receiver_id, message'
      });
    }
    
    // Insert message into database
    const query = `
      INSERT INTO messages (sender_id, receiver_id, message, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    
    try {
      const result = await db.execute(query, [sender_id, receiver_id, message]);
      console.log('Insert result:', result);
      
      // Create a simple response with the message data
      const messageData = {
        id: Date.now(), // Simple ID for now
        sender_id: sender_id,
        receiver_id: receiver_id,
        message: message,
        created_at: new Date().toISOString()
      };
      
      console.log(`✅ Message sent successfully`);
      
      res.json({
        success: true,
        message: 'Message sent successfully',
        data: messageData
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }
    
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
});

// Mark messages as read
router.put('/mark-read', async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.body;
    
    console.log(`📖 Marking messages as read from ${sender_id} to ${receiver_id}`);
    
    // Mock response for now
    res.json({
      success: true,
      message: 'Messages marked as read',
      affected_rows: 1
    });
    
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read',
      error: error.message
    });
  }
});

// Get unread message count
router.get('/unread/:userId/:fromUserId', async (req, res) => {
  try {
    const { userId, fromUserId } = req.params;
    
    // Return mock unread count for now
    const unreadCount = Math.floor(Math.random() * 3); // Random 0-2
    
    res.json({
      success: true,
      unread_count: unreadCount
    });
    
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
      error: error.message
    });
  }
});

export default router;
