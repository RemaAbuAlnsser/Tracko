import db from "../config/database.js";

class WeeklyReport {
  // Create Weekly_Reports table
  static async createTable() {
    return new Promise((resolve, reject) => {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS Weekly_Reports (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          trainer_id INT NULL,
          plan_id INT NULL,
          week_number INT NOT NULL,
          report_text TEXT,
          report_file VARCHAR(500),
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          trainer_comment TEXT,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
          FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE SET NULL,
          FOREIGN KEY (plan_id) REFERENCES Internship_Plans(id) ON DELETE SET NULL,
          INDEX idx_student_id (student_id),
          INDEX idx_trainer_id (trainer_id),
          INDEX idx_plan_id (plan_id),
          INDEX idx_status (status),
          INDEX idx_week_number (week_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      db.query(createTableQuery, (err) => {
        if (err) {
          console.error('❌ Error creating Weekly_Reports table:', err);
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
        trainer_id,
        plan_id,
        week_number,
        report_text,
        report_file
      } = reportData;

      const query = `
        INSERT INTO Weekly_Reports 
        (student_id, trainer_id, plan_id, week_number, report_text, report_file)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(
        query,
        [student_id, trainer_id, plan_id, week_number, report_text, report_file],
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
        FROM Weekly_Reports wr
        LEFT JOIN Internship_Plans ip ON wr.plan_id = ip.id
        WHERE wr.student_id = ?
        ORDER BY wr.week_number ASC, wr.submitted_at DESC
      `;

      db.query(query, [studentId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get all reports for a trainer
  static findByTrainerId(trainerId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          wr.*,
          s.major as student_major,
          s.student_img as student_img,
          u.full_name as student_name,
          u.email as student_email,
          ip.title as plan_title
        FROM Weekly_Reports wr
        JOIN Students s ON wr.student_id = s.id
        JOIN Users u ON s.user_id = u.id
        LEFT JOIN Internship_Plans ip ON wr.plan_id = ip.id
        WHERE wr.trainer_id = ?
        ORDER BY wr.submitted_at DESC
      `;

      db.query(query, [trainerId], (err, results) => {
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
          ip.title as plan_title,
          t.specialization as trainer_specialization,
          tu.full_name as trainer_name
        FROM Weekly_Reports wr
        JOIN Students s ON wr.student_id = s.id
        JOIN Users u ON s.user_id = u.id
        LEFT JOIN Internship_Plans ip ON wr.plan_id = ip.id
        LEFT JOIN Trainers t ON wr.trainer_id = t.id
        LEFT JOIN Users tu ON t.user_id = tu.id
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

  // Review a weekly report
  static review(id, status, trainer_comment) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE Weekly_Reports 
        SET status = ?, trainer_comment = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.query(query, [status, trainer_comment, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Get pending reports count for trainer
  static getPendingCount(trainerId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as count 
        FROM Weekly_Reports 
        WHERE trainer_id = ? AND status = 'pending'
      `;

      db.query(query, [trainerId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });
  }

  // Get pending reports count for a specific student with trainer
  static getPendingCountByStudent(studentId, trainerId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as count 
        FROM Weekly_Reports 
        WHERE student_id = ? AND trainer_id = ? AND status = 'pending'
      `;

      db.query(query, [studentId, trainerId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });
  }

  // Update a report
  static update(id, updateData) {
    return new Promise((resolve, reject) => {
      const { report_text, report_file } = updateData;
      
      const query = `
        UPDATE Weekly_Reports 
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
      const query = `DELETE FROM Weekly_Reports WHERE id = ?`;

      db.query(query, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

export default WeeklyReport;
