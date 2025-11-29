import db from "../config/database.js";

async function updateNotificationsTypeEnum() {
  try {
    console.log("🔧 Updating notifications table type column...");
    
    const alterTableQuery = `
      ALTER TABLE notifications 
      MODIFY COLUMN type ENUM(
        'appointment', 
        'submission', 
        'meeting', 
        'general', 
        'training_plan', 
        'training_report', 
        'application',
        'task_submission',
        'task_review'
      ) NOT NULL DEFAULT 'general';
    `;
    
    db.query(alterTableQuery, (err, result) => {
      if (err) {
        console.error("❌ Error updating notifications table:", err);
        process.exit(1);
      }
      
      console.log("✅ notifications table updated successfully!");
      console.log("📋 New type ENUM values:");
      console.log("   - appointment");
      console.log("   - submission");
      console.log("   - meeting");
      console.log("   - general");
      console.log("   - training_plan");
      console.log("   - training_report");
      console.log("   - application");
      console.log("   - task_submission ✨ (NEW)");
      console.log("   - task_review ✨ (NEW)");
      process.exit(0);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

updateNotificationsTypeEnum();
