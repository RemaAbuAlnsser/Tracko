import db from "../config/database.js";

console.log('🔍 Checking internships capacity...\n');

const query = `
  SELECT 
    id, 
    title, 
    capacity, 
    number_of_students,
    (capacity - COALESCE(number_of_students, 0)) as available_spots,
    CASE 
      WHEN capacity = 0 THEN '❌ No spots (capacity = 0)'
      WHEN COALESCE(number_of_students, 0) >= capacity THEN '❌ Full'
      ELSE '✅ Available'
    END as status
  FROM Internships
  ORDER BY id
`;

db.query(query, (err, results) => {
  if (err) {
    console.error('❌ Error:', err);
    db.end();
    return;
  }
  
  console.log('📊 Internships Status:\n');
  console.table(results);
  
  console.log('\n📝 Summary:');
  const available = results.filter(r => r.capacity > 0 && (r.number_of_students || 0) < r.capacity);
  const full = results.filter(r => r.capacity > 0 && (r.number_of_students || 0) >= r.capacity);
  const noSpots = results.filter(r => r.capacity === 0);
  
  console.log(`✅ Available internships: ${available.length}`);
  console.log(`❌ Full internships: ${full.length}`);
  console.log(`⚠️  No spots (capacity=0): ${noSpots.length}`);
  
  db.end();
});
