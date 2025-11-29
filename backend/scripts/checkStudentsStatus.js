import db from "../config/database.js";

console.log("🔍 Checking Students status values...\n");

const query = `
  SELECT DISTINCT status 
  FROM Students
`;

db.query(query, (err, results) => {
  if (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
  
  console.log("📋 Current status values:");
  results.forEach(row => {
    console.log(`   - "${row.status}"`);
  });
  
  process.exit(0);
});
