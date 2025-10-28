import db from "../config/database.js";

console.log("🔧 Updating user email to najah@najah.com...\n");

// Update the email in Users table
db.query(
  "UPDATE Users SET email = 'najah@najah.com' WHERE email = 'najah@gmail.com' AND user_type = 'university'",
  (err, result) => {
    if (err) {
      console.error("❌ Error updating Users table:", err);
      process.exit(1);
    }
    
    console.log("✅ Users table email updated successfully!");
    console.log(`   Rows affected: ${result.affectedRows}`);
    
    // Verify the change
    db.query(
      "SELECT id, email, user_type, full_name FROM Users WHERE user_type = 'university' AND email LIKE '%najah%'",
      (err2, results) => {
        if (err2) {
          console.error("❌ Error verifying:", err2);
        } else {
          console.log("\n📋 Current Users data:");
          console.log(results);
        }
        process.exit(0);
      }
    );
  }
);
