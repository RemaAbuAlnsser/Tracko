import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkNotifications() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracko'
    });

    console.log('✅ Connected to database\n');
    
    // Get student user_id
    console.log('1️⃣ Checking student with email noor@najah.com...');
    const [students] = await connection.query(
      'SELECT u.id as user_id, u.full_name, u.email FROM Users u WHERE u.email = ?',
      ['noor@najah.com']
    );
    
    if (students.length === 0) {
      console.log('❌ Student not found');
      return;
    }
    
    const student = students[0];
    console.log(`✅ Found student: ${student.full_name} (user_id: ${student.user_id})\n`);
    
    // Check notifications
    console.log('2️⃣ Checking notifications for this user...');
    const [notifications] = await connection.query(
      'SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC',
      [student.user_id]
    );
    
    console.log(`📊 Found ${notifications.length} notifications\n`);
    
    if (notifications.length === 0) {
      console.log('⚠️  No notifications found for this user');
      console.log('\n💡 Creating a test notification...');
      
      await connection.query(
        'INSERT INTO Notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [
          student.user_id,
          '🎉 Test Notification',
          'This is a test notification to verify the system is working.',
          'general'
        ]
      );
      
      console.log('✅ Test notification created!');
      
      // Check again
      const [newNotifications] = await connection.query(
        'SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC',
        [student.user_id]
      );
      
      console.log(`\n📊 Now you have ${newNotifications.length} notification(s):`);
      newNotifications.forEach((notif, index) => {
        console.log(`\n${index + 1}. ${notif.title}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Type: ${notif.type}`);
        console.log(`   Read: ${notif.is_read ? 'Yes' : 'No'}`);
        console.log(`   Created: ${notif.created_at}`);
      });
    } else {
      console.log('📋 Notifications:');
      notifications.forEach((notif, index) => {
        console.log(`\n${index + 1}. ${notif.title}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Type: ${notif.type}`);
        console.log(`   Read: ${notif.is_read ? 'Yes' : 'No'}`);
        console.log(`   Created: ${notif.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkNotifications();
