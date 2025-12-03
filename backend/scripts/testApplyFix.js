import db from "../config/database.js";

const testApplyFix = async () => {
  console.log("🧪 Testing Apply Fix...\n");
  
  try {
    const studentId = 12;
    const internshipId = 5; // FrontEnd internship
    const hoursPerWeek = 30;
    
    console.log(`1️⃣ Applying student ${studentId} to internship ${internshipId} with ${hoursPerWeek} hours/week...`);
    
    const query = `
      INSERT INTO Internship_Matches (student_id, internship_id, applied, applied_at, status, match_percentage, hours_per_week)
      VALUES (?, ?, 1, NOW(), 'pending', 0, ?)
      ON DUPLICATE KEY UPDATE 
        applied = 1, 
        applied_at = NOW(), 
        status = 'pending', 
        hours_per_week = ?
    `;
    
    await new Promise((resolve, reject) => {
      db.query(query, [studentId, internshipId, hoursPerWeek, hoursPerWeek], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    console.log(`✅ Application submitted!`);
    
    // Verify
    console.log(`\n2️⃣ Verifying...`);
    const verifyQuery = `
      SELECT * FROM Internship_Matches 
      WHERE student_id = ? AND internship_id = ?
    `;
    
    const result = await new Promise((resolve, reject) => {
      db.query(verifyQuery, [studentId, internshipId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
    
    console.log(`\n✅ Result:`);
    console.log(`   - Applied: ${result.applied} (should be 1)`);
    console.log(`   - Status: ${result.status} (should be 'pending')`);
    console.log(`   - Hours/week: ${result.hours_per_week} (should be ${hoursPerWeek})`);
    console.log(`   - Applied at: ${result.applied_at}`);
    
    if (result.applied === 1 && result.status === 'pending' && result.hours_per_week === hoursPerWeek) {
      console.log(`\n✅ SUCCESS! All values are correct!`);
    } else {
      console.log(`\n❌ FAILED! Some values are incorrect!`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

testApplyFix();
