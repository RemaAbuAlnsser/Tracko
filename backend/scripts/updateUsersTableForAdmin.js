import db from "../config/database.js";

async function updateUsersTable() {
  try {
    console.log("🔧 Updating Users table to include 'admin' user type...");
    
    // Modify the user_type ENUM to include 'admin'
    const alterQuery = `
      ALTER TABLE Users 
      MODIFY COLUMN user_type ENUM('university', 'company', 'student', 'trainer', 'admin') NOT NULL
    `;
    
    db.query(alterQuery, (err, result) => {
      if (err) {
        console.error("❌ Error updating Users table:", err);
        process.exit(1);
      }
      
      console.log("✅ Users table updated successfully!");
      console.log("ℹ️ Now you can run: node scripts/createAdmin.js");
      process.exit(0);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

updateUsersTable();
