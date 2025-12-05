import db from "../config/database.js";

const testApply = async () => {
  console.log("🧪 Testing Apply Functionality...\n");
  
  try {
    // Test data
    const userId = 26;
    const internshipId = 3;
    const hoursPerWeek = 25;
    
    // Step 1: Find student by user_id
    console.log(`1️⃣ Finding student for user_id: ${userId}`);
    const studentQuery = `SELECT * FROM Students WHERE user_id = ?`;
    
    const student = await new Promise((resolve, reject) => {
      db.query(studentQuery, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
    
    if (!student) {
      console.log("❌ Student not found!");
      process.exit(1);
    }
    
    console.log(`✅ Found student: ${student.id}`);
    console.log(student);
    
    // Step 2: Apply to internship
    console.log(`\n2️⃣ Applying student ${student.id} to internship ${internshipId}...`);
    const applyQuery = `
      INSERT INTO Internship_Matches (student_id, internship_id, applied, applied_at, status, match_percentage, hours_per_week)
      VALUES (?, ?, TRUE, NOW(), 'pending', 0, ?)
      ON DUPLICATE KEY UPDATE applied = TRUE, applied_at = NOW(), status = 'pending', hours_per_week = VALUES(hours_per_week)
    `;
    
    await new Promise((resolve, reject) => {
      db.query(applyQuery, [student.id, internshipId, hoursPerWeek], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    console.log(`✅ Application submitted!`);
    
    // Step 3: Verify the application
    console.log(`\n3️⃣ Verifying application...`);
    const verifyQuery = `
      SELECT * FROM Internship_Matches 
      WHERE student_id = ? AND internship_id = ?
    `;
    
    const application = await new Promise((resolve, reject) => {
      db.query(verifyQuery, [student.id, internshipId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
    
    console.log("Application record:");
    console.log(application);
    
    // Step 4: Check if it appears in company's applicants list
    console.log(`\n4️⃣ Checking if it appears in applicants list...`);
    const applicantsQuery = `
      SELECT 
        im.*,
        s.id as student_id,
        u.full_name
      FROM Internship_Matches im
      INNER JOIN Students s ON im.student_id = s.id
      INNER JOIN Users u ON s.user_id = u.id
      WHERE im.internship_id = ? AND im.applied = TRUE AND im.status = 'pending'
    `;
    
    const applicants = await new Promise((resolve, reject) => {
      db.query(applicantsQuery, [internshipId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log(`\n✅ Found ${applicants.length} applicants for internship ${internshipId}:`);
    applicants.forEach((app, index) => {
      console.log(`\n${index + 1}. ${app.full_name} (student_id: ${app.student_id})`);
      console.log(`   - Applied: ${app.applied}`);
      console.log(`   - Status: ${app.status}`);
      console.log(`   - Hours/week: ${app.hours_per_week}`);
      console.log(`   - Applied at: ${app.applied_at}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

testApply();
