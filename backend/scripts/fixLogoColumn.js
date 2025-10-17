import db from "../config/database.js";

console.log("🔧 Fixing logo column in Company table...\n");

// First, check current column type
const checkQuery = "SHOW COLUMNS FROM Company LIKE 'logo'";

db.query(checkQuery, (err, results) => {
  if (err) {
    console.error("❌ Error checking column:", err);
    process.exit(1);
  }

  console.log("Current logo column type:", results[0]?.Type || "Not found");

  // Update to LONGTEXT
  const alterQuery = "ALTER TABLE Company MODIFY COLUMN logo LONGTEXT";

  db.query(alterQuery, (err, result) => {
    if (err) {
      console.error("❌ Error updating logo column:", err);
      process.exit(1);
    }
    
    console.log("✅ Logo column updated to LONGTEXT successfully!");
    
    // Verify the change
    db.query(checkQuery, (err, results) => {
      if (err) {
        console.error("❌ Error verifying column:", err);
        process.exit(1);
      }
      
      console.log("New logo column type:", results[0]?.Type);
      console.log("\n✅ All done! You can now upload logos.");
      process.exit(0);
    });
  });
});
