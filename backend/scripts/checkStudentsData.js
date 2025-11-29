import db from "../config/database.js";

console.log("🔍 Checking Students and Universities data...\n");

// Check Universities
db.query('SELECT id, name, email FROM Universities', (err, universities) => {
  if (err) {
    console.error("❌ Error fetching universities:", err);
    process.exit(1);
  }
  
  console.log("📚 Universities in database:");
  universities.forEach(uni => {
    console.log(`   - ID: ${uni.id}, Name: ${uni.name}, Email: ${uni.email}`);
  });
  
  console.log("\n👥 Students in database:");
  
  // Check Students
  db.query(`
    SELECT 
      s.id, 
      s.user_id, 
      s.university_id, 
      u.full_name, 
      u.email,
      s.major,
      s.academic_year
    FROM Students s
    JOIN Users u ON s.user_id = u.id
    ORDER BY s.id
  `, (err, students) => {
    if (err) {
      console.error("❌ Error fetching students:", err);
      process.exit(1);
    }
    
    if (students.length === 0) {
      console.log("   ⚠️ No students found in database!");
    } else {
      students.forEach(student => {
        console.log(`   - ID: ${student.id}, Name: ${student.full_name}, Email: ${student.email}`);
        console.log(`     University ID: ${student.university_id || 'NULL'}, Major: ${student.major || 'N/A'}`);
      });
    }
    
    console.log("\n📊 Summary:");
    console.log(`   Total Universities: ${universities.length}`);
    console.log(`   Total Students: ${students.length}`);
    
    // Count students per university
    const studentsPerUni = {};
    students.forEach(s => {
      const uniId = s.university_id || 'NULL';
      studentsPerUni[uniId] = (studentsPerUni[uniId] || 0) + 1;
    });
    
    console.log("\n📈 Students per University:");
    Object.keys(studentsPerUni).forEach(uniId => {
      const uniName = universities.find(u => u.id == uniId)?.name || 'No University';
      console.log(`   University ${uniId} (${uniName}): ${studentsPerUni[uniId]} students`);
    });
    
    process.exit(0);
  });
});
