import db from "../config/database.js";

console.log("🔧 Creating Final_Reports table...");

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS Final_Reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NOT NULL,
    student_id INT NOT NULL,
    internship_id INT,
    overall_performance TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,
    technical_skills_rating INT CHECK (technical_skills_rating BETWEEN 1 AND 5),
    communication_rating INT CHECK (communication_rating BETWEEN 1 AND 5),
    teamwork_rating INT CHECK (teamwork_rating BETWEEN 1 AND 5),
    problem_solving_rating INT CHECK (problem_solving_rating BETWEEN 1 AND 5),
    attendance_rating INT CHECK (attendance_rating BETWEEN 1 AND 5),
    overall_rating DECIMAL(3, 2),
    recommendation TEXT,
    additional_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
    FOREIGN KEY (internship_id) REFERENCES Internships(id) ON DELETE SET NULL,
    UNIQUE KEY unique_report (trainer_id, student_id, internship_id)
  )
`;

db.query(createTableQuery, (err, result) => {
  if (err) {
    console.error("❌ Error creating Final_Reports table:", err);
    process.exit(1);
  }
  
  console.log("✅ Final_Reports table created successfully!");
  console.log("\n📋 Table Structure:");
  console.log("   - id (INT, PRIMARY KEY, AUTO_INCREMENT)");
  console.log("   - trainer_id (INT, FOREIGN KEY -> Trainers.id)");
  console.log("   - student_id (INT, FOREIGN KEY -> Students.id)");
  console.log("   - internship_id (INT, FOREIGN KEY -> Internships.id)");
  console.log("   - overall_performance (TEXT)");
  console.log("   - strengths (TEXT)");
  console.log("   - areas_for_improvement (TEXT)");
  console.log("   - technical_skills_rating (INT 1-5)");
  console.log("   - communication_rating (INT 1-5)");
  console.log("   - teamwork_rating (INT 1-5)");
  console.log("   - problem_solving_rating (INT 1-5)");
  console.log("   - attendance_rating (INT 1-5)");
  console.log("   - overall_rating (DECIMAL)");
  console.log("   - recommendation (TEXT)");
  console.log("   - additional_comments (TEXT)");
  console.log("   - created_at (TIMESTAMP)");
  console.log("   - updated_at (TIMESTAMP)");
  
  process.exit(0);
});
