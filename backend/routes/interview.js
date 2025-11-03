import express from 'express';
import Interview from '../models/Interview.js';
import db from '../config/database.js';

const router = express.Router();

// Create a new interview and send notification
router.post('/', async (req, res) => {
  try {
    const {
      company_id,
      student_id,
      internship_id,
      interview_date,
      interview_time,
      interview_location,
      interview_type,
      notes
    } = req.body;

    console.log('📅 Creating interview:', req.body);

    // Create interview
    const result = await Interview.create({
      company_id,
      student_id,
      internship_id,
      interview_date,
      interview_time,
      interview_location,
      interview_type,
      notes
    });

    const interviewId = result.insertId;

    // Get student user_id and company name for notification
    const [studentData] = await new Promise((resolve, reject) => {
      db.query(
        `SELECT s.user_id, u.full_name as student_name, c.name as company_name, i.title as internship_title
         FROM Students s
         JOIN Users u ON s.user_id = u.id
         JOIN Company c ON c.id = ?
         JOIN Internships i ON i.id = ?
         WHERE s.id = ?`,
        [company_id, internship_id, student_id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    if (studentData) {
      // Format date and time
      const formattedDate = new Date(interview_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Create notification for student
      const notificationTitle = 'Interview Scheduled';
      const notificationMessage = `Interview scheduled with ${studentData.company_name} for ${studentData.internship_title} on ${formattedDate} at ${interview_time}`;
      
      await new Promise((resolve, reject) => {
        db.query(
          `INSERT INTO Notifications (user_id, title, message, type)
           VALUES (?, ?, ?, 'general')`,
          [studentData.user_id, notificationTitle, notificationMessage],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      console.log(`✅ Interview created and notification sent to student ${studentData.student_name}`);
    }

    res.json({
      success: true,
      message: 'Interview scheduled successfully',
      interview_id: interviewId
    });

  } catch (error) {
    console.error('❌ Error creating interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule interview',
      error: error.message
    });
  }
});

// Get interviews by student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const interviews = await Interview.getByStudent(studentId);

    res.json({
      success: true,
      interviews
    });
  } catch (error) {
    console.error('Error fetching student interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interviews'
    });
  }
});

// Get interviews by company
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const interviews = await Interview.getByCompany(companyId);

    res.json({
      success: true,
      interviews
    });
  } catch (error) {
    console.error('Error fetching company interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interviews'
    });
  }
});

// Update interview status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await Interview.updateStatus(id, status);

    res.json({
      success: true,
      message: 'Interview status updated'
    });
  } catch (error) {
    console.error('Error updating interview status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update interview status'
    });
  }
});

// Send reminders manually (for testing)
router.post('/send-reminders', async (req, res) => {
  try {
    const { sendInterviewReminders } = await import('../jobs/interviewReminders.js');
    const result = await sendInterviewReminders();
    
    res.json({
      success: result.success,
      message: `Reminders sent to ${result.count} students`,
      count: result.count
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminders'
    });
  }
});

export default router;
