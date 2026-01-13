import db from "../config/database.js";

const createStudentsTable = () => {
  console.log("🔧 Creating Students table...");
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      university_id INT DEFAULT NULL,
      student_id VARCHAR(50) DEFAULT NULL,
      major VARCHAR(100) DEFAULT NULL,
      academic_year VARCHAR(20) DEFAULT NULL,
      gpa DECIMAL(3, 2) DEFAULT NULL,
      cv_file VARCHAR(255) DEFAULT NULL,
      skills TEXT DEFAULT NULL,
      status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
      FOREIGN KEY (university_id) REFERENCES Universities(id) ON DELETE SET NULL,
      UNIQUE KEY unique_user (user_id)
    )
  `;

  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.error("❌ Error creating Students table:", err);
      process.exit(1);
    }
    console.log("✅ Students table created successfully!");
    console.log("📋 Table Structure:");
    console.log("   - id (INT, PRIMARY KEY, AUTO_INCREMENT)");
    console.log("   - user_id (INT, FOREIGN KEY -> Users.id)");
    console.log("   - university_id (INT, FOREIGN KEY -> Universities.id)");
    console.log("   - student_id (VARCHAR(50))");
    console.log("   - major (VARCHAR(100))");
    console.log("   - academic_year (VARCHAR(20))");
    console.log("   - gpa (DECIMAL(3, 2))");
    console.log("   - cv_file (VARCHAR(255))");
    console.log("   - skills (TEXT)");
    console.log("   - status (ENUM: active, inactive, graduated)");
    console.log("   - created_at (TIMESTAMP)");
    console.log("   - updated_at (TIMESTAMP)");
    process.exit(0);
  });
};

createStudentsTable();
