import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkNotifications() {
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

    // Get training_completion notifications
    const query = `
      SELECT n.*, u.full_name, u.email
      FROM notifications n
      JOIN Users u ON n.user_id = u.id
      WHERE n.type = 'training_completion'
      ORDER BY n.created_at DESC
    `;

    const [rows] = await connection.query(query);
    
    console.log(`\n📧 Training Completion Notifications (${rows.length}):\n`);
    
    if (rows.length === 0) {
      console.log('   No training completion notifications found.');
    } else {
      rows.forEach(row => {
        console.log(`${row.is_read ? '✅' : '📬'} To: ${row.full_name} (${row.email})`);
        console.log(`   Title: ${row.title}`);
        console.log(`   Message: ${row.message}`);
        console.log(`   Created: ${row.created_at}`);
        console.log('');
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
