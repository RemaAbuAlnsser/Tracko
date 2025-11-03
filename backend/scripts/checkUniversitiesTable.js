import db from "../config/database.js";

db.query('DESCRIBE Universities', (err, results) => {
  if (err) {
    console.error('❌ Error:', err);
  } else {
    console.log('📋 Universities table structure:');
    console.table(results);
    
    // Also check if there's a domain column
    const hasDomain = results.some(col => col.Field === 'domain');
    console.log('\n✅ Has domain column:', hasDomain);
    
    // Show sample data
    db.query('SELECT id, name, email, domain FROM Universities LIMIT 3', (err2, data) => {
      if (!err2) {
        console.log('\n📊 Sample data:');
        console.table(data);
      }
      db.end();
    });
  }
});
