import db from '../config/database.js';

console.log('🔧 Adding university columns to Weekly_Reports table...');

// Check if columns exist first
const checkColumnsQuery = `
  SELECT COLUMN_NAME 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'tracko_db' 
  AND TABLE_NAME = 'Weekly_Reports' 
  AND COLUMN_NAME IN ('university_id', 'university_approved', 'university_comment', 'university_reviewed_at')
`;

db.query(checkColumnsQuery, (err, results) => {
  if (err) {
    console.error('❌ Error checking columns:', err);
    process.exit(1);
  }
  
  const existingColumns = results.map(row => row.COLUMN_NAME);
  console.log('📋 Existing columns:', existingColumns);
  
  // Skip if all columns exist
  if (existingColumns.length === 4) {
    console.log('✅ All columns already exist');
    addForeignKeyAndIndex();
    return;
  }
  
  // Build ALTER TABLE query dynamically
  let alterParts = [];
  if (!existingColumns.includes('university_id')) {
    alterParts.push('ADD COLUMN university_id INT NULL AFTER trainer_id');
  }
  if (!existingColumns.includes('university_approved')) {
    alterParts.push('ADD COLUMN university_approved BOOLEAN DEFAULT FALSE AFTER status');
  }
  if (!existingColumns.includes('university_comment')) {
    alterParts.push('ADD COLUMN university_comment TEXT NULL AFTER trainer_comment');
  }
  if (!existingColumns.includes('university_reviewed_at')) {
    alterParts.push('ADD COLUMN university_reviewed_at TIMESTAMP NULL AFTER reviewed_at');
  }
  
  const alterTableQuery = `ALTER TABLE Weekly_Reports ${alterParts.join(', ')}`;
  
  db.query(alterTableQuery, (err) => {
    if (err) {
      console.error('❌ Error adding columns:', err);
      process.exit(1);
    }
    
    console.log('✅ Columns added successfully');
    addForeignKeyAndIndex();
  });
});

function addForeignKeyAndIndex() {
  // Add foreign key
  const addForeignKeyQuery = `
    ALTER TABLE Weekly_Reports 
    ADD CONSTRAINT fk_weekly_reports_university 
    FOREIGN KEY (university_id) REFERENCES Universities(id) ON DELETE SET NULL
  `;
  
  db.query(addForeignKeyQuery, (err2) => {
    if (err2 && err2.code !== 'ER_DUP_KEYNAME') {
      console.error('⚠️ Foreign key might already exist:', err2.message);
    } else {
      console.log('✅ Foreign key added successfully');
    }
    
    // Add index
    const addIndexQuery = `CREATE INDEX idx_university_id ON Weekly_Reports(university_id)`;
    
    db.query(addIndexQuery, (err3) => {
      if (err3 && err3.code !== 'ER_DUP_KEYNAME') {
        console.error('⚠️ Index might already exist:', err3.message);
      } else {
        console.log('✅ Index added successfully');
      }
      
      console.log('\n✅ All changes applied successfully!');
      db.end();
      process.exit(0);
    });
  });
}
