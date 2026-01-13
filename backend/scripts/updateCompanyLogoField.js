import db from "../config/database.js";

const updateLogoField = () => {
  const alterTableQuery = `
    ALTER TABLE Company 
    MODIFY COLUMN logo LONGTEXT
  `;

  db.query(alterTableQuery, (err, result) => {
    if (err) {
      console.error("❌ Error updating logo field:", err);
      process.exit(1);
    }
    console.log("✅ Logo field updated to LONGTEXT successfully!");
    process.exit(0);
  });
};

updateLogoField();
