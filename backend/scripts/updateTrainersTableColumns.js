import db from "../config/database.js";

const updateTrainersTable = () => {
  console.log("🔧 Updating Trainers table with missing columns...");
  
  const alterTableQuery = `
    ALTER TABLE Trainers 
    ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255) AFTER bio,
    ADD COLUMN IF NOT EXISTS github_url VARCHAR(255) AFTER linkedin_url,
    ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) DEFAULT NULL AFTER status
  `;

  db.query(alterTableQuery, (err, result) => {
    if (err) {
      console.error("❌ Error updating Trainers table:", err);
      console.log("\n💡 Trying alternative approach...");
      
      // Try adding columns one by one
      addColumnsOneByOne();
      return;
    }
    console.log("✅ Trainers table updated successfully!");
    console.log("\n📋 Added columns:");
    console.log("   - linkedin_url (VARCHAR(255))");
    console.log("   - github_url (VARCHAR(255))");
    console.log("   - profile_image (VARCHAR(255))");
    process.exit(0);
  });
};

const addColumnsOneByOne = () => {
  const columns = [
    { name: 'linkedin_url', definition: 'VARCHAR(255)', after: 'bio' },
    { name: 'github_url', definition: 'VARCHAR(255)', after: 'linkedin_url' },
    { name: 'profile_image', definition: 'VARCHAR(255) DEFAULT NULL', after: 'status' }
  ];

  let completed = 0;
  let errors = [];

  columns.forEach((col, index) => {
    const query = `ALTER TABLE Trainers ADD COLUMN ${col.name} ${col.definition} AFTER ${col.after}`;
    
    db.query(query, (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`ℹ️  Column '${col.name}' already exists`);
        } else {
          console.error(`❌ Error adding '${col.name}':`, err.message);
          errors.push(col.name);
        }
      } else {
        console.log(`✅ Added column '${col.name}'`);
      }
      
      completed++;
      if (completed === columns.length) {
        if (errors.length === 0) {
          console.log("\n✅ All columns added successfully!");
        } else {
          console.log(`\n⚠️  Some columns failed: ${errors.join(', ')}`);
        }
        process.exit(errors.length === 0 ? 0 : 1);
      }
    });
  });
};

updateTrainersTable();
