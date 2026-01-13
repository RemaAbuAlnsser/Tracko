import db from "../config/database.js";

const createInternshipTrainersTable = () => {
  console.log("🔧 Creating Internship_Trainers table...");
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Internship_Trainers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      internship_id INT NOT NULL,
      trainer_id INT NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (internship_id) REFERENCES Internships(id) ON DELETE CASCADE,
      FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE CASCADE,
      UNIQUE KEY unique_internship_trainer (internship_id, trainer_id)
    )
  `;

  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.error("❌ Error creating Internship_Trainers table:", err);
      process.exit(1);
    }
    console.log("✅ Internship_Trainers table created successfully!");
    console.log("📋 Table Structure:");
    console.log("   - id (INT, PRIMARY KEY, AUTO_INCREMENT)");
    console.log("   - internship_id (INT, FOREIGN KEY -> Internship.id)");
    console.log("   - trainer_id (INT, FOREIGN KEY -> Trainers.id)");
    console.log("   - assigned_at (TIMESTAMP)");
    console.log("   - UNIQUE constraint on (internship_id, trainer_id)");
    process.exit(0);
  });
};

createInternshipTrainersTable();
