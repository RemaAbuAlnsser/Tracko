import db from "../config/database.js";

console.log("🔧 Updating Students status column...\n");

// First, check if status column exists and its type
const checkQuery = `
  SELECT COLUMN_NAME, COLUMN_TYPE 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'Students' 
    AND COLUMN_NAME = 'status'
`;

db.query(checkQuery, (err, results) => {
  if (err) {
    console.error("❌ Error checking column:", err);
    process.exit(1);
  }

  if (results.length === 0) {
    // Column doesn't exist, create it
    console.log("📝 Status column doesn't exist, creating it...");
    const addColumnQuery = `
      ALTER TABLE Students 
      ADD COLUMN status ENUM('in_training', 'completed', 'not_started') DEFAULT 'not_started'
    `;
    
    db.query(addColumnQuery, (addErr) => {
      if (addErr) {
        console.error("❌ Error adding status column:", addErr);
        process.exit(1);
      }
      
      console.log("✅ Status column added successfully!");
      console.log("\n📋 Column details:");
      console.log("   - Type: ENUM('in_training', 'completed', 'not_started')");
      console.log("   - Default: 'not_started'");
      process.exit(0);
    });
  } else {
    // Column exists, change to VARCHAR first
    console.log("📝 Status column exists, converting to VARCHAR first...");
    
    const toVarcharQuery = `ALTER TABLE Students MODIFY COLUMN status VARCHAR(50)`;
    
    db.query(toVarcharQuery, (varcharErr) => {
      if (varcharErr) {
        console.error("❌ Error converting to VARCHAR:", varcharErr);
        process.exit(1);
      }
      
      console.log("✅ Converted to VARCHAR");
      
      // Update existing data
      const updateDataQuery = `
        UPDATE Students 
        SET status = CASE 
          WHEN status = 'active' THEN 'in_training'
          WHEN status = 'inactive' THEN 'not_started'
          ELSE 'not_started'
        END
      `;
      
      db.query(updateDataQuery, (updateErr) => {
        if (updateErr) {
          console.error("❌ Error updating existing data:", updateErr);
          process.exit(1);
        }
        
        console.log("✅ Existing data updated");
        
        // Now modify to ENUM
        const modifyQuery = `
          ALTER TABLE Students 
          MODIFY COLUMN status ENUM('in_training', 'completed', 'not_started') DEFAULT 'not_started'
        `;
        
        db.query(modifyQuery, (modifyErr) => {
          if (modifyErr) {
            console.error("❌ Error modifying status column:", modifyErr);
            process.exit(1);
          }
          
          console.log("✅ Status column updated successfully!");
          console.log("\n📋 New column details:");
          console.log("   - Type: ENUM('in_training', 'completed', 'not_started')");
          console.log("   - Default: 'not_started'");
          process.exit(0);
        });
      });
    });
  }
});
