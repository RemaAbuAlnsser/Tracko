import db from "../config/database.js";

const addSavedColumn = () => {
  const alterTableQuery = `
    ALTER TABLE Internship_Matches 
    ADD COLUMN saved BOOLEAN DEFAULT FALSE
  `;

  db.query(alterTableQuery, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("✅ Column 'saved' already exists in Internship_Matches table");
        process.exit(0);
      } else {
        console.error("❌ Error adding saved column:", err);
        process.exit(1);
      }
    } else {
      console.log("✅ Successfully added 'saved' column to Internship_Matches table");
      process.exit(0);
    }
  });
};

addSavedColumn();
