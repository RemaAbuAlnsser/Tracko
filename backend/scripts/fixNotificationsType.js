import db from '../config/database.js';

async function fixNotificationsType() {
  try {
    console.log('🔧 Fixing notifications type column...');
    
    // First, check what types exist
    const checkQuery = 'SELECT DISTINCT type FROM notifications';
    
    db.query(checkQuery, (err, results) => {
      if (err) {
        console.error('❌ Error checking types:', err);
        process.exit(1);
      }
      
      console.log('📊 Current types in database:', results);
      
      // Update any invalid types to 'general'
      const updateQuery = `
        UPDATE notifications 
        SET type = 'general' 
        WHERE type NOT IN ('general', 'application', 'interview', 'acceptance', 'rejection', 'task_submission', 'task_review', 'weekly_report')
      `;
      
      db.query(updateQuery, (err, result) => {
        if (err) {
          console.error('❌ Error updating types:', err);
          process.exit(1);
        }
        
        console.log(`✅ Updated ${result.affectedRows} rows`);
        
        // Now alter the table to add 'event' type
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
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixNotificationsType();
