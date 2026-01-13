import db from "../config/database.js";

console.log("🔧 Updating university email...\n");

// Update the email from najah@najah.com to najah@gmail.com
db.query(
  "UPDATE Universities SET email = 'najah@gmail.com' WHERE email = 'najah@najah.com'",
  (err, result) => {
    if (err) {
      console.error("❌ Error updating email:", err);
      process.exit(1);
    }
    
    console.log("✅ Email updated successfully!");
    console.log(`   Rows affected: ${result.affectedRows}`);
    
    // Also update in Users table if exists
    db.query(
      "UPDATE Users SET email = 'najah@gmail.com' WHERE email = 'najah@najah.com' AND user_type = 'university'",
      (err2, result2) => {
        if (err2) {
          console.error("❌ Error updating Users table:", err2);
        } else {
          console.log("✅ Users table updated!");
          console.log(`   Rows affected: ${result2.affectedRows}`);
        }
        
        // Verify the change
        db.query("SELECT id, name, email FROM Universities WHERE id = 1", (err3, results) => {
          if (err3) {
            console.error("❌ Error verifying:", err3);
          } else {
            console.log("\n📋 Current university data:");
            console.log(results[0]);
          }
          process.exit(0);
        });
      }
    );
  }
);
