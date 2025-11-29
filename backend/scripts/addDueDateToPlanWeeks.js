import db from "../config/database.js";

async function addDueDateColumn() {
  try {
    console.log("🔧 Adding due_date column to Plan_Weeks table...");
    
    // Add due_date column
    const alterTableQuery = `
      ALTER TABLE Plan_Weeks 
      ADD COLUMN due_date DATETIME AFTER deliverables;
    `;
    
    db.query(alterTableQuery, (err, result) => {
      if (err) {
        // Check if column already exists
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log("ℹ️  Column 'due_date' already exists");
          process.exit(0);
        } else {
          console.error("❌ Error adding column:", err);
          process.exit(1);
        }
      }
      
      console.log("✅ Column 'due_date' added successfully!");
      console.log("📋 Updated Plan_Weeks table structure:");
      console.log("   - id");
      console.log("   - plan_id");
      console.log("   - week_number");
      console.log("   - title");
      console.log("   - description");
      console.log("   - objectives");
      console.log("   - tasks");
      console.log("   - task_description");
      console.log("   - resources");
      console.log("   - deliverables");
      console.log("   - due_date ✨ NEW");
      console.log("   - created_at");
      console.log("   - updated_at");
      
      process.exit(0);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

addDueDateColumn();
