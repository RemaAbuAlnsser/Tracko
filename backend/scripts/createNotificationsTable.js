import db from "../config/database.js";

async function createNotificationsTable() {
  try {
    console.log("🔧 Creating notifications table...");
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('appointment', 'submission', 'meeting', 'general', 'training_plan', 'training_report', 'application') NOT NULL DEFAULT 'general',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_is_read (is_read),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    db.query(createTableQuery, (err, result) => {
      if (err) {
        console.error("❌ Error creating notifications table:", err);
        process.exit(1);
      }
      
      console.log("✅ notifications table created successfully!");
      console.log("📋 Table structure:");
      console.log("   - id: PRIMARY KEY, AUTO_INCREMENT");
      console.log("   - user_id: FOREIGN KEY -> Users(id)");
      console.log("   - title: VARCHAR(255)");
      console.log("   - message: TEXT");
      console.log("   - type: ENUM('appointment', 'submission', 'meeting', 'general', 'training_plan', 'training_report', 'application')");
      console.log("   - is_read: BOOLEAN (default: FALSE)");
      console.log("   - created_at: TIMESTAMP (default: CURRENT_TIMESTAMP)");
      process.exit(0);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createNotificationsTable();
