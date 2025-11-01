import db from '../config/database.js';

async function addEventTypeToNotifications() {
  try {
    console.log('🔧 Adding event type to notifications table...');
    
    // Check current ENUM values
    const checkQuery = `
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'tracko_db' 
      AND TABLE_NAME = 'notifications' 
      AND COLUMN_NAME = 'type'
    `;
    
    db.query(checkQuery, (err, results) => {
      if (err) {
        console.error('❌ Error checking column:', err);
        process.exit(1);
      }
      
      console.log('Current type column:', results[0]?.COLUMN_TYPE);
      
      // Alter table to add 'event' to ENUM
      const alterQuery = `
        ALTER TABLE notifications 
        MODIFY COLUMN type ENUM('general', 'application', 'interview', 'acceptance', 'rejection', 'task_submission', 'task_review', 'weekly_report', 'event') 
        DEFAULT 'general'
      `;
      
      db.query(alterQuery, (err, result) => {
        if (err) {
          console.error('❌ Error altering table:', err);
          process.exit(1);
        }
        
        console.log('✅ Successfully added event type to notifications!');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addEventTypeToNotifications();
