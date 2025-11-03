import express from 'express';
import { checkTaskDeadlines, checkOverdueTasks } from '../utils/taskDeadlineChecker.js';

const router = express.Router();

// Manual trigger for checking deadlines (for testing or admin use)
router.post('/check-deadlines', async (req, res) => {
  try {
    const result = await checkTaskDeadlines();
    res.json(result);
  } catch (error) {
    console.error('Error checking deadlines:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Manual trigger for checking overdue tasks
router.post('/check-overdue', async (req, res) => {
  try {
    const result = await checkOverdueTasks();
    res.json(result);
  } catch (error) {
    console.error('Error checking overdue tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Check both deadlines and overdue tasks
router.post('/check-all', async (req, res) => {
  try {
    const deadlineResult = await checkTaskDeadlines();
    const overdueResult = await checkOverdueTasks();
    
    res.json({
      success: true,
      deadlines: deadlineResult,
      overdue: overdueResult
    });
  } catch (error) {
    console.error('Error checking tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
