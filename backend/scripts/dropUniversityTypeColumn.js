import db from "../config/database.js";

const dropUniversityTypeColumn = () => {
  const alterTableQuery = "ALTER TABLE Universities DROP COLUMN university_type";
  
  db.query(alterTableQuery, (err, result) => {
    if (err) {
      console.error("❌ Error dropping university_type column:", err);
      process.exit(1);
    }
    console.log("✅ university_type column dropped successfully!");
    console.log("\n📋 Updated Table Structure:");
    console.log("===========================");
    console.log("- id (INT, PRIMARY KEY, AUTO_INCREMENT)");
    console.log("- name (VARCHAR(255), NOT NULL)");
    console.log("- email (VARCHAR(255), UNIQUE, NOT NULL)");
    console.log("- phone (VARCHAR(20))");
    console.log("- address (TEXT)");
    console.log("- website (VARCHAR(255))");
    console.log("- logo (VARCHAR(255))");
    console.log("- coordinator_name (VARCHAR(255))");
    console.log("- coordinator_phone (VARCHAR(20))");
    console.log("\n✅ Removed: university_type column");
    process.exit(0);
  });
};

dropUniversityTypeColumn();
