import db from "../config/database.js";

const modifyStudentsTable = () => {
  console.log("🔧 Modifying Students table...");
  
  // First, drop student_id column
  const dropColumnQuery = `ALTER TABLE Students DROP COLUMN student_id`;
  
  db.query(dropColumnQuery, (err1) => {
    if (err1 && err1.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.error("❌ Error dropping student_id column:", err1);
      process.exit(1);
    }
    
    console.log("✅ student_id column dropped (if existed)");
    
    // Now add student_img column
    const addColumnQuery = `
      ALTER TABLE Students 
      ADD COLUMN student_img VARCHAR(255) DEFAULT NULL AFTER cv_file
    `;
    
    db.query(addColumnQuery, (err2) => {
      if (err2 && err2.code !== 'ER_DUP_FIELDNAME') {
        console.error("❌ Error adding student_img column:", err2);
        process.exit(1);
      }
      
      console.log("✅ student_img column added successfully!");
      console.log("📋 Students table updated:");
      console.log("   - Removed: student_id");
      console.log("   - Added: student_img (VARCHAR(255))");
      process.exit(0);
    });
  });
};

modifyStudentsTable();
