import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Send video call invitation to students
router.post('/invite', async (req, res) => {
  const { trainerId, trainerName, studentIds, roomId, videoCallLink } = req.body;

  if (!trainerId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !roomId || !videoCallLink) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: trainerId, studentIds, roomId, videoCallLink'
    });
  }

  try {
    // Create notifications for each selected student
    const notificationPromises = studentIds.map(async (studentId) => {
      // Get student's user_id from students table
      const [studentRows] = await db.query(
        'SELECT user_id FROM students WHERE id = ?',
        [studentId]
      );

      if (studentRows.length === 0) {
        console.log(`Student with id ${studentId} not found`);
        return null;
      }

      const userId = studentRows[0].user_id;

      // Create notification with video call link
      const notificationData = JSON.stringify({
        roomId: roomId,
        videoCallLink: videoCallLink,
        trainerId: trainerId,
        trainerName: trainerName
      });

      const [result] = await db.query(
        `INSERT INTO notifications (user_id, title, message, type, data, is_read, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          'Video Call Invitation',
          `${trainerName} has invited you to join a video call. Click the link to join.`,
          'video_call',
          notificationData,
          false
        ]
      );

      console.log(`✅ Notification sent to user ${userId} (student ${studentId})`);
      console.log(`   Room ID: ${roomId}`);
      console.log(`   Video Link: ${videoCallLink}`);

      return userId;
    });

    await Promise.all(notificationPromises);

    res.json({
      success: true,
      message: 'Video call invitations sent successfully',
      roomId: roomId,
      videoCallLink: videoCallLink
    });

  } catch (error) {
    console.error('Error sending video call invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send video call invitations',
      error: error.message
    });
  }
});

export default router;
