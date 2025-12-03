import db from "../config/database.js";

const addPhoneColumn = () => {
  console.log("🔧 Adding 'phone' column to Users table...");
  
  const alterTableQuery = `
    ALTER TABLE Users 
    ADD COLUMN phone VARCHAR(20) NULL AFTER email
  `;

  db.query(alterTableQuery, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("ℹ️  Phone column already exists!");
        process.exit(0);
      } else {
        console.error("❌ Error adding phone column:", err);
        process.exit(1);
      }
    }
    console.log("✅ Phone column added successfully!");
    process.exit(0);
  });
};

addPhoneColumn();
