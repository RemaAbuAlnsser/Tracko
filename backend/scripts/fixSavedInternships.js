import db from "../config/database.js";

const fixSavedInternships = async () => {
  console.log("🔧 Fixing Saved Internships table...");
  
  try {
    // Check if unique key exists
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM information_schema.STATISTICS 
      WHERE table_schema = DATABASE()
        AND table_name = 'Internship_Matches'
        AND index_name = 'unique_student_internship'
    `;
    
    const [checkResult] = await new Promise((resolve, reject) => {
      db.query(checkQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (checkResult.count === 0) {
      console.log("➕ Adding unique key on (student_id, internship_id)...");
      
      const addUniqueKeyQuery = `
        ALTER TABLE Internship_Matches
        ADD UNIQUE KEY unique_student_internship (student_id, internship_id)
      `;
      
      await new Promise((resolve, reject) => {
        db.query(addUniqueKeyQuery, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      console.log("✅ Unique key added successfully!");
    } else {
      console.log("ℹ️  Unique key already exists");
    }
    
    // Test the save functionality
    console.log("\n🧪 Testing save functionality...");
    console.log("Run this query manually to test:");
    console.log("INSERT INTO Internship_Matches (student_id, internship_id, saved, match_percentage)");
    console.log("VALUES (12, 5, TRUE, 0)");
    console.log("ON DUPLICATE KEY UPDATE saved = TRUE;");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

fixSavedInternships();
