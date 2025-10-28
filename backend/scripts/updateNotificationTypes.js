import db from "../config/database.js";

console.log("🔧 Updating notification types...\n");

const query = `
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
    'task_review',
    'final_report',
    'certificate'
  ) NOT NULL DEFAULT 'general'
`;

db.query(query, (err, result) => {
  if (err) {
    console.error("❌ Error updating notification types:", err);
    process.exit(1);
  }
  
  console.log("✅ Notification types updated successfully!");
  console.log("\n📋 New types:");
  console.log("   - appointment");
  console.log("   - submission");
  console.log("   - meeting");
  console.log("   - general");
  console.log("   - training_plan");
  console.log("   - training_report");
  console.log("   - application");
  console.log("   - task_submission");
  console.log("   - task_review");
  console.log("   - final_report ✨ NEW");
  console.log("   - certificate ✨ NEW");
  
  process.exit(0);
});
