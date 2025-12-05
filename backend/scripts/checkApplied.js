import db from "../config/database.js";

const checkApplied = async () => {
  console.log("🔍 Checking Applied Status...\n");
  
  try {
    // Check all records for student 12
    const query = `
      SELECT 
        im.id,
        im.student_id,
        im.internship_id,
        im.applied,
        im.status,
        im.hours_per_week,
        im.applied_at,
        i.title as internship_title
      FROM Internship_Matches im
      LEFT JOIN Internships i ON im.internship_id = i.id
      WHERE im.student_id = 12
      ORDER BY im.id DESC
    `;
    
    const records = await new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log(`📊 Found ${records.length} records for student 12:\n`);
    
    records.forEach((record, index) => {
      console.log(`${index + 1}. Internship: ${record.internship_title} (ID: ${record.internship_id})`);
      console.log(`   - Applied: ${record.applied} (type: ${typeof record.applied})`);
      console.log(`   - Status: ${record.status}`);
      console.log(`   - Hours/week: ${record.hours_per_week}`);
      console.log(`   - Applied at: ${record.applied_at}`);
      console.log(`   - Match ID: ${record.id}\n`);
    });
    
    // Check specifically for applied = 1
    const appliedQuery = `
      SELECT COUNT(*) as count
      FROM Internship_Matches
      WHERE student_id = 12 AND applied = 1
    `;
    
    const appliedCount = await new Promise((resolve, reject) => {
      db.query(appliedQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });
    
    console.log(`✅ Total applications (applied = 1): ${appliedCount}`);
    
    // Check for applied = TRUE
    const appliedTrueQuery = `
      SELECT COUNT(*) as count
      FROM Internship_Matches
      WHERE student_id = 12 AND applied = TRUE
    `;
    
    const appliedTrueCount = await new Promise((resolve, reject) => {
      db.query(appliedTrueQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });
    
    console.log(`✅ Total applications (applied = TRUE): ${appliedTrueCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkApplied();
