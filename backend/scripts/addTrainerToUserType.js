import db from "../config/database.js";

const addTrainerToUserType = () => {
  console.log("🔧 Adding 'trainer' to user_type ENUM...");
  
  const alterTableQuery = `
    ALTER TABLE Users 
    MODIFY COLUMN user_type ENUM('university', 'company', 'student', 'trainer') NOT NULL
  `;

  db.query(alterTableQuery, (err, result) => {
    if (err) {
      console.error("❌ Error modifying Users table:", err);
      process.exit(1);
    }
    console.log("✅ Successfully added 'trainer' to user_type ENUM!");
    console.log("📋 user_type now accepts: 'university', 'company', 'student', 'trainer'");
    process.exit(0);
  });
};

addTrainerToUserType();
