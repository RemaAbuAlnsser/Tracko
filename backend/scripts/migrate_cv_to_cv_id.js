import db from "../config/database.js";

const cleanupDatabase = () => {
  console.log("🔧 Starting database cleanup...");
  
  addCvIdColumn();
};

const addCvIdColumn = () => {
  console.log("\n➕ Adding cv_id column to Students table...");
  
  const addColumnQuery = `
    ALTER TABLE Students 
    ADD COLUMN cv_id INT DEFAULT NULL
  `;
  
  db.query(addColumnQuery, (err) => {
    if (err) {
      if (err.errno === 1060) {
        console.log("⚠️  Column cv_id already exists, skipping...");
      } else {
        console.error("❌ Error adding cv_id column:", err);
        process.exit(1);
      }
    } else {
      console.log("✅ cv_id column added successfully!");
    }
    
    dropCvFileColumn();
  });
};

const dropCvFileColumn = () => {
  console.log("\n🗑️  Dropping cv_file column from Students table...");
  
  const dropColumnQuery = `ALTER TABLE Students DROP COLUMN cv_file`;
  
  db.query(dropColumnQuery, (err) => {
    if (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY' || err.errno === 1091) {
        console.log("⚠️  Column cv_file doesn't exist, already dropped");
      } else {
        console.error("❌ Error dropping cv_file column:", err);
        process.exit(1);
      }
    } else {
      console.log("✅ cv_file column dropped successfully!");
    }
    
    dropStudentProfilesTable();
  });
};

const dropStudentProfilesTable = () => {
  console.log("\n🗑️  Dropping student_profiles table...");
  
  const dropTableQuery = `DROP TABLE IF EXISTS student_profiles`;
  
  db.query(dropTableQuery, (err) => {
    if (err) {
      console.error("❌ Error dropping student_profiles table:", err);
      process.exit(1);
    } else {
      console.log("✅ student_profiles table dropped successfully!");
    }
    
    addUniqueConstraintToCVs();
  });
};

const addUniqueConstraintToCVs = () => {
  console.log("\n🔧 Adding unique constraint to CVs table (one CV per student)...");
  
  // First, delete duplicate CVs keeping only the latest one
  const deleteDuplicatesQuery = `
    DELETE cv1 FROM CVs cv1
    INNER JOIN CVs cv2 
    WHERE cv1.student_id = cv2.student_id 
    AND cv1.uploaded_at < cv2.uploaded_at
  `;
  
  db.query(deleteDuplicatesQuery, (err, result) => {
    if (err) {
      console.error("❌ Error deleting duplicate CVs:", err);
      process.exit(1);
    } else {
      console.log(`✅ Deleted ${result.affectedRows} duplicate CV records`);
    }
    
    // Add unique constraint
    const addConstraintQuery = `
      ALTER TABLE CVs 
      ADD UNIQUE KEY unique_student_cv (student_id)
    `;
    
    db.query(addConstraintQuery, (err) => {
      if (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
          console.log("⚠️  Unique constraint already exists on CVs table");
        } else {
          console.error("❌ Error adding unique constraint:", err);
          process.exit(1);
        }
      } else {
        console.log("✅ Unique constraint added to CVs table!");
      }
      
      console.log("\n✅ Database cleanup completed successfully!");
      console.log("📋 Summary:");
      console.log("   - cv_file column removed from Students table");
      console.log("   - student_profiles table dropped");
      console.log("   - CVs table now has unique constraint (one CV per student)");
      process.exit(0);
    });
  });
};

cleanupDatabase();
