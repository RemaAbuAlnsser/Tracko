import db from "../config/database.js";

class TaskSubmission {
  // Create table if it doesn't exist
  static async createTable() {
    return new Promise((resolve, reject) => {
      // First create base table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS Task_Submissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          trainer_id INT NULL,
          week_id INT NULL,
          plan_id INT NULL,
          task_title VARCHAR(255) NULL,
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
          INDEX idx_student_id (student_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      db.query(createTableQuery, (err) => {
        if (err) {
          console.error('❌ Error creating Task_Submissions table:', err);
          return reject(err);
        }
        console.log('✅ Task_Submissions table ready');
        resolve();
      });
    });
  }

  // Create a new task submission
  static create(submissionData) {
    return new Promise((resolve, reject) => {
      const {
        student_id,
        trainer_id,
        week_id,
        plan_id,
        task_title,
        submission_file,
        submission_text,
        submission_link
      } = submissionData;

      const query = `
        INSERT INTO Task_Submissions 
        (student_id, trainer_id, week_id, plan_id, task_title, submission_file, submission_text, submission_link)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        query,
        [student_id, trainer_id, week_id, plan_id, task_title, submission_file, submission_text, submission_link],
        (err, result) => {
          if (err) {
            console.error('❌ Error inserting task submission:', err);
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }

  // Get all submissions for a trainer
  static findByTrainerId(trainerId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ts.*,
          s.major as student_major,
          s.student_img as student_img,
          u.full_name as student_name,
          u.email as student_email,
          pw.title as week_title,
          pw.week_number as pw_week_number,
          ip.title as plan_title,
          i.title as internship_title
        FROM Task_Submissions ts
        JOIN Students s ON ts.student_id = s.id
        JOIN Users u ON s.user_id = u.id
        LEFT JOIN Plan_Weeks pw ON ts.week_id = pw.id
        LEFT JOIN Internship_Plans ip ON ts.plan_id = ip.id
        LEFT JOIN Internships i ON ip.internship_id = i.id
        WHERE ts.trainer_id = ?
        ORDER BY ts.submitted_at DESC
      `;

      db.query(query, [trainerId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get submissions for a specific student
  static findByStudentId(studentId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ts.*,
          pw.title as week_title,
          pw.week_number,
          ip.title as plan_title,
          t.specialization as trainer_specialization,
          u.full_name as trainer_name
        FROM Task_Submissions ts
        JOIN Plan_Weeks pw ON ts.week_id = pw.id
        JOIN Internship_Plans ip ON ts.plan_id = ip.id
        JOIN Trainers t ON ts.trainer_id = t.id
        JOIN Users u ON t.user_id = u.id
        WHERE ts.student_id = ?
        ORDER BY ts.submitted_at DESC
      `;

      db.query(query, [studentId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get submissions by student and trainer
  static findByStudentAndTrainer(studentId, trainerId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ts.*,
          pw.title as week_title,
          pw.week_number,
          ip.title as plan_title,
          i.title as internship_title
        FROM Task_Submissions ts
        JOIN Plan_Weeks pw ON ts.week_id = pw.id
        JOIN Internship_Plans ip ON ts.plan_id = ip.id
        JOIN Internships i ON ip.internship_id = i.id
        WHERE ts.student_id = ? AND ts.trainer_id = ?
        ORDER BY ts.submitted_at DESC
      `;

      db.query(query, [studentId, trainerId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get submissions by student, trainer, and plan (current training only)
  static findByStudentTrainerAndPlan(studentId, trainerId, planId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ts.*,
          pw.title as week_title,
          pw.week_number,
          ip.title as plan_title,
          i.title as internship_title
        FROM Task_Submissions ts
        JOIN Plan_Weeks pw ON ts.week_id = pw.id
        JOIN Internship_Plans ip ON ts.plan_id = ip.id
        JOIN Internships i ON ip.internship_id = i.id
        WHERE ts.student_id = ? AND ts.trainer_id = ? AND ts.plan_id = ?
        ORDER BY ts.submitted_at DESC
      `;

      db.query(query, [studentId, trainerId, planId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get submission status by week_id and student_id
  static getStatusByWeek(studentId, weekId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT status, trainer_comment
        FROM Task_Submissions
        WHERE student_id = ? AND week_id = ?
        ORDER BY submitted_at DESC
        LIMIT 1
      `;

      db.query(query, [studentId, weekId], (err, results) => {
        if (err) reject(err);
        else resolve(results.length > 0 ? results[0] : null);
      });
    });
  }

  // Get submission by ID
  static findById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ts.*,
          s.major as student_major,
          s.student_img as student_img,
          u.full_name as student_name,
          u.email as student_email,
          pw.title as week_title,
          pw.week_number,
          pw.description as week_description,
          pw.tasks as week_tasks,
          ip.title as plan_title,
          i.title as internship_title
        FROM Task_Submissions ts
        JOIN Students s ON ts.student_id = s.id
        JOIN Users u ON s.user_id = u.id
        JOIN Plan_Weeks pw ON ts.week_id = pw.id
        JOIN Internship_Plans ip ON ts.plan_id = ip.id
        JOIN Internships i ON ip.internship_id = i.id
        WHERE ts.id = ?
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

  // Update submission status and add trainer comment
  static review(id, reviewData) {
    return new Promise((resolve, reject) => {
      const { status, trainer_comment } = reviewData;

      const query = `
        UPDATE Task_Submissions 
        SET status = ?, trainer_comment = ?, reviewed_at = NOW()
        WHERE id = ?
      `;

      db.query(query, [status, trainer_comment, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Update submission
  static update(id, submissionData) {
    return new Promise((resolve, reject) => {
      const {
        submission_file,
        submission_text,
        submission_link
      } = submissionData;

      const query = `
        UPDATE Task_Submissions 
        SET submission_file = ?, submission_text = ?, submission_link = ?, submitted_at = NOW()
        WHERE id = ?
      `;

      db.query(query, [submission_file, submission_text, submission_link, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Delete submission
  static delete(id) {
    return new Promise((resolve, reject) => {
      const query = "DELETE FROM Task_Submissions WHERE id = ?";
      
      db.query(query, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Get pending submissions count for trainer
  static getPendingCount(trainerId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as count 
        FROM Task_Submissions 
        WHERE trainer_id = ? AND status = 'pending'
      `;

      db.query(query, [trainerId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });
  }

  // Find existing submission by student and week
  static findByStudentAndWeek(studentId, weekId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM Task_Submissions 
        WHERE student_id = ? AND week_id = ?
        ORDER BY submitted_at DESC
        LIMIT 1
      `;

      db.query(query, [studentId, weekId], (err, results) => {
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

  // Update existing submission with new data and reset status to pending
  static resubmit(id, submissionData) {
    return new Promise((resolve, reject) => {
      const {
        submission_file,
        submission_text,
        submission_link
      } = submissionData;

      const query = `
        UPDATE Task_Submissions 
        SET 
          submission_file = ?, 
          submission_text = ?, 
          submission_link = ?, 
          status = 'pending',
          trainer_comment = NULL,
          reviewed_at = NULL,
          submitted_at = NOW()
        WHERE id = ?
      `;

      db.query(query, [submission_file, submission_text, submission_link, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Get pending submissions count for a specific student with a trainer
  static getPendingCountByStudent(studentId, trainerId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) as count 
        FROM Task_Submissions 
        WHERE student_id = ? AND trainer_id = ? AND status = 'pending'
      `;

      db.query(query, [studentId, trainerId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });
  }

}

export default TaskSubmission;
