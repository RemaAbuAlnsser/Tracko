import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function updateNotificationType() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tracko'
    });

    console.log('✅ Connected to database!');
    
    // Add video_call to type enum
    const updateTypeEnum = `
      ALTER TABLE notifications 
      MODIFY COLUMN type ENUM(
        'general',
        'application',
        'interview',
        'acceptance',
        'rejection',
        'task_submission',
        'task_review',
        'weekly_report',
        'event',
        'video_call'
      ) NOT NULL DEFAULT 'general'
    `;

    console.log('🔄 Updating notification type enum...');
    await connection.query(updateTypeEnum);
    console.log('✅ Successfully added "video_call" to notification types');
    
    // Verify the change
    const [results] = await connection.query('DESCRIBE notifications');
    const typeField = results.find(field => field.Field === 'type');
    console.log('\n📋 Notification type field:');
    console.log(`   Type: ${typeField.Type}`);
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

updateNotificationType();
