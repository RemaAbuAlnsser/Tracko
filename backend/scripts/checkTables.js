import db from '../config/database.js';

console.log('📋 Checking all tables in tracko_db...\n');

const query = `SHOW TABLES`;

db.query(query, (err, results) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
  
  console.log('Tables in database:');
  console.log('==================');
  results.forEach(row => {
    console.log(`- ${Object.values(row)[0]}`);
  });
  
  // Now check Weekly_Reports specifically
  const describeQuery = `DESCRIBE Weekly_Reports`;
  
  db.query(describeQuery, (err2, results2) => {
    if (err2) {
      console.error('\n❌ Error describing Weekly_Reports:', err2.message);
    } else {
      console.log('\n📋 Weekly_Reports structure:');
      console.log('============================');
      results2.forEach(col => {
        console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
      });
    }
    
    db.end();
    process.exit(0);
  });
});
