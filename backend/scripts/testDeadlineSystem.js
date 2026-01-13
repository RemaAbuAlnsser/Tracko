import db from '../config/database.js';
import { checkTaskDeadlines, checkOverdueTasks } from '../utils/taskDeadlineChecker.js';

async function testSystem() {
  try {
    console.log('🧪 Testing Deadline Notification System\n');
    
    // Step 1: Check if there are any tasks with due_date
    console.log('Step 1: Checking for tasks with due_date...');
    const tasksQuery = `
      SELECT 
        pw.id,
        pw.title,
        pw.tasks,
        pw.due_date,
        pw.week_number,
        ip.title as plan_title,
        TIMESTAMPDIFF(MINUTE, NOW(), pw.due_date) as minutes_remaining
      FROM Plan_Weeks pw
      JOIN Internship_Plans ip ON pw.plan_id = ip.id
      WHERE pw.due_date IS NOT NULL
      ORDER BY pw.due_date ASC
      LIMIT 10
    `;
    
    const tasks = await new Promise((resolve, reject) => {
      db.query(tasksQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log(`✅ Found ${tasks.length} tasks with due_date:\n`);
    tasks.forEach((task, index) => {
      const hours = Math.floor(Math.abs(task.minutes_remaining) / 60);
      const minutes = Math.abs(task.minutes_remaining) % 60;
      const isPast = task.minutes_remaining < 0;
      console.log(`${index + 1}. Week ${task.week_number}: ${task.tasks || task.title}`);
      console.log(`   Plan: ${task.plan_title}`);
      console.log(`   Due: ${task.due_date}`);
      console.log(`   Time ${isPast ? 'overdue' : 'remaining'}: ${hours}h ${minutes}m\n`);
    });
    
    // Step 2: Check students eligible for notifications
    console.log('\nStep 2: Checking students in_training with internships...');
    const studentsQuery = `
      SELECT 
        s.id as student_id,
        s.user_id,
        u.full_name,
        s.status,
        i.title as internship_title,
        im.status as match_status
      FROM Students s
      JOIN Users u ON s.user_id = u.id
      JOIN Internship_Matches im ON s.id = im.student_id
      JOIN Internships i ON im.internship_id = i.id
      WHERE s.status = 'in_training' 
        AND im.status = 'accepted'
      LIMIT 5
    `;
    
    const students = await new Promise((resolve, reject) => {
      db.query(studentsQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log(`✅ Found ${students.length} students in_training:\n`);
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.full_name} (User ID: ${student.user_id})`);
      console.log(`   Internship: ${student.internship_title}`);
      console.log(`   Status: ${student.status}\n`);
    });
    
    // Step 3: Check existing notifications
    console.log('\nStep 3: Checking existing notifications in database...');
    const notifQuery = `
      SELECT type, COUNT(*) as count 
      FROM notifications 
      WHERE type IN ('task_deadline', 'task_overdue')
      GROUP BY type
    `;
    
    const notifCounts = await new Promise((resolve, reject) => {
      db.query(notifQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('📊 Notification counts:');
    if (notifCounts.length === 0) {
      console.log('   No deadline/overdue notifications found in database\n');
    } else {
      notifCounts.forEach(n => {
        console.log(`   ${n.type}: ${n.count}`);
      });
    }
    
    // Step 4: Run the deadline checker manually
    console.log('\n\nStep 4: Running deadline checker manually...\n');
    console.log('='.repeat(60));
    const deadlineResult = await checkTaskDeadlines();
    console.log('='.repeat(60));
    
    console.log('\n\nStep 5: Running overdue task checker manually...\n');
    console.log('='.repeat(60));
    const overdueResult = await checkOverdueTasks();
    console.log('='.repeat(60));
    
    // Step 6: Check notifications after running
    console.log('\n\nStep 6: Checking notifications after running checks...');
    const newNotifQuery = `
      SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.created_at,
        u.full_name as recipient
      FROM notifications n
      JOIN Users u ON n.user_id = u.id
      WHERE n.type IN ('task_deadline', 'task_overdue')
      ORDER BY n.created_at DESC
      LIMIT 5
    `;
    
    const recentNotifs = await new Promise((resolve, reject) => {
      db.query(newNotifQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log(`\n📬 Recent deadline notifications (${recentNotifs.length}):\n`);
    if (recentNotifs.length === 0) {
      console.log('   No notifications found');
    } else {
      recentNotifs.forEach((notif, index) => {
        console.log(`${index + 1}. [${notif.type}] ${notif.title}`);
        console.log(`   To: ${notif.recipient}`);
        console.log(`   Created: ${notif.created_at}`);
        console.log(`   Message: ${notif.message.substring(0, 100)}...\n`);
      });
    }
    
    console.log('\n✅ Test completed!');
    console.log('\n📝 Summary:');
    console.log(`   - Tasks with due_date: ${tasks.length}`);
    console.log(`   - Students in_training: ${students.length}`);
    console.log(`   - Deadlines found in check: ${deadlineResult.deadlinesFound || 0}`);
    console.log(`   - Notifications sent: ${deadlineResult.notificationsSent || 0}`);
    console.log(`   - Overdue tasks found: ${overdueResult.overdueTasksFound || 0}`);
    console.log(`   - Overdue notifications sent: ${overdueResult.notificationsSent || 0}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testSystem();
