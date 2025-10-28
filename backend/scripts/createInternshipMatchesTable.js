import db from "../config/database.js";

const createInternshipMatchesTable = () => {
  console.log("🔧 Creating Internship_Matches table...");
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Internship_Matches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      internship_id INT NOT NULL,
      match_percentage DECIMAL(5,2) NOT NULL,
      matched_skills JSON DEFAULT NULL,
      matched_categories JSON DEFAULT NULL,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
      FOREIGN KEY (internship_id) REFERENCES Internships(id) ON DELETE CASCADE,
      UNIQUE KEY unique_match (student_id, internship_id),
      INDEX idx_student_id (student_id),
      INDEX idx_internship_id (internship_id),
      INDEX idx_match_percentage (match_percentage)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  db.query(createTableQuery, (err) => {
    if (err) {
      console.error("❌ Error creating Internship_Matches table:", err);
      process.exit(1);
    }
    
    console.log("✅ Internship_Matches table created successfully!");
    console.log("📋 Table structure:");
    console.log("   - id (Primary Key)");
    console.log("   - student_id (Foreign Key -> Students)");
    console.log("   - internship_id (Foreign Key -> Internships)");
    console.log("   - match_percentage (DECIMAL)");
    console.log("   - matched_skills (JSON)");
    console.log("   - matched_categories (JSON)");
    console.log("   - last_updated (TIMESTAMP)");
    console.log("   - created_at (TIMESTAMP)");
    process.exit(0);
  });
};

createInternshipMatchesTable();
