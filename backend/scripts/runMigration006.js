import db from "../config/database.js";

console.log('🔄 Running migration: Add coordinator_name to Company table...');

const migrationQuery = `
  ALTER TABLE Company
  ADD COLUMN coordinator_name VARCHAR(255) DEFAULT NULL COMMENT 'Training coordinator name for the company';
`;

db.query(migrationQuery, (err, result) => {
  if (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Column coordinator_name already exists!');
    } else {
      console.error('❌ Migration failed:', err);
    }
    process.exit(1);
  }
  
  console.log('✅ Migration completed successfully!');
  console.log('✅ Added column: coordinator_name VARCHAR(255)');
  
  // Verify the column was added
  db.query('DESCRIBE Company', (err, results) => {
    if (err) {
      console.error('❌ Error verifying migration:', err);
      process.exit(1);
    }
    
    console.log('\n📋 Company table structure:');
    console.log('====================================');
    results.forEach(row => {
      if (row.Field === 'coordinator_name') {
        console.log(`✓ ${row.Field} - ${row.Type} - ${row.Null} - ${row.Key} - ${row.Default}`);
      }
    });
    console.log('====================================\n');
    
    process.exit(0);
  });
});
