import db from "../config/database.js";

const testTrainerInsert = () => {
  console.log("🧪 Testing trainer insert...");
  
  const query = `
    INSERT INTO Users (full_name, email, password, user_type) 
    VALUES ('Test Trainer', 'test_trainer_${Date.now()}@test.com', 'hashedpass', 'trainer')
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("❌ Error inserting trainer:", err);
      process.exit(1);
    }
    console.log("✅ Trainer inserted successfully!");
    console.log("📋 Insert ID:", result.insertId);
    
    // Clean up - delete the test user
    db.query(`DELETE FROM Users WHERE id = ?`, [result.insertId], (err2) => {
      if (err2) {
        console.error("⚠️ Could not delete test user");
      } else {
        console.log("🧹 Test user cleaned up");
      }
      process.exit(0);
    });
  });
};

testTrainerInsert();
