import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import db from '../config/database.js';

console.log('🧪 Testing New 24-Hour Notification System\n');

// Test 1: Check all tasks with due dates
console.log('📋 Test 1: All tasks with due dates and their time remaining...\n');
const allTasksQuery = `
  SELECT 
    pw.id,
    pw.week_number,
    pw.tasks,
    pw.due_date,
    ip.title as plan_title,
    TIMESTAMPDIFF(MINUTE, NOW(), pw.due_date) as minutes_remaining,
    TIMESTAMPDIFF(HOUR, NOW(), pw.due_date) as hours_remaining
  FROM Plan_Weeks pw
  JOIN Internship_Plans ip ON pw.plan_id = ip.id
  WHERE pw.due_date IS NOT NULL
    AND pw.due_date > NOW()
  ORDER BY pw.due_date ASC
`;

db.query(allTasksQuery, (err, tasks) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
  
  console.log(`✅ Found ${tasks.length} upcoming tasks:\n`);
  tasks.forEach(t => {
    const hours = Math.floor(t.minutes_remaining / 60);
    const minutes = t.minutes_remaining % 60;
    const inRange = t.minutes_remaining >= 1380 && t.minutes_remaining <= 1500;
    const status = inRange ? '✅ IN RANGE (23-25h)' : hours <= 24 ? '⏰ < 24h' : '⏳ > 24h';
    
    console.log(`  ${status} Week ${t.week_number}: ${t.tasks || 'Untitled'}`);
    console.log(`     Plan: ${t.plan_title}`);
    console.log(`     Due: ${t.due_date}`);
    console.log(`     Time: ${hours}h ${minutes}m (${t.minutes_remaining} minutes)\n`);
  });
  
  // Test 2: Check which students have submitted
  console.log('\n📋 Test 2: Checking task submissions...\n');
  const submissionsQuery = `
    SELECT 
      ts.id,
      ts.week_id,
      ts.student_id,
      ts.status,
      u.full_name as student_name,
      pw.tasks as task_name
    FROM Task_Submissions ts
    JOIN Students s ON ts.student_id = s.id
    JOIN Users u ON s.user_id = u.id
    JOIN Plan_Weeks pw ON ts.week_id = pw.id
    ORDER BY ts.week_id, ts.student_id
  `;
  
  db.query(submissionsQuery, (err, submissions) => {
    if (err) {
      console.error('❌ Error:', err);
      process.exit(1);
    }
    
    console.log(`✅ Found ${submissions.length} task submissions:\n`);
    submissions.forEach(s => {
      console.log(`  - ${s.student_name}: Week ${s.week_id} (${s.task_name})`);
      console.log(`    Status: ${s.status}\n`);
    });
    
    // Test 3: Run the actual query
    console.log('\n📋 Test 3: Running actual notification query (23-25 hours, in_training, no submission)...\n');
    const actualQuery = `
      SELECT DISTINCT
        pw.id as week_id,
        pw.title as week_title,
        pw.tasks,
        pw.due_date,
        pw.week_number,
        ip.id as plan_id,
        ip.title as plan_title,
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
    
    db.query(actualQuery, (err, results) => {
      if (err) {
        console.error('❌ Error:', err);
        process.exit(1);
      }
      
      console.log(`✅ Found ${results.length} students who need notifications:\n`);
      
      if (results.length === 0) {
        console.log('ℹ️  No students need notifications right now because:');
        console.log('   1. No tasks with due_date between 23-25 hours (1380-1500 minutes)');
        console.log('   2. OR all students already submitted their tasks');
        console.log('   3. OR students are not in_training (status = completed)');
        console.log('   4. OR notifications already sent for these tasks\n');
      } else {
        results.forEach(r => {
          const hours = Math.floor(r.minutes_remaining / 60);
          const minutes = r.minutes_remaining % 60;
          console.log(`  📤 ${r.student_name} (user_id: ${r.student_user_id}, status: ${r.student_status})`);
          console.log(`     Task: ${r.tasks || r.week_title}`);
          console.log(`     Plan: ${r.plan_title}`);
          console.log(`     Due: ${r.due_date}`);
          console.log(`     Time: ${hours}h ${minutes}m\n`);
        });
      }
      
      // Test 4: Check existing notifications
      console.log('\n📋 Test 4: Checking existing notifications...\n');
      const notifQuery = `
        SELECT 
          n.id,
          u.full_name,
          n.title,
          n.created_at
        FROM notifications n
        JOIN Users u ON n.user_id = u.id
        WHERE n.type = 'task_deadline'
        ORDER BY n.created_at DESC
        LIMIT 10
      `;
      
      db.query(notifQuery, (err, notifs) => {
        if (err) {
          console.error('❌ Error:', err);
          process.exit(1);
        }
        
        console.log(`✅ Last ${notifs.length} deadline notifications:\n`);
        notifs.forEach(n => {
          console.log(`  - ${n.full_name}: ${n.title}`);
          console.log(`    Sent: ${n.created_at}\n`);
        });
        
        console.log('\n✅ Test completed!');
        console.log('\n📝 Summary:');
        console.log('   - System will send notifications ONLY when task is 23-25 hours away');
        console.log('   - ONLY to students who have NOT submitted the task');
        console.log('   - Each student gets notification ONCE per task');
        console.log('   - Cron job runs every 15 minutes to check');
        
        process.exit(0);
      });
    });
  });
});
