import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

import db from '../config/database.js';

console.log('🧪 Testing Deadline Notifications System\n');

// Test 1: Check if there are any tasks with due dates
console.log('📋 Test 1: Checking Plan_Weeks with due_date...');
const checkWeeksQuery = `
  SELECT 
    pw.id,
    pw.week_number,
    pw.title,
    pw.tasks,
    pw.due_date,
    ip.title as plan_title,
    TIMESTAMPDIFF(HOUR, NOW(), pw.due_date) as hours_remaining
  FROM Plan_Weeks pw
  JOIN Internship_Plans ip ON pw.plan_id = ip.id
  WHERE pw.due_date IS NOT NULL
  ORDER BY pw.due_date ASC
  LIMIT 10
`;

db.query(checkWeeksQuery, (err, weeks) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
  
  console.log(`✅ Found ${weeks.length} weeks with due dates:\n`);
  weeks.forEach(w => {
    const hoursLeft = w.hours_remaining;
    const status = hoursLeft < 0 ? '🔴 OVERDUE' : hoursLeft <= 24 ? '🟡 URGENT' : '🟢 OK';
    console.log(`  ${status} Week ${w.week_number}: ${w.tasks || w.title}`);
    console.log(`     Plan: ${w.plan_title}`);
    console.log(`     Due: ${w.due_date}`);
    console.log(`     Hours remaining: ${hoursLeft}h\n`);
  });
  
  // Test 2: Check Internship_Matches
  console.log('\n📋 Test 2: Checking Internship_Matches...');
  const checkMatchesQuery = `
    SELECT 
      im.id,
      im.internship_id,
      im.student_id,
      im.status,
      i.title as internship_title,
      u.full_name as student_name,
      s.user_id
    FROM Internship_Matches im
    JOIN Internships i ON im.internship_id = i.id
    JOIN Students s ON im.student_id = s.id
    JOIN Users u ON s.user_id = u.id
    WHERE im.status = 'accepted'
    LIMIT 10
  `;
  
  db.query(checkMatchesQuery, (err, matches) => {
    if (err) {
      console.error('❌ Error:', err);
      process.exit(1);
    }
    
    console.log(`✅ Found ${matches.length} accepted matches:\n`);
    matches.forEach(m => {
      console.log(`  - ${m.student_name} (user_id: ${m.user_id})`);
      console.log(`    Internship: ${m.internship_title}`);
      console.log(`    Status: ${m.status}\n`);
    });
    
    // Test 3: Run the full query
    console.log('\n📋 Test 3: Running full deadline query...');
    const fullQuery = `
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
        u.full_name as student_name,
        TIMESTAMPDIFF(HOUR, NOW(), pw.due_date) as hours_remaining
      FROM Plan_Weeks pw
      JOIN Internship_Plans ip ON pw.plan_id = ip.id
      JOIN Internships i ON ip.internship_id = i.id
      JOIN Internship_Matches im ON i.id = im.internship_id AND im.status = 'accepted'
      JOIN Students s ON im.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      WHERE pw.due_date IS NOT NULL
        AND pw.due_date > NOW()
        AND pw.due_date <= DATE_ADD(NOW(), INTERVAL 24 HOUR)
        AND NOT EXISTS (
          SELECT 1 FROM Task_Submissions ts 
          WHERE ts.week_id = pw.id 
            AND ts.student_id = im.student_id 
            AND ts.status = 'approved'
        )
    `;
    
    db.query(fullQuery, (err, results) => {
      if (err) {
        console.error('❌ Error:', err);
        process.exit(1);
      }
      
      console.log(`✅ Found ${results.length} tasks requiring notifications:\n`);
      
      if (results.length === 0) {
        console.log('ℹ️  No tasks found. Possible reasons:');
        console.log('   1. No tasks with due_date in next 24 hours');
        console.log('   2. Student not in Internship_Matches with status=accepted');
        console.log('   3. Task already submitted and approved');
        console.log('   4. No matching between Plan -> Internship -> Match -> Student');
      } else {
        results.forEach(r => {
          console.log(`  📤 Notification needed for:`);
          console.log(`     Student: ${r.student_name} (user_id: ${r.student_user_id})`);
          console.log(`     Task: ${r.tasks || r.week_title}`);
          console.log(`     Plan: ${r.plan_title}`);
          console.log(`     Due: ${r.due_date}`);
          console.log(`     Hours remaining: ${r.hours_remaining}h\n`);
        });
      }
      
      console.log('\n✅ Test completed!');
      process.exit(0);
    });
  });
});
