import db from "../config/database.js";

const addProfileImageColumn = () => {
  console.log("🔧 Adding profile_image column to Trainers table...");
  
  const alterTableQuery = `
    ALTER TABLE Trainers 
    ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL AFTER status
  `;

  db.query(alterTableQuery, (err, result) => {
    if (err) {
      // Check if column already exists
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("ℹ️ Column 'profile_image' already exists");
        process.exit(0);
      }
      console.error("❌ Error adding profile_image column:", err);
      process.exit(1);
    }
    console.log("✅ Successfully added 'profile_image' column to Trainers table!");
    console.log("📋 Trainers can now upload profile images");
    process.exit(0);
  });
};

addProfileImageColumn();
