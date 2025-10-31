import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

import db from '../config/database.js';

console.log('📊 Checking notifications in database...\n');

const query = `
  SELECT 
    n.id,
    n.user_id,
    u.full_name,
    n.title,
    n.message,
    n.type,
    n.is_read,
    n.created_at
  FROM notifications n
  JOIN Users u ON n.user_id = u.id
  WHERE n.type = 'task_deadline'
  ORDER BY n.created_at DESC
  LIMIT 20
`;

db.query(query, (err, results) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
  
  console.log(`✅ Found ${results.length} task deadline notifications:\n`);
  
  results.forEach((n, index) => {
    console.log(`${index + 1}. 📬 Notification #${n.id}`);
    console.log(`   To: ${n.full_name} (user_id: ${n.user_id})`);
    console.log(`   Title: ${n.title}`);
    console.log(`   Message: ${n.message.substring(0, 80)}...`);
    console.log(`   Read: ${n.is_read ? '✅ Yes' : '❌ No'}`);
    console.log(`   Created: ${n.created_at}\n`);
  });
  
  console.log('✅ Check complete!');
  process.exit(0);
});
