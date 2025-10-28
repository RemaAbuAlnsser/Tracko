import db from "../config/database.js";

async function updateNotificationsType() {
  console.log("🔧 Updating Notifications table type column...");

  try {
    // First, update any existing invalid types to 'general'
    console.log("📝 Step 1: Cleaning up invalid notification types...");
    const cleanupQuery = `
      UPDATE notifications 
      SET type = 'general' 
      WHERE type NOT IN (
        'general', 'task_submission', 'task_review', 
        'plan_assigned', 'schedule', 'message', 'application'
      )
    `;
    
    await new Promise((resolve, reject) => {
      db.query(cleanupQuery, (err, result) => {
        if (err) reject(err);
        else {
          console.log(`✅ Updated ${result.affectedRows} notifications to 'general'`);
          resolve();
        }
      });
    });

    // Now update the ENUM to include new types
    console.log("📝 Step 2: Updating type column ENUM...");
    const updateQuery = `
      ALTER TABLE notifications 
      MODIFY COLUMN type ENUM(
        'general',
        'task_submission',
        'task_review',
        'weekly_report',
        'weekly_report_review',
        'plan_assigned',
        'schedule',
        'message',
        'application',
        'training_complete'
      ) DEFAULT 'general'
    `;

    await new Promise((resolve, reject) => {
      db.query(updateQuery, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log("✅ Notifications type column updated successfully!");
    console.log("✅ Added support for: weekly_report, weekly_report_review");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating notifications type:", error);
    process.exit(1);
  }
}

updateNotificationsType();
