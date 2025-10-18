import db from "../config/database.js";

const clearMatchesTable = () => {
  console.log("🧹 Clearing Internship_Matches table...");
  
  const clearQuery = "TRUNCATE TABLE Internship_Matches";
  
  db.query(clearQuery, (err) => {
    if (err) {
      console.error("❌ Error clearing table:", err);
      process.exit(1);
    }
    
    console.log("✅ Internship_Matches table cleared successfully!");
    process.exit(0);
  });
};

clearMatchesTable();
