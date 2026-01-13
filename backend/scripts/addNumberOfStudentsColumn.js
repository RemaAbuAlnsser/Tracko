import db from "../config/database.js";

console.log('🔧 Adding number_of_students column to Internships table...\n');

// Step 1: Add number_of_students column
const addColumnQuery = `
  ALTER TABLE Internships 
  ADD COLUMN number_of_students INT DEFAULT 0 NOT NULL AFTER capacity
`;

db.query(addColumnQuery, (err) => {
  if (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️ number_of_students column already exists, skipping...');
      updateCounts();
    } else {
      console.error('❌ Error adding column:', err);
      db.end();
    }
  } else {
    console.log('✅ number_of_students column added successfully');
    updateCounts();
  }
});

function updateCounts() {
  // Step 2: Update existing internships to count current students
  const updateQuery = `
    UPDATE Internships i
    SET number_of_students = (
      SELECT COUNT(DISTINCT ip.student_id) 
      FROM Internship_Plans ip 
      WHERE ip.internship_id = i.id
    )
  `;
  
  db.query(updateQuery, (err, result) => {
    if (err) {
      console.error('❌ Error updating counts:', err);
    } else {
      console.log(`✅ Updated ${result.affectedRows} internships with student counts`);
    }
    
    // Step 3: Show results
    const selectQuery = `
      SELECT id, title, capacity, number_of_students, 
             (capacity - number_of_students) as available_spots
      FROM Internships 
      LIMIT 10
    `;
    
    db.query(selectQuery, (err, results) => {
      if (!err) {
        console.log('\n📊 Internships with student counts:');
        console.table(results);
      }
      db.end();
    });
  });
}
