import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

// Send video call invitation
router.post('/invite', async (req, res) => {
  try {
    const { trainerId, studentId, trainerName, roomId } = req.body;

    console.log('📞 Sending video call invitation:', {
      trainerId,
      studentId,
      trainerName,
      roomId
    });

    // Create notification for student
    const notification = await Notification.create({
      user_id: studentId,
      type: 'general',
      title: 'Video Call Invitation',
      message: `${trainerName} is inviting you to a video call. Click to join!`,
      data: JSON.stringify({
        type: 'video_call',
        roomId: roomId,
        trainerId: trainerId,
        trainerName: trainerName
      })
    });

    console.log('✅ Video call invitation sent:', notification);

    res.json({
      success: true,
      message: 'Invitation sent successfully',
      notification
    });
  } catch (error) {
    console.error('❌ Error sending video call invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invitation'
    });
  }
});

export default router;
