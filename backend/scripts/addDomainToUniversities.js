import db from "../config/database.js";

console.log('🔧 Adding domain column to Universities table...\n');

// Step 1: Add domain column
db.query('ALTER TABLE Universities ADD COLUMN domain VARCHAR(255) NULL AFTER email', (err) => {
  if (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️ Domain column already exists, skipping...');
      updateDomains();
    } else {
      console.error('❌ Error adding domain column:', err);
      db.end();
    }
  } else {
    console.log('✅ Domain column added successfully');
    updateDomains();
  }
});

function updateDomains() {
  // Step 2: Update existing universities to extract domain from email
  const updateQuery = `
    UPDATE Universities 
    SET domain = SUBSTRING_INDEX(email, '@', -1) 
    WHERE email IS NOT NULL AND email != '' AND (domain IS NULL OR domain = '')
  `;
  
  db.query(updateQuery, (err, result) => {
    if (err) {
      console.error('❌ Error updating domains:', err);
    } else {
      console.log(`✅ Updated ${result.affectedRows} universities with domain`);
    }
    
    // Step 3: Show results
    db.query('SELECT id, name, email, domain FROM Universities', (err, results) => {
      if (!err) {
        console.log('\n📊 Universities with domains:');
        console.table(results);
      }
      db.end();
    });
  });
}
