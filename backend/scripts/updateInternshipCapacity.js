import db from "../config/database.js";

console.log('🔧 Updating internship capacity...\n');

// Update capacity for specific internships
const updateQuery = `
  UPDATE Internships 
  SET capacity = 2 
  WHERE title IN ('back', 'FrontEnd', 'machine learning')
`;

db.query(updateQuery, (err, result) => {
  if (err) {
    console.error('❌ Error updating capacity:', err);
    db.end();
    return;
  }
  
  console.log(`✅ Updated ${result.affectedRows} internships`);
  
  // Show updated results
  const selectQuery = `
    SELECT 
      id, 
      title, 
      capacity, 
      number_of_students,
      (capacity - COALESCE(number_of_students, 0)) as available_spots
    FROM Internships
    WHERE title IN ('back', 'FrontEnd', 'machine learning')
  `;
  
  db.query(selectQuery, (err, results) => {
    if (!err) {
      console.log('\n📊 Updated Internships:');
      console.table(results);
    }
    
    // Show all internships
    db.query('SELECT id, title, capacity, number_of_students FROM Internships ORDER BY id', (err, all) => {
      if (!err) {
        console.log('\n📋 All Internships:');
        console.table(all);
      }
      db.end();
    });
  });
});
