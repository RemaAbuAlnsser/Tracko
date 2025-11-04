import db from '../config/database.js';

console.log('🔧 Removing trainer columns from Weekly_Reports table...');

// Check which columns exist
const checkColumnsQuery = `
  SELECT COLUMN_NAME 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'tracko_db' 
  AND TABLE_NAME = 'Weekly_Reports' 
  AND COLUMN_NAME IN ('trainer_id', 'trainer_comment', 'university_reviewed_at')
`;

db.query(checkColumnsQuery, (err, results) => {
  if (err) {
    console.error('❌ Error checking columns:', err);
    process.exit(1);
  }
  
  const existingColumns = results.map(row => row.COLUMN_NAME);
  console.log('📋 Columns to remove:', existingColumns);
  
  if (existingColumns.length === 0) {
    console.log('✅ All columns already removed');
    db.end();
    process.exit(0);
    return;
  }
  
  // First, try to drop foreign key constraints
  const checkFKQuery = `
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'tracko_db' 
    AND TABLE_NAME = 'Weekly_Reports' 
    AND COLUMN_NAME = 'trainer_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  `;
  
  db.query(checkFKQuery, (err2, fkResults) => {
    if (err2) {
      console.error('❌ Error checking foreign keys:', err2);
      process.exit(1);
    }
    
    // Drop foreign key if exists
    if (fkResults.length > 0) {
      const fkName = fkResults[0].CONSTRAINT_NAME;
      const dropFKQuery = `ALTER TABLE Weekly_Reports DROP FOREIGN KEY ${fkName}`;
      
      db.query(dropFKQuery, (err3) => {
        if (err3) {
          console.error('⚠️ Error dropping foreign key:', err3.message);
        } else {
          console.log(`✅ Foreign key ${fkName} dropped`);
        }
        dropColumns(existingColumns);
      });
    } else {
      dropColumns(existingColumns);
    }
  });
});

function dropColumns(columns) {
  // Build DROP COLUMN query
  const dropParts = columns.map(col => `DROP COLUMN ${col}`);
  const dropColumnsQuery = `ALTER TABLE Weekly_Reports ${dropParts.join(', ')}`;
  
  db.query(dropColumnsQuery, (err) => {
    if (err) {
      console.error('❌ Error dropping columns:', err);
      process.exit(1);
    }
    
    console.log('✅ Columns dropped successfully:');
    columns.forEach(col => console.log(`   - ${col}`));
    console.log('\n✅ All changes applied successfully!');
    console.log('ℹ️  Note: reviewed_at column is already present and will be used for university reviews');
    
    db.end();
    process.exit(0);
  });
}
