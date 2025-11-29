import db from "../config/database.js";

console.log("🔧 Adding university_approved column to Final_Reports table...\n");

// Check if columns already exist
const checkQuery = `
  SELECT COLUMN_NAME 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'Final_Reports' 
    AND COLUMN_NAME IN ('university_approved', 'approved_at', 'approved_by')
`;

db.query(checkQuery, (err, results) => {
  if (err) {
    console.error("❌ Error checking columns:", err);
    process.exit(1);
  }

  const existingColumns = results.map(row => row.COLUMN_NAME);
  
  if (existingColumns.includes('university_approved')) {
    console.log("✅ Columns already exist!");
    console.log("\n📋 Existing columns:");
    console.log("   - university_approved (BOOLEAN, DEFAULT FALSE)");
    console.log("   - approved_at (TIMESTAMP, NULL)");
    console.log("   - approved_by (INT, NULL - university_id)");
    process.exit(0);
    return;
  }

  // Add columns
  const addColumnQuery = `
    ALTER TABLE Final_Reports 
    ADD COLUMN university_approved BOOLEAN DEFAULT FALSE,
    ADD COLUMN approved_at TIMESTAMP NULL,
    ADD COLUMN approved_by INT NULL,
    ADD INDEX idx_university_approved (university_approved)
  `;

  db.query(addColumnQuery, (err, result) => {
    if (err) {
      console.error("❌ Error adding columns:", err);
      process.exit(1);
    }
    
    console.log("✅ Columns added successfully!");
    console.log("\n📋 New columns:");
    console.log("   - university_approved (BOOLEAN, DEFAULT FALSE)");
    console.log("   - approved_at (TIMESTAMP, NULL)");
    console.log("   - approved_by (INT, NULL - university_id)");
    
    process.exit(0);
  });
});
