import db from "../config/database.js";

const createCompanyTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Company (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50),
      industry VARCHAR(100),
      address TEXT,
      description TEXT,
      website VARCHAR(255),
      logo VARCHAR(255),
      status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.error("❌ Error creating Company table:", err);
      process.exit(1);
    }
    console.log("✅ Company table created successfully!");
    process.exit(0);
  });
};

createCompanyTable();
