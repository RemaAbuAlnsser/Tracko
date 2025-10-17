import db from "../config/database.js";

console.log("🔍 Checking Users table...\n");

const query = "SELECT * FROM Users";

db.query(query, (err, results) => {
  if (err) {
    console.error("❌ Error querying database:", err);
    process.exit(1);
  }
  
  console.log(`📊 Total users in database: ${results.length}\n`);
  
  if (results.length > 0) {
    console.log("Users:");
    results.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user.id}`);
      console.log(`   Name: ${user.full_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Type: ${user.user_type}`);
      console.log(`   Created: ${user.created_at}`);
    });
  } else {
    console.log("⚠️  No users found in database");
  }
  
  process.exit(0);
});
