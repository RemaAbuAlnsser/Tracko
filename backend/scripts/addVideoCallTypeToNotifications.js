import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL Database!');
});

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

connection.query(updateTypeEnum, (err, result) => {
  if (err) {
    console.error('❌ Error updating type enum:', err);
    connection.end();
    process.exit(1);
  }
  
  console.log('✅ Successfully added "video_call" to notification types');
  
  // Verify the change
  connection.query('DESCRIBE notifications', (err, results) => {
    if (err) {
      console.error('❌ Error describing table:', err);
    } else {
      const typeField = results.find(field => field.Field === 'type');
      console.log('\n📋 Notification type field:');
      console.log(`   Type: ${typeField.Type}`);
    }
    
    connection.end();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  });
});
