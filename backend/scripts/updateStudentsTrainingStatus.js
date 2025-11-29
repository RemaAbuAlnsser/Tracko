import db from "../config/database.js";

console.log("🔧 Updating students training status based on certificates...\n");

// Update students who have certificates to 'completed'
const updateCompletedQuery = `
  UPDATE Students s
  INNER JOIN Final_Reports fr ON s.id = fr.student_id
  SET s.status = 'completed'
  WHERE fr.certificate_file IS NOT NULL
`;

db.query(updateCompletedQuery, (err, result) => {
  if (err) {
    console.error("❌ Error updating completed students:", err);
    process.exit(1);
  }
  
  console.log(`✅ Updated ${result.affectedRows} students to 'completed' status`);
  
  // Update students who have accepted internships but no certificate to 'in_training'
  const updateInTrainingQuery = `
    UPDATE Students s
    INNER JOIN Internship_Matches im ON s.id = im.student_id
    LEFT JOIN Final_Reports fr ON s.id = fr.student_id
    SET s.status = 'in_training'
    WHERE im.status = 'accepted' 
      AND (fr.certificate_file IS NULL OR fr.certificate_file = '')
  `;
  
  db.query(updateInTrainingQuery, (err2, result2) => {
    if (err2) {
      console.error("❌ Error updating in-training students:", err2);
      process.exit(1);
    }
    
    console.log(`✅ Updated ${result2.affectedRows} students to 'in_training' status`);
    
    console.log("\n📋 Summary:");
    console.log(`   - ${result.affectedRows} students marked as 'completed' (have certificate)`);
    console.log(`   - ${result2.affectedRows} students marked as 'in_training' (accepted internship, no certificate)`);
    
    process.exit(0);
  });
});
