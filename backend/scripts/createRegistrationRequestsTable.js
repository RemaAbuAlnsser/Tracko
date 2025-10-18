import db from "../config/database.js";

async function createRegistrationRequestsTable() {
  try {
    console.log("🔧 Creating Registration_Requests table...");
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS Registration_Requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        user_type ENUM('student', 'company', 'university', 'trainer') NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    db.query(createTableQuery, (err, result) => {
      if (err) {
        console.error("❌ Error creating Registration_Requests table:", err);
        process.exit(1);
      }
      
      console.log("✅ Registration_Requests table created successfully!");
      console.log("📋 Table structure:");
      console.log("   - id: PRIMARY KEY, AUTO_INCREMENT");
      console.log("   - full_name: VARCHAR(255)");
      console.log("   - email: VARCHAR(255) UNIQUE");
      console.log("   - password: VARCHAR(255)");
      console.log("   - user_type: ENUM('student', 'company', 'university', 'trainer')");
      console.log("   - status: ENUM('pending', 'approved', 'rejected')");
      console.log("   - created_at: TIMESTAMP");
      console.log("   - updated_at: TIMESTAMP");
      process.exit(0);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createRegistrationRequestsTable();
