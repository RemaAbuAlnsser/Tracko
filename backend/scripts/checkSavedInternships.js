import db from "../config/database.js";

const checkSavedInternships = async () => {
  console.log("🔍 Checking Saved Internships...\n");
  
  try {
    // Check all records for student 12
    const allRecordsQuery = `
      SELECT * FROM Internship_Matches 
      WHERE student_id = 12
    `;
    
    const allRecords = await new Promise((resolve, reject) => {
      db.query(allRecordsQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log(`📊 All records for student 12: ${allRecords.length}`);
    console.log(allRecords);
    
    // Check saved records
    const savedRecordsQuery = `
      SELECT * FROM Internship_Matches 
      WHERE student_id = 12 AND saved = TRUE
    `;
    
    const savedRecords = await new Promise((resolve, reject) => {
      db.query(savedRecordsQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log(`\n💾 Saved records for student 12: ${savedRecords.length}`);
    console.log(savedRecords);
    
    // Check the saved column type
    const columnInfoQuery = `
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Internship_Matches'
        AND COLUMN_NAME = 'saved'
    `;
    
    const columnInfo = await new Promise((resolve, reject) => {
      db.query(columnInfoQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log(`\n📋 Column info for 'saved':`);
    console.log(columnInfo);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkSavedInternships();
