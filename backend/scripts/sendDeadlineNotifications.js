import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

import { checkTaskDeadlines } from '../utils/taskDeadlineChecker.js';

console.log('📤 Manually triggering deadline notifications...\n');

checkTaskDeadlines()
  .then(result => {
    console.log('\n✅ Notifications sent successfully!');
    console.log('Result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error sending notifications:', error);
    process.exit(1);
  });
