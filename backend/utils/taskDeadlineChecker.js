import db from "../config/database.js";
import Notification from "../models/Notification.js";

/**
 * Check for upcoming task deadlines and send notifications to students
 * This should be run periodically (e.g., every hour) via cron job
 */
export async function checkTaskDeadlines() {
  try {
    console.log('🔔 Checking for upcoming task deadlines...');
    
    // Find all weeks with due dates between 23-25 hours (around 24 hours exactly)
    // Only for students who haven't submitted the task yet AND are still in_training
    const query = `
      SELECT DISTINCT
        pw.id as week_id,
        pw.title as week_title,
        pw.tasks,
        pw.due_date,
        pw.week_number,
        ip.id as plan_id,
        ip.title as plan_title,
        ip.internship_id,
        i.title as internship_title,
        im.student_id,
        s.user_id as student_user_id,
        s.status as student_status,
        u.full_name as student_name,
        TIMESTAMPDIFF(MINUTE, NOW(), pw.due_date) as minutes_remaining
      FROM Plan_Weeks pw
      JOIN Internship_Plans ip ON pw.plan_id = ip.id
      JOIN Internships i ON ip.internship_id = i.id
      JOIN Internship_Matches im ON i.id = im.internship_id AND im.status = 'accepted'
      JOIN Students s ON im.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      WHERE pw.due_date IS NOT NULL
        AND pw.due_date > NOW()
        AND TIMESTAMPDIFF(MINUTE, NOW(), pw.due_date) BETWEEN 1380 AND 1500
        AND s.status = 'in_training'
        AND NOT EXISTS (
          SELECT 1 FROM Task_Submissions ts 
          WHERE ts.week_id = pw.id 
            AND ts.student_id = im.student_id
        )
    `;

    const upcomingDeadlines = await new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log(`📋 Found ${upcomingDeadlines.length} tasks due in ~24 hours (for students in_training who haven't submitted)`);
    
    if (upcomingDeadlines.length > 0) {
      console.log('📊 Deadline details:');
      upcomingDeadlines.forEach(d => {
        const hours = Math.floor(d.minutes_remaining / 60);
        const minutes = d.minutes_remaining % 60;
        console.log(`  - Week ${d.week_number}: "${d.tasks || d.week_title}" for ${d.student_name} (${d.student_status})`);
        console.log(`    Due: ${d.due_date}, Time remaining: ${hours}h ${minutes}m`);
      });
    }

    // Check which students have already been notified for this specific task
    const notificationsToSend = [];
    
    for (const deadline of upcomingDeadlines) {
      // Check if notification already sent for this specific week_id and student
      const checkNotificationQuery = `
        SELECT id FROM notifications 
        WHERE user_id = ? 
          AND type = 'task_deadline'
          AND (message LIKE ? OR message LIKE ?)
      `;
      
      const taskName = deadline.tasks || deadline.week_title;
      const existingNotification = await new Promise((resolve, reject) => {
        db.query(
          checkNotificationQuery, 
          [
            deadline.student_user_id, 
            `%${taskName}%${deadline.plan_title}%`,
            `%Week ${deadline.week_number}%${deadline.plan_title}%`
          ],
          (err, results) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
      });

      // Only send notification if NEVER sent before for this task
      if (existingNotification.length === 0) {
        const hoursRemaining = Math.floor(deadline.minutes_remaining / 60);
        const minutesRemaining = deadline.minutes_remaining % 60;
        
        notificationsToSend.push({
          user_id: deadline.student_user_id,
          title: '🔴 Urgent: Task Deadline in 24 Hours!',
          message: `⚠️ Your task "${taskName}" for "${deadline.plan_title}" is due in approximately 24 hours (${hoursRemaining}h ${minutesRemaining}m). Please submit your work as soon as possible!`,
          type: 'task_deadline'
        });
        
        console.log(`📤 Notification queued for ${deadline.student_name}: ${hoursRemaining}h ${minutesRemaining}m remaining`);
      } else {
        console.log(`⏭️  Skipping ${deadline.student_name} - already notified for this task`);
      }
    }

    // Send all notifications
    if (notificationsToSend.length > 0) {
      await Notification.createBulk(notificationsToSend);
      console.log(`✅ Sent ${notificationsToSend.length} deadline notifications`);
    } else {
      console.log('ℹ️  No new notifications to send');
    }

    return {
      success: true,
      deadlinesFound: upcomingDeadlines.length,
      notificationsSent: notificationsToSend.length
    };

  } catch (error) {
    console.error('❌ Error checking task deadlines:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check for overdue tasks and send notifications
 */
export async function checkOverdueTasks() {
  try {
    console.log('🔔 Checking for overdue tasks...');
    
    const query = `
      SELECT 
        pw.id as week_id,
        pw.title as week_title,
        pw.tasks,
        pw.due_date,
        pw.week_number,
        ip.id as plan_id,
        ip.title as plan_title,
        im.student_id,
        s.user_id as student_user_id,
        u.full_name as student_name
      FROM Plan_Weeks pw
      JOIN Internship_Plans ip ON pw.plan_id = ip.id
      JOIN Internships i ON ip.internship_id = i.id
      JOIN Internship_Matches im ON i.id = im.internship_id AND im.status = 'accepted'
      JOIN Students s ON im.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      WHERE pw.due_date IS NOT NULL
        AND pw.due_date < NOW()
        AND ip.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM Task_Submissions ts 
          WHERE ts.week_id = pw.id 
            AND ts.student_id = im.student_id
        )
    `;

    const overdueTasks = await new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log(`📋 Found ${overdueTasks.length} overdue tasks`);

    const notificationsToSend = [];
    
    for (const task of overdueTasks) {
      // Check if already notified about this overdue task in the last 24 hours
      const checkNotificationQuery = `
        SELECT id FROM notifications 
        WHERE user_id = ? 
          AND type = 'task_overdue'
          AND message LIKE ?
          AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `;
      
      const existingNotification = await new Promise((resolve, reject) => {
        db.query(
          checkNotificationQuery, 
          [task.student_user_id, `%${task.week_title}%`],
          (err, results) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
      });

      if (existingNotification.length === 0) {
        notificationsToSend.push({
          user_id: task.student_user_id,
          title: '⚠️ Task Overdue',
          message: `Your task "${task.tasks || task.week_title}" for ${task.plan_title} is overdue. The deadline was ${new Date(task.due_date).toLocaleString()}. Please submit as soon as possible.`,
          type: 'task_overdue'
        });
      }
    }

    if (notificationsToSend.length > 0) {
      await Notification.createBulk(notificationsToSend);
      console.log(`✅ Sent ${notificationsToSend.length} overdue task notifications`);
    } else {
      console.log('ℹ️  No new overdue notifications to send');
    }

    return {
      success: true,
      overdueTasksFound: overdueTasks.length,
      notificationsSent: notificationsToSend.length
    };

  } catch (error) {
    console.error('❌ Error checking overdue tasks:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
