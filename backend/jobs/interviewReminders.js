import db from '../config/database.js';

// Send daily interview reminders
export const sendInterviewReminders = async () => {
  try {
    console.log('📅 Checking for upcoming interviews...');

    // Get all scheduled interviews that haven't happened yet
    const query = `
      SELECT 
        i.id,
        i.interview_date,
        i.interview_time,
        i.interview_location,
        i.interview_type,
        s.user_id,
        u.full_name as student_name,
        c.name as company_name,
        int.title as internship_title,
        DATEDIFF(i.interview_date, CURDATE()) as days_until
      FROM Interviews i
      JOIN Students s ON i.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      JOIN Company c ON i.company_id = c.id
      JOIN Internships int ON i.internship_id = int.id
      WHERE i.status = 'scheduled' 
        AND i.interview_date >= CURDATE()
        AND i.interview_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY i.interview_date ASC
    `;

    const interviews = await new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log(`📊 Found ${interviews.length} upcoming interviews`);

    // Send reminder for each interview
    for (const interview of interviews) {
      const daysUntil = interview.days_until;
      let reminderMessage = '';

      if (daysUntil === 0) {
        reminderMessage = `⏰ Reminder: Your interview with ${interview.company_name} for ${interview.internship_title} is TODAY at ${interview.interview_time}!`;
      } else if (daysUntil === 1) {
        reminderMessage = `📅 Reminder: Your interview with ${interview.company_name} for ${interview.internship_title} is TOMORROW at ${interview.interview_time}`;
      } else {
        reminderMessage = `📅 Reminder: Your interview with ${interview.company_name} for ${interview.internship_title} is in ${daysUntil} days (${new Date(interview.interview_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${interview.interview_time})`;
      }

      // Add location info if available
      if (interview.interview_location) {
        if (interview.interview_type === 'online') {
          reminderMessage += `. Meeting link: ${interview.interview_location}`;
        } else {
          reminderMessage += `. Location: ${interview.interview_location}`;
        }
      }

      // Insert notification
      await new Promise((resolve, reject) => {
        db.query(
          `INSERT INTO Notifications (user_id, title, message, type)
           VALUES (?, ?, ?, 'general')`,
          [interview.user_id, 'Interview Reminder', reminderMessage],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      console.log(`✅ Reminder sent to ${interview.student_name} for interview in ${daysUntil} day(s)`);
    }

    console.log('✅ Interview reminders completed');
    return { success: true, count: interviews.length };

  } catch (error) {
    console.error('❌ Error sending interview reminders:', error);
    return { success: false, error: error.message };
  }
};

// Run reminders immediately (for testing)
export const runRemindersNow = async () => {
  console.log('🔔 Running interview reminders manually...');
  return await sendInterviewReminders();
};
