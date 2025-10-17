import db from "../config/database.js";

const createUsersTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      user_type ENUM('university', 'company', 'student') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.error("❌ Error creating Users table:", err);
      process.exit(1);
    }
    console.log("✅ Users table created successfully!");
    process.exit(0);
  });
};

createUsersTable();
