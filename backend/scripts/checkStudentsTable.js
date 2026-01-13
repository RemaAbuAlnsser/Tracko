import db from "../config/database.js";

console.log('🔍 Checking Students table structure...\n');

db.query('DESCRIBE Students', (err, results) => {
  if (err) {
    console.error('❌ Error:', err);
    db.end();
    return;
  }
  
  console.log('📋 Students table structure:');
  console.table(results);
  
  // Check how students are linked to internships
  console.log('\n🔗 Checking student-internship relationship...');
  
  const query = `
    SELECT s.id, s.user_id, s.status, ip.internship_id, i.title
    FROM Students s
    LEFT JOIN Internship_Plans ip ON s.id = ip.student_id
    LEFT JOIN Internships i ON ip.internship_id = i.id
    LIMIT 5
  `;
  
  db.query(query, (err2, data) => {
    if (!err2) {
      console.log('\n📊 Sample student-internship data:');
      console.table(data);
    }
    db.end();
  });
});
