import db from "../config/database.js";

const createCVsTable = () => {
  console.log("🔧 Creating CVs table...");
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS CVs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      cv_file VARCHAR(255) NOT NULL,
      analysis_data JSON DEFAULT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
      INDEX idx_student_id (student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  db.query(createTableQuery, (err) => {
    if (err) {
      console.error("❌ Error creating CVs table:", err);
      process.exit(1);
    }
    
    console.log("✅ CVs table created successfully!");
    console.log("📋 Table structure:");
    console.log("   - id (Primary Key)");
    console.log("   - student_id (Foreign Key -> Students)");
    console.log("   - cv_file (VARCHAR(255))");
    console.log("   - analysis_data (JSON)");
    console.log("   - uploaded_at (TIMESTAMP)");
    process.exit(0);
  });
};

createCVsTable();
