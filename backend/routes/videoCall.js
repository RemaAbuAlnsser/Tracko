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

// Send meeting notification (for companies)
router.post('/notify', async (req, res) => {
  const { roomID, studentIds, senderName, senderType } = req.body;

  if (!roomID || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !senderName) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: roomID, studentIds, senderName'
    });
  }

  try {
    console.log(`📤 Sending meeting notifications from ${senderName} (${senderType})...`);
    
    // Create notifications for each selected student
    const notificationPromises = studentIds.map(async (studentId) => {
      // Get student's user_id from students table
      const getUserQuery = 'SELECT user_id, id FROM Students WHERE id = ?';
      
      return new Promise((resolve, reject) => {
        db.query(getUserQuery, [studentId], (err, results) => {
          if (err) {
            console.error(`Error getting user_id for student ${studentId}:`, err);
            reject(err);
            return;
          }

          if (results.length === 0) {
            console.log(`Student with id ${studentId} not found`);
            resolve(null);
            return;
          }

          const userId = results[0].user_id;
          const videoCallLink = `http://localhost:3000/video-call/${roomID}`;

          // Create notification
          const insertQuery = `
            INSERT INTO Notifications (user_id, title, message, type, created_at) 
            VALUES (?, ?, ?, ?, NOW())
          `;

          const title = senderType === 'company' ? 'Meeting Invitation' : 'Video Call Invitation';
          const message = `${senderName} has invited you to join a meeting. Click here to join: ${videoCallLink}`;

          db.query(insertQuery, [userId, title, message, 'general'], (err, result) => {
            if (err) {
              console.error(`Error creating notification for user ${userId}:`, err);
              reject(err);
              return;
            }

            console.log(`✅ Notification sent to user ${userId} (student ${studentId})`);
            console.log(`   Room ID: ${roomID}`);
            console.log(`   Video Link: ${videoCallLink}`);

            resolve(userId);
          });
        });
      });
    });

    await Promise.all(notificationPromises);

    res.json({
      success: true,
      message: `Meeting invitations sent to ${studentIds.length} student(s)`,
      roomID: roomID
    });

  } catch (error) {
    console.error('Error sending meeting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send meeting notifications',
      error: error.message
    });
  }
});

export default router;
