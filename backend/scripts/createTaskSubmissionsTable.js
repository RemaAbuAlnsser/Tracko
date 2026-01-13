import db from "../config/database.js";

async function createTaskSubmissionsTable() {
  try {
    console.log("🔧 Creating Task_Submissions table...");
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS Task_Submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        trainer_id INT NOT NULL,
        week_id INT NOT NULL,
        plan_id INT NOT NULL,
        task_title VARCHAR(255) NOT NULL,
        submission_file VARCHAR(500),
        submission_text TEXT,
        submission_link VARCHAR(500),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        trainer_comment TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
        FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE CASCADE,
        FOREIGN KEY (week_id) REFERENCES Plan_Weeks(id) ON DELETE CASCADE,
        FOREIGN KEY (plan_id) REFERENCES Internship_Plans(id) ON DELETE CASCADE,
        INDEX idx_student_id (student_id),
        INDEX idx_trainer_id (trainer_id),
        INDEX idx_week_id (week_id),
        INDEX idx_plan_id (plan_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    db.query(createTableQuery, (err, result) => {
      if (err) {
        console.error("❌ Error creating Task_Submissions table:", err);
        process.exit(1);
      }
      
      console.log("✅ Task_Submissions table created successfully!");
      console.log("📋 Table structure:");
      console.log("   - id: PRIMARY KEY, AUTO_INCREMENT");
      console.log("   - student_id: FOREIGN KEY -> Students(id)");
      console.log("   - trainer_id: FOREIGN KEY -> Trainers(id)");
      console.log("   - week_id: FOREIGN KEY -> Plan_Weeks(id)");
      console.log("   - plan_id: FOREIGN KEY -> Internship_Plans(id)");
      console.log("   - task_title: VARCHAR(255) - اسم المهمة");
      console.log("   - submission_file: VARCHAR(500) - مسار الملف المرفوع");
      console.log("   - submission_text: TEXT - النص المكتوب");
      console.log("   - submission_link: VARCHAR(500) - الرابط");
      console.log("   - status: ENUM('pending', 'approved', 'rejected') - الحالة");
      console.log("   - trainer_comment: TEXT - تعليق المدرب");
      console.log("   - submitted_at: TIMESTAMP - تاريخ التسليم");
      console.log("   - reviewed_at: TIMESTAMP - تاريخ المراجعة");
      console.log("   - created_at: TIMESTAMP");
      console.log("   - updated_at: TIMESTAMP");
      console.log("");
      console.log("🎉 الجدول جاهز لتخزين:");
      console.log("   ✅ تسليمات الطلاب");
      console.log("   ✅ تاريخ التسليم");
      console.log("   ✅ حالة القبول/الرفض");
      console.log("   ✅ تعليقات المدرب");
      process.exit(0);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createTaskSubmissionsTable();
