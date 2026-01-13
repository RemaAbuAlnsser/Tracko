import cron from 'node-cron';
import { checkTaskDeadlines, checkOverdueTasks } from '../utils/taskDeadlineChecker.js';

/**
 * Setup cron jobs for task deadline notifications
 */
export function setupTaskDeadlineCron() {
  // Check for upcoming deadlines every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ Running scheduled task deadline check...');
    await checkTaskDeadlines();
  });

  // Check for overdue tasks every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ Running scheduled overdue task check...');
    await checkOverdueTasks();
  });

  console.log('✅ Task deadline cron jobs scheduled:');
  console.log('   - Upcoming deadlines: Every 15 minutes');
  console.log('   - Overdue tasks: Every 6 hours');
}
