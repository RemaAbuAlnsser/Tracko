import db from "../config/database.js";

const addAppliedColumn = () => {
  const alterTableQuery = `
    ALTER TABLE Internship_Matches 
    ADD COLUMN applied BOOLEAN DEFAULT FALSE,
    ADD COLUMN applied_at TIMESTAMP NULL
  `;

  db.query(alterTableQuery, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("✅ Column 'applied' already exists in Internship_Matches table");
        process.exit(0);
      } else {
        console.error("❌ Error adding applied column:", err);
        process.exit(1);
      }
    } else {
      console.log("✅ Successfully added 'applied' and 'applied_at' columns to Internship_Matches table");
      process.exit(0);
    }
  });
};

addAppliedColumn();
