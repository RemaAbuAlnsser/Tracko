import db from "../config/database.js";

async function updateNotificationsType() {
  try {
    console.log("🔧 Updating notifications table type column...");
    
    // Modify the type column to include new values
    const alterTableQuery = `
      ALTER TABLE notifications 
      MODIFY COLUMN type ENUM('appointment', 'submission', 'meeting', 'general', 'training_plan', 'training_report', 'application') 
      NOT NULL DEFAULT 'general';
    `;
    
    db.query(alterTableQuery, (err, result) => {
      if (err) {
        console.error("❌ Error updating notifications table:", err);
        process.exit(1);
      }
      
      console.log("✅ notifications table updated successfully!");
      console.log("📋 Updated type column values:");
      console.log("   - appointment");
      console.log("   - submission");
      console.log("   - meeting");
      console.log("   - general");
      console.log("   - training_plan ✨ NEW");
      console.log("   - training_report ✨ NEW");
      console.log("   - application ✨ NEW");
      
      process.exit(0);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

updateNotificationsType();
