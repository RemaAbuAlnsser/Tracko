import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

import db from '../config/database.js';

console.log('🔧 Fixing notifications type column...\n');

// Check current column definition
const checkQuery = `
  SHOW COLUMNS FROM notifications WHERE Field = 'type'
`;

db.query(checkQuery, (err, results) => {
  if (err) {
    console.error('❌ Error checking column:', err);
    process.exit(1);
  }
  
  console.log('📋 Current column definition:');
  console.log(results[0]);
  console.log('');
  
  // Modify column to VARCHAR(50)
  const modifyQuery = `
    ALTER TABLE notifications 
    MODIFY COLUMN type VARCHAR(50) DEFAULT 'general'
  `;
  
  console.log('🔧 Modifying column to VARCHAR(50)...');
  
  db.query(modifyQuery, (err, result) => {
    if (err) {
      console.error('❌ Error modifying column:', err);
      process.exit(1);
    }
    
    console.log('✅ Column modified successfully!');
    
    // Verify the change
    db.query(checkQuery, (err, results) => {
      if (err) {
        console.error('❌ Error verifying:', err);
        process.exit(1);
      }
      
      console.log('\n📋 New column definition:');
      console.log(results[0]);
      console.log('\n✅ All done!');
      process.exit(0);
    });
  });
});
