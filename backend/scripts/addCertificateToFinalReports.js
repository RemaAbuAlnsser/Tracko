import db from "../config/database.js";

console.log("🔧 Adding certificate column to Final_Reports table...\n");

// Check if column already exists
const checkQuery = `
  SELECT COLUMN_NAME 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'Final_Reports' 
    AND COLUMN_NAME = 'certificate_file'
`;

db.query(checkQuery, (err, results) => {
  if (err) {
    console.error("❌ Error checking column:", err);
    process.exit(1);
  }

  if (results.length > 0) {
    console.log("✅ Certificate column already exists!");
    process.exit(0);
    return;
  }

  // Add certificate column
  const addColumnQuery = `
    ALTER TABLE Final_Reports 
    ADD COLUMN certificate_file VARCHAR(255) NULL,
    ADD COLUMN certificate_uploaded_at TIMESTAMP NULL
  `;

  db.query(addColumnQuery, (err, result) => {
    if (err) {
      console.error("❌ Error adding certificate column:", err);
      process.exit(1);
    }
    
    console.log("✅ Certificate column added successfully!");
    console.log("\n📋 New columns:");
    console.log("   - certificate_file (VARCHAR(255), NULL)");
    console.log("   - certificate_uploaded_at (TIMESTAMP, NULL)");
    
    process.exit(0);
  });
});
