import db from "../config/database.js";

async function addTaskDescriptionColumn() {
  try {
    console.log("🔧 Adding task_description column to Plan_Weeks table...");
    
    // Add task_description column
    const alterTableQuery = `
      ALTER TABLE Plan_Weeks 
      ADD COLUMN task_description TEXT AFTER tasks;
    `;
    
    db.query(alterTableQuery, (err, result) => {
      if (err) {
        // Check if column already exists
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log("ℹ️  Column 'task_description' already exists");
          process.exit(0);
        } else {
          console.error("❌ Error adding column:", err);
          process.exit(1);
        }
      }
      
      console.log("✅ Column 'task_description' added successfully!");
      console.log("📋 Updated Plan_Weeks table structure:");
      console.log("   - id");
      console.log("   - plan_id");
      console.log("   - week_number");
      console.log("   - title");
      console.log("   - description");
      console.log("   - objectives");
      console.log("   - tasks");
      console.log("   - task_description ✨ NEW");
      console.log("   - resources");
      console.log("   - deliverables");
      console.log("   - created_at");
      console.log("   - updated_at");
      
      process.exit(0);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

addTaskDescriptionColumn();
