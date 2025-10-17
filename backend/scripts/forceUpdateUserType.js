import db from "../config/database.js";

const forceUpdateUserType = () => {
  console.log("🔧 Force updating user_type ENUM...");
  
  // First, drop the column
  const dropQuery = `ALTER TABLE Users DROP COLUMN user_type`;
  
  db.query(dropQuery, (err1) => {
    if (err1) {
      console.error("⚠️ Error dropping column (might not exist):", err1.message);
    }
    
    // Then add it back with all values
    const addQuery = `
      ALTER TABLE Users 
      ADD COLUMN user_type ENUM('university', 'company', 'student', 'trainer') NOT NULL 
      AFTER password
    `;
    
    db.query(addQuery, (err2, result) => {
      if (err2) {
        console.error("❌ Error adding column:", err2);
        process.exit(1);
      }
      console.log("✅ user_type column recreated successfully!");
      console.log("📋 Now accepts: 'university', 'company', 'student', 'trainer'");
      process.exit(0);
    });
  });
};

forceUpdateUserType();
