import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function sendCompletionNotifications() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracko',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database');

    // Find students who completed training hours
    const studentsQuery = `
      SELECT 
        im.id as match_id,
        im.student_id,
        im.completed_hours,
        s.university_id,
        i.company_id,
        u.full_name as student_name,
        s.user_id as student_user_id,
        uni.email as university_email,
        ucp.training_hours as required_hours
      FROM Internship_Matches im
      JOIN Students s ON im.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      JOIN Internships i ON im.internship_id = i.id
      LEFT JOIN Universities uni ON s.university_id = uni.id
      LEFT JOIN University_Company_Partnerships ucp 
        ON s.university_id = ucp.university_id 
        AND i.company_id = ucp.company_id
      WHERE im.status = 'accepted'
        AND im.completed_hours >= ucp.training_hours
        AND ucp.training_hours IS NOT NULL
    `;

    const [students] = await connection.query(studentsQuery);
    
    console.log(`\n📊 Found ${students.length} student(s) who completed training hours\n`);

    for (const student of students) {
      console.log(`\n🎓 Processing: ${student.student_name}`);
      console.log(`   Completed: ${student.completed_hours}/${student.required_hours} hours`);

      // Get trainer for this student through internship match
      const trainerQuery = `
        SELECT t.user_id as trainer_user_id
        FROM Internship_Plans ip
        JOIN Trainers t ON ip.trainer_id = t.id
        JOIN Internship_Matches im ON ip.internship_id = im.internship_id
        WHERE im.student_id = ? AND ip.status IN ('active', 'in_training')
        LIMIT 1
      `;
      
      const [trainers] = await connection.query(trainerQuery, [student.student_id]);
      
      const completionMessage = `${student.student_name} has completed all required training hours (${student.completed_hours}/${student.required_hours} hours)!`;
      
      // Send notification to trainer
      if (trainers.length > 0 && trainers[0].trainer_user_id) {
        const trainerUserId = trainers[0].trainer_user_id;
        
        // Check if notification already exists
        const [existing] = await connection.query(
          `SELECT id FROM notifications 
           WHERE user_id = ? AND type = 'training_completion' 
           AND message LIKE ?`,
          [trainerUserId, `%${student.student_name}%`]
        );
        
        if (existing.length === 0) {
          await connection.query(
            `INSERT INTO notifications (user_id, title, message, type) 
             VALUES (?, ?, ?, ?)`,
            [trainerUserId, 'Training Hours Completed', completionMessage, 'training_completion']
          );
          console.log(`   ✅ Notification sent to trainer (user_id: ${trainerUserId})`);
        } else {
          console.log(`   ⏭️  Notification already exists for trainer`);
        }
      } else {
        console.log(`   ⚠️  No trainer found for this student`);
      }
      
      // Send notification to university
      if (student.university_email) {
        // Get university user_id from email
        const [uniUsers] = await connection.query(
          `SELECT id FROM Users WHERE email = ?`,
          [student.university_email]
        );
        
        if (uniUsers.length > 0) {
          const universityUserId = uniUsers[0].id;
          
          // Check if notification already exists
          const [existing] = await connection.query(
            `SELECT id FROM notifications 
             WHERE user_id = ? AND type = 'training_completion' 
             AND message LIKE ?`,
            [universityUserId, `%${student.student_name}%`]
          );
          
          if (existing.length === 0) {
            await connection.query(
              `INSERT INTO notifications (user_id, title, message, type) 
               VALUES (?, ?, ?, ?)`,
              [universityUserId, 'Student Completed Training Hours', completionMessage, 'training_completion']
            );
            console.log(`   ✅ Notification sent to university (user_id: ${universityUserId})`);
          } else {
            console.log(`   ⏭️  Notification already exists for university`);
          }
        } else {
          console.log(`   ⚠️  University user not found for email: ${student.university_email}`);
        }
      } else {
        console.log(`   ⚠️  No university email found`);
      }
    }

    console.log('\n✅ Completed sending notifications!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

sendCompletionNotifications();
