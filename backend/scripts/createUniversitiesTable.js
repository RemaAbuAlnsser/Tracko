import db from "../config/database.js";

const createUniversitiesTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Universities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20),
      address TEXT,
      website VARCHAR(255),
      logo VARCHAR(255),
      coordinator_name VARCHAR(255),
      coordinator_phone VARCHAR(20)
    )
  `;

  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.error("❌ Error creating Universities table:", err);
      process.exit(1);
    }
    console.log("✅ Universities table created successfully!");
    console.log("\nTable Structure:");
    console.log("================");
    console.log("- id (INT, PRIMARY KEY, AUTO_INCREMENT)");
    console.log("- name (VARCHAR(255), NOT NULL)");
    console.log("- email (VARCHAR(255), UNIQUE, NOT NULL)");
    console.log("- phone (VARCHAR(20))");
    console.log("- address (TEXT)");
    console.log("- website (VARCHAR(255))");
    console.log("- logo (VARCHAR(255))");
    console.log("- coordinator_name (VARCHAR(255))");
    console.log("- coordinator_phone (VARCHAR(20))");
    process.exit(0);
  });
};

createUniversitiesTable();
