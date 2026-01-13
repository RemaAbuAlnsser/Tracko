import db from "../config/database.js";

const checkUserTypeEnum = () => {
  console.log("🔍 Checking current user_type ENUM values...");
  
  const query = `
    SELECT COLUMN_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Users' 
    AND COLUMN_NAME = 'user_type'
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error checking ENUM:", err);
      process.exit(1);
    }
    console.log("📋 Current user_type definition:", results[0].COLUMN_TYPE);
    process.exit(0);
  });
};

checkUserTypeEnum();
