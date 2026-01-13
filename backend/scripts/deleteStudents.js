import db from "../config/database.js";

const studentIdsToDelete = [9, 10, 11, 12, 13, 14, 15];

console.log("🗑️  Starting deletion of students and related records...");
console.log(`📋 Students to delete: ${studentIdsToDelete.join(', ')}\n`);

const deleteStudents = () => {
  const placeholders = studentIdsToDelete.map(() => '?').join(',');
  
  // First, show what will be deleted
  const previewQuery = `
    SELECT 
      s.id,
      s.user_id,
      u.full_name,
      u.email
    FROM Students s
    LEFT JOIN Users u ON s.user_id = u.id
    WHERE s.id IN (${placeholders})
  `;
  
  db.query(previewQuery, studentIdsToDelete, (err, students) => {
    if (err) {
      console.error("❌ Error fetching students:", err);
      process.exit(1);
    }
    
    console.log("👥 Students to be deleted:");
    students.forEach(student => {
      console.log(`   - ID: ${student.id}, Name: ${student.full_name || 'N/A'}, Email: ${student.email || 'N/A'}`);
    });
    
    if (students.length === 0) {
      console.log("\n⚠️  No students found with these IDs");
      process.exit(0);
    }
    
    console.log("\n🔍 Checking related records...");
    
    // Check related records
    const relatedChecks = [
      { table: 'CVs', query: `SELECT COUNT(*) as count FROM CVs WHERE student_id IN (${placeholders})` },
      { table: 'Internship_Matches', query: `SELECT COUNT(*) as count FROM Internship_Matches WHERE student_id IN (${placeholders})` },
      { table: 'Applications', query: `SELECT COUNT(*) as count FROM Applications WHERE student_id IN (${placeholders})` },
      { table: 'Final_Reports', query: `SELECT COUNT(*) as count FROM Final_Reports WHERE student_id IN (${placeholders})` },
      { table: 'Weekly_Reports', query: `SELECT COUNT(*) as count FROM Weekly_Reports WHERE student_id IN (${placeholders})` },
      { table: 'Internship_Plans', query: `SELECT COUNT(*) as count FROM Internship_Plans WHERE student_id IN (${placeholders})` },
      { table: 'Saved_Internships', query: `SELECT COUNT(*) as count FROM Saved_Internships WHERE student_id IN (${placeholders})` }
    ];
    
    let completedChecks = 0;
    const relatedCounts = {};
    
    relatedChecks.forEach(check => {
      db.query(check.query, studentIdsToDelete, (err, result) => {
        if (err) {
          console.log(`   ⚠️  ${check.table}: Error checking (table might not exist)`);
        } else {
          const count = result[0].count;
          relatedCounts[check.table] = count;
          console.log(`   📊 ${check.table}: ${count} record(s)`);
        }
        
        completedChecks++;
        if (completedChecks === relatedChecks.length) {
          proceedWithDeletion(students);
        }
      });
    });
  });
};

const proceedWithDeletion = (students) => {
  console.log("\n⚠️  PROCEEDING WITH DELETION...");
  console.log("⚠️  This will delete all related records due to CASCADE constraints\n");
  
  const studentIds = students.map(s => s.id);
  const placeholders = studentIds.map(() => '?').join(',');
  
  // Delete from Students table (CASCADE will handle related tables)
  const deleteQuery = `DELETE FROM Students WHERE id IN (${placeholders})`;
  
  db.query(deleteQuery, studentIds, (err, result) => {
    if (err) {
      console.error("❌ Error deleting students:", err);
      process.exit(1);
    }
    
    console.log(`✅ Successfully deleted ${result.affectedRows} student(s)`);
    console.log("✅ Related records in other tables were automatically deleted (CASCADE)");
    
    // Also delete users if they exist
    const userIds = students.map(s => s.user_id).filter(id => id);
    if (userIds.length > 0) {
      const userPlaceholders = userIds.map(() => '?').join(',');
      const deleteUsersQuery = `DELETE FROM Users WHERE id IN (${userPlaceholders})`;
      
      db.query(deleteUsersQuery, userIds, (err, result) => {
        if (err) {
          console.error("⚠️  Error deleting users:", err);
        } else {
          console.log(`✅ Also deleted ${result.affectedRows} user account(s)`);
        }
        
        console.log("\n✅ Cleanup completed successfully!");
        process.exit(0);
      });
    } else {
      console.log("\n✅ Cleanup completed successfully!");
      process.exit(0);
    }
  });
};

deleteStudents();
