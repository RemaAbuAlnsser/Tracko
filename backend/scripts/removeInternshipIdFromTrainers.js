import db from "../config/database.js";

const removeInternshipIdColumn = () => {
  console.log("🔧 Removing internship_id column from Trainers table...");
  
  // First check if column exists
  const checkQuery = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Trainers' 
    AND COLUMN_NAME = 'internship_id'
  `;

  db.query(checkQuery, (err, results) => {
    if (err) {
      console.error("❌ Error checking column:", err);
      process.exit(1);
    }

    if (results.length === 0) {
      console.log("ℹ️  Column 'internship_id' does not exist in Trainers table");
      console.log("✅ No action needed");
      process.exit(0);
      return;
    }

    // Column exists, first drop foreign key constraint
    console.log("🔧 Dropping foreign key constraint...");
    const dropFKQuery = `ALTER TABLE Trainers DROP FOREIGN KEY trainers_ibfk_2`;

    db.query(dropFKQuery, (err2, result) => {
      if (err2 && err2.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.error("❌ Error dropping foreign key:", err2);
        process.exit(1);
      }
      
      console.log("✅ Foreign key constraint dropped");
      
      // Now drop the column
      const alterTableQuery = `ALTER TABLE Trainers DROP COLUMN internship_id`;

      db.query(alterTableQuery, (err3, result2) => {
        if (err3) {
          console.error("❌ Error removing internship_id column:", err3);
          process.exit(1);
        }
        console.log("✅ Successfully removed internship_id column from Trainers table!");
        console.log("📋 Now using Internship_Trainers table for many-to-many relationship");
        console.log("   - One trainer can supervise multiple internships");
        console.log("   - One internship can have multiple trainers");
        process.exit(0);
      });
    });
  });
};

removeInternshipIdColumn();
