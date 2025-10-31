import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

import db from '../config/database.js';

console.log('🗑️  Clearing all notifications...\n');

// First, count existing notifications
const countQuery = 'SELECT COUNT(*) as total FROM notifications';

db.query(countQuery, (err, results) => {
  if (err) {
    console.error('❌ Error counting notifications:', err);
    process.exit(1);
  }
  
  const total = results[0].total;
  console.log(`📊 Found ${total} notifications in database\n`);
  
  if (total === 0) {
    console.log('✅ Table is already empty!');
    process.exit(0);
  }
  
  // Delete all notifications
  const deleteQuery = 'DELETE FROM notifications';
  
  console.log('🗑️  Deleting all notifications...');
  
  db.query(deleteQuery, (err, result) => {
    if (err) {
      console.error('❌ Error deleting notifications:', err);
      process.exit(1);
    }
    
    console.log(`✅ Successfully deleted ${result.affectedRows} notifications!`);
    console.log('\n📊 Table is now empty.');
    
    // Verify
    db.query(countQuery, (err, results) => {
      if (err) {
        console.error('❌ Error verifying:', err);
        process.exit(1);
      }
      
      console.log(`✅ Verification: ${results[0].total} notifications remaining\n`);
      process.exit(0);
    });
  });
});
