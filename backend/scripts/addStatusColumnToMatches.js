import db from "../config/database.js";

const addStatusColumn = () => {
  const alterTableQuery = `
    ALTER TABLE Internship_Matches 
    ADD COLUMN status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending'
  `;

  db.query(alterTableQuery, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("✅ Column 'status' already exists in Internship_Matches table");
        process.exit(0);
      } else {
        console.error("❌ Error adding status column:", err);
        process.exit(1);
      }
    } else {
      console.log("✅ Successfully added 'status' column to Internship_Matches table");
      console.log("📋 Status values: pending (default), accepted, rejected");
      process.exit(0);
    }
  });
};

addStatusColumn();
