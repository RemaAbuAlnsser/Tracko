import db from "../config/database.js";

console.log("🔧 Syncing emails between Users and Universities tables...\n");

// First, check current state
db.query("SELECT id, email, user_type FROM Users WHERE user_type = 'university'", (err, users) => {
  if (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
  
  console.log("📋 Current Users (university):");
  console.log(users);
  
  db.query("SELECT id, name, email FROM Universities", (err2, unis) => {
    if (err2) {
      console.error("❌ Error:", err2);
      process.exit(1);
    }
    
    console.log("\n📋 Current Universities:");
    console.log(unis);
    
    // Update Universities table to match Users table
    console.log("\n🔄 Updating Universities table to match Users table...");
    
    db.query(
      "UPDATE Universities SET email = 'najah@najah.com' WHERE id = 1",
      (err3, result) => {
        if (err3) {
          console.error("❌ Error updating:", err3);
          process.exit(1);
        }
        
        console.log("✅ Universities table updated!");
        console.log(`   Rows affected: ${result.affectedRows}`);
        
        // Verify
        db.query("SELECT id, name, email FROM Universities WHERE id = 1", (err4, final) => {
          if (err4) {
            console.error("❌ Error:", err4);
          } else {
            console.log("\n✅ Final state:");
            console.log(final[0]);
          }
          process.exit(0);
        });
      }
    );
  });
});
