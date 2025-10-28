import db from "../config/database.js";

console.log("🔧 Modifying Final_Reports table...\n");

// Drop the unwanted columns
const dropColumns = [
  "ALTER TABLE Final_Reports DROP COLUMN recommendation",
  "ALTER TABLE Final_Reports DROP COLUMN additional_comments",
  "ALTER TABLE Final_Reports DROP COLUMN areas_for_improvement",
  "ALTER TABLE Final_Reports DROP COLUMN strengths"
];

const executeQueries = async () => {
  for (const query of dropColumns) {
    try {
      await new Promise((resolve, reject) => {
        db.query(query, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      console.log(`✅ Executed: ${query.substring(0, 60)}...`);
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
    }
  }
  
  // Verify the changes
  db.query("DESCRIBE Final_Reports", (err, results) => {
    if (err) {
      console.error("❌ Error describing table:", err);
    } else {
      console.log("\n📋 Current Final_Reports table structure:");
      results.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type})`);
      });
    }
    process.exit(0);
  });
};

executeQueries();
