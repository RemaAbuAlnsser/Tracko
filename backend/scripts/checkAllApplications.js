import db from "../config/database.js";

const checkAllApplications = async () => {
  console.log("🔍 Checking All Recent Applications...\n");
  
  try {
    // Get all applications from today
    const query = `
      SELECT 
        im.id as match_id,
        im.student_id,
        im.internship_id,
        im.applied,
        im.status,
        im.hours_per_week,
        im.applied_at,
        u.full_name as student_name,
        u.id as user_id,
        i.title as internship_title
      FROM Internship_Matches im
      LEFT JOIN Students s ON im.student_id = s.id
      LEFT JOIN Users u ON s.user_id = u.id
      LEFT JOIN Internships i ON im.internship_id = i.id
      WHERE im.applied = 1 
        AND DATE(im.applied_at) = CURDATE()
      ORDER BY im.applied_at DESC
    `;
    
    const applications = await new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log(`📊 Found ${applications.length} applications today:\n`);
    
    applications.forEach((app, index) => {
      console.log(`${index + 1}. ${app.student_name} (user_id: ${app.user_id}, student_id: ${app.student_id})`);
      console.log(`   → Applied to: ${app.internship_title} (ID: ${app.internship_id})`);
      console.log(`   → Status: ${app.status}`);
      console.log(`   → Hours/week: ${app.hours_per_week}`);
      console.log(`   → Applied at: ${app.applied_at}`);
      console.log(`   → Match ID: ${app.match_id}\n`);
    });
    
    // Check for Nora specifically
    console.log(`\n🔍 Checking for Nora's applications...`);
    const noraQuery = `
      SELECT 
        im.*,
        u.full_name,
        u.id as user_id,
        i.title as internship_title
      FROM Internship_Matches im
      LEFT JOIN Students s ON im.student_id = s.id
      LEFT JOIN Users u ON s.user_id = u.id
      LEFT JOIN Internships i ON im.internship_id = i.id
      WHERE u.full_name LIKE '%nora%' OR u.full_name LIKE '%Noor%'
      ORDER BY im.applied_at DESC
      LIMIT 5
    `;
    
    const noraApps = await new Promise((resolve, reject) => {
      db.query(noraQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log(`\n📊 Nora's recent applications: ${noraApps.length}\n`);
    noraApps.forEach((app, index) => {
      console.log(`${index + 1}. ${app.full_name} (user_id: ${app.user_id})`);
      console.log(`   → Internship: ${app.internship_title} (ID: ${app.internship_id})`);
      console.log(`   → Applied: ${app.applied}`);
      console.log(`   → Status: ${app.status}`);
      console.log(`   → Applied at: ${app.applied_at}\n`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkAllApplications();
