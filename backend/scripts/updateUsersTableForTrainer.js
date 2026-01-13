import db from "../config/database.js";

const updateUsersTable = () => {
  const alterTableQuery = `
    ALTER TABLE Users 
    MODIFY COLUMN user_type ENUM('university', 'company', 'student', 'trainer') NOT NULL
  `;

  db.query(alterTableQuery, (err, result) => {
    if (err) {
      console.error("❌ Error updating Users table:", err);
      process.exit(1);
    }
    console.log("✅ Users table updated successfully!");
    console.log("✅ Added 'trainer' to user_type ENUM values");
    console.log("\nNow user_type accepts: 'university', 'company', 'student', 'trainer'");
    process.exit(0);
  });
};

updateUsersTable();
