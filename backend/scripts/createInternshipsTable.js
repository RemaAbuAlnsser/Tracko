import db from "../config/database.js";

const createInternshipsTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Internships (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      requirements TEXT,
      specialization VARCHAR(100),
      capacity INT DEFAULT 1,
      status ENUM('open', 'closed', 'pending') DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES Company(id) ON DELETE CASCADE
    )
  `;

  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.error("❌ Error creating Internships table:", err);
      process.exit(1);
    }
    console.log("✅ Internships table created successfully!");
    console.log("\nTable Structure:");
    console.log("================");
    console.log("- id (INT, PRIMARY KEY, AUTO_INCREMENT)");
    console.log("- company_id (INT, FOREIGN KEY -> Company.id)");
    console.log("- title (VARCHAR(255), NOT NULL)");
    console.log("- description (TEXT)");
    console.log("- requirements (TEXT)");
    console.log("- specialization (VARCHAR(100))");
    console.log("- capacity (INT, DEFAULT 1)");
    console.log("- status (ENUM: 'open', 'closed', 'pending', DEFAULT 'open')");
    console.log("- created_at (TIMESTAMP)");
    console.log("- updated_at (TIMESTAMP)");
    console.log("\n✅ Foreign Key: company_id references Company(id) with CASCADE delete");
    process.exit(0);
  });
};

createInternshipsTable();
