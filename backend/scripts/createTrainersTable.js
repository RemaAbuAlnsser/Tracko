import db from "../config/database.js";

const createTrainersTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Trainers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      internship_id INT,
      user_id INT NOT NULL,
      specialization VARCHAR(255),
      experience_years INT,
      bio TEXT,
      hourly_rate DECIMAL(10, 2),
      max_trainees INT DEFAULT 5,
      status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES Company(id) ON DELETE CASCADE,
      FOREIGN KEY (internship_id) REFERENCES Internships(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    )
  `;

  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.error("❌ Error creating Trainers table:", err);
      process.exit(1);
    }
    console.log("✅ Trainers table created successfully!");
    console.log("\nTable Structure:");
    console.log("================");
    console.log("- id (INT, PRIMARY KEY, AUTO_INCREMENT)");
    console.log("- company_id (INT, FOREIGN KEY -> Company.id)");
    console.log("- internship_id (INT, FOREIGN KEY -> Internships.id, NULLABLE)");
    console.log("- user_id (INT, FOREIGN KEY -> Users.id)");
    console.log("- specialization (VARCHAR(255))");
    console.log("- experience_years (INT)");
    console.log("- bio (TEXT)");
    console.log("- hourly_rate (DECIMAL(10, 2))");
    console.log("- max_trainees (INT, DEFAULT 5)");
    console.log("- status (ENUM: 'active', 'inactive', 'pending', DEFAULT 'active')");
    console.log("- created_at (TIMESTAMP)");
    console.log("- updated_at (TIMESTAMP)");
    console.log("\n✅ Foreign Keys:");
    console.log("   - company_id references Company(id) with CASCADE delete");
    console.log("   - internship_id references Internships(id) with SET NULL delete");
    console.log("   - user_id references Users(id) with CASCADE delete");
    process.exit(0);
  });
};

createTrainersTable();
