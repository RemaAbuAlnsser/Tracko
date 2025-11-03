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
    
    // Get recent notifications (last 24 hours)
    console.log('🔍 Checking recent notifications (last 24 hours)...\n');
    
    const [notifications] = await connection.query(`
      SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.is_read,
        n.created_at,
        u.full_name as student_name,
        u.email as student_email
      FROM notifications n
      JOIN Users u ON n.user_id = u.id
      WHERE n.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY n.created_at DESC
    `);
    
    if (notifications.length === 0) {
      console.log('❌ No notifications found in the last 24 hours\n');
      return;
    }
    
    console.log(`📊 Found ${notifications.length} notification(s):\n`);
    
    // Group by type
    const byType = {};
    notifications.forEach(n => {
      if (!byType[n.type]) byType[n.type] = [];
      byType[n.type].push(n);
    });
    
    // Show statistics
    console.log('📈 Statistics:');
    Object.entries(byType).forEach(([type, notifs]) => {
      console.log(`   ${type}: ${notifs.length} notification(s)`);
    });
    console.log('');
    
    // Show matching internship notifications
    const matchingNotifs = notifications.filter(n => 
      n.title.includes('Matching Internship') || n.message.includes('matches your profile')
    );
    
    if (matchingNotifs.length > 0) {
      console.log(`🎯 New Internship Notifications (${matchingNotifs.length}):\n`);
      
      matchingNotifs.forEach((notif, index) => {
        console.log(`${index + 1}. To: ${notif.student_name} (${notif.student_email})`);
        console.log(`   Title: ${notif.title}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Read: ${notif.is_read ? 'Yes' : 'No'}`);
        console.log(`   Created: ${notif.created_at}`);
        console.log('');
      });
    }
    
    // Show all notifications
    console.log('📋 All Recent Notifications:\n');
    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.student_name}`);
      console.log(`   ${notif.title}`);
      console.log(`   ${notif.message.substring(0, 80)}${notif.message.length > 80 ? '...' : ''}`);
      console.log(`   ${notif.created_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkNotifications();
