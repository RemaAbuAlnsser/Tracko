import db from '../config/database.js';

console.log('📋 Checking Weekly_Reports table structure...\n');

const query = `
  SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'tracko_db' 
  AND TABLE_NAME = 'Weekly_Reports'
  ORDER BY ORDINAL_POSITION
`;

db.query(query, (err, results) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
  
  console.log('Current columns in Weekly_Reports table:');
  console.log('==========================================');
  results.forEach(col => {
    console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
  });
  
  db.end();
  process.exit(0);
});
