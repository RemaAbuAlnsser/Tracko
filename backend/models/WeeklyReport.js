import db from "../config/database.js";

class WeeklyReport {
  // Create weekly_reports table
  static async createTable() {
    return new Promise((resolve, reject) => {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS weekly_reports (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          university_id INT NULL,
          plan_id INT NULL,
          week_number INT NOT NULL,
          report_text TEXT,
          report_file VARCHAR(500),
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          university_approved BOOLEAN DEFAULT FALSE,
          university_comment TEXT,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE SET NULL,
          FOREIGN KEY (plan_id) REFERENCES internship_plans(id) ON DELETE SET NULL,
          INDEX idx_student_id (student_id),
          INDEX idx_university_id (university_id),
          INDEX idx_plan_id (plan_id),
          INDEX idx_status (status),
          INDEX idx_week_number (week_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      db.query(createTableQuery, (err) => {
        if (err) {
          console.error('❌ Error creating weekly_reports table:', err);
          return reject(err);
        }
        console.log('✅ Weekly_Reports table ready');
        resolve();
      });
    });
  }

  // Create a new weekly report
  static create(reportData) {
    return new Promise((resolve, reject) => {
      const {
        student_id,
        university_id,
        plan_id,
        week_number,
        report_text,
        report_file
      } = reportData;

      const query = `
        INSERT INTO weekly_reports 
        (student_id, university_id, plan_id, week_number, report_text, report_file)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(
        query,
        [student_id, university_id, plan_id, week_number, report_text, report_file],
        (err, result) => {
          if (err) {
            console.error('❌ Error inserting weekly report:', err);
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }

  // Get all reports for a student
  static findByStudentId(studentId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          wr.*,
          ip.title as plan_title
        FROM weekly_reports wr
        LEFT JOIN internship_plans ip ON wr.plan_id = ip.id
        WHERE wr.student_id = ?
        ORDER BY wr.week_number ASC, wr.submitted_at DESC
      `;

      db.query(query, [studentId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }


  // Get report by ID with full details
  static findById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          wr.*,
          s.major as student_major,
          s.gpa as student_gpa,
          s.student_img as student_img,
          u.full_name as student_name,
          u.email as student_email,
          ip.title as plan_title
        FROM weekly_reports wr
        JOIN students s ON wr.student_id = s.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN internship_plans ip ON wr.plan_id = ip.id
        WHERE wr.id = ?
      `;

      db.query(query, [id], (err, results) => {
        if (err) {
          reject(err);
        } else if (results.length === 0) {
          resolve(null);
        } else {
          resolve(results[0]);
        }
      });
    });
  }




  // Update a report
  static update(id, updateData) {
    return new Promise((resolve, reject) => {
      const { report_text, report_file } = updateData;
      
      const query = `
        UPDATE weekly_reports 
        SET report_text = ?, report_file = ?, submitted_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.query(query, [report_text, report_file, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Delete a report
  static delete(id) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM weekly_reports WHERE id = ?`;

      db.query(query, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Get all reports for a university
  static findByUniversityId(universityId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          wr.*,
          s.major as student_major,
          s.student_img as student_img,
          s.gpa as student_gpa,
          u.full_name as student_name,
          u.email as student_email,
          ip.title as plan_title,
          c.name as company_name,
          i.title as internship_title
        FROM weekly_reports wr
        JOIN students s ON wr.student_id = s.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN internship_plans ip ON wr.plan_id = ip.id
        LEFT JOIN internship_matches im ON s.id = im.student_id AND im.status = 'accepted'
        LEFT JOIN internships i ON im.internship_id = i.id
        LEFT JOIN company c ON i.company_id = c.id
        WHERE wr.university_id = ?
        ORDER BY wr.submitted_at DESC
      `;

      db.query(query, [universityId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get pending reports count for university
  static getPendingCountByUniversity(universityId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as count 
        FROM weekly_reports 
        WHERE university_id = ? AND university_approved = FALSE
      `;

      db.query(query, [universityId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });
  }

  // University approve/reject a weekly report
  static universityReview(id, approved, university_comment) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE weekly_reports 
        SET university_approved = ?, 
            status = ?,
            university_comment = ?, 
            reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const status = approved ? 'approved' : 'rejected';
      db.query(query, [approved, status, university_comment, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

export default WeeklyReport;
