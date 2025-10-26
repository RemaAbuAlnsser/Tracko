import db from "../config/database.js";

class FinalReport {
  // Create a new final report
  static create(reportData) {
    const {
      trainer_id,
      student_id,
      internship_id = null,
      overall_performance,
      technical_skills_rating,
      communication_rating,
      teamwork_rating,
      problem_solving_rating,
      attendance_rating,
      overall_rating
    } = reportData;

    const query = `
      INSERT INTO Final_Reports (
        trainer_id, student_id, internship_id, overall_performance,
        technical_skills_rating, communication_rating, teamwork_rating,
        problem_solving_rating, attendance_rating, overall_rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      db.query(
        query,
        [
          trainer_id, student_id, internship_id, overall_performance,
          technical_skills_rating, communication_rating, teamwork_rating,
          problem_solving_rating, attendance_rating, overall_rating
        ],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Get all reports by trainer
  static findByTrainer(trainerId) {
    const query = `
      SELECT 
        fr.*,
        s.id as student_id,
        u.full_name as student_name,
        u.email as student_email,
        s.major,
        s.academic_year,
        i.title as internship_title,
        c.name as company_name
      FROM Final_Reports fr
      JOIN Students s ON fr.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      LEFT JOIN Internships i ON fr.internship_id = i.id
      LEFT JOIN Company c ON i.company_id = c.id
      WHERE fr.trainer_id = ?
      ORDER BY fr.created_at DESC
    `;

    return new Promise((resolve, reject) => {
      db.query(query, [trainerId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get report by student
  static findByStudent(studentId) {
    const query = `
      SELECT 
        fr.*,
        t.id as trainer_id,
        u.full_name as trainer_name,
        t.specialization,
        i.title as internship_title,
        c.name as company_name
      FROM Final_Reports fr
      JOIN Trainers t ON fr.trainer_id = t.id
      JOIN Users u ON t.user_id = u.id
      LEFT JOIN Internships i ON fr.internship_id = i.id
      LEFT JOIN Company c ON i.company_id = c.id
      WHERE fr.student_id = ?
      ORDER BY fr.created_at DESC
    `;

    return new Promise((resolve, reject) => {
      db.query(query, [studentId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get specific report
  static findById(id) {
    const query = `
      SELECT 
        fr.*,
        s.id as student_id,
        u1.full_name as student_name,
        u1.email as student_email,
        s.major,
        s.academic_year,
        t.id as trainer_id,
        u2.full_name as trainer_name,
        t.specialization,
        i.title as internship_title,
        c.name as company_name
      FROM Final_Reports fr
      JOIN Students s ON fr.student_id = s.id
      JOIN Users u1 ON s.user_id = u1.id
      JOIN Trainers t ON fr.trainer_id = t.id
      JOIN Users u2 ON t.user_id = u2.id
      LEFT JOIN Internships i ON fr.internship_id = i.id
      LEFT JOIN Company c ON i.company_id = c.id
      WHERE fr.id = ?
    `;

    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  // Update report
  static update(id, reportData) {
    const {
      overall_performance,
      technical_skills_rating,
      communication_rating,
      teamwork_rating,
      problem_solving_rating,
      attendance_rating,
      overall_rating
    } = reportData;

    const query = `
      UPDATE Final_Reports 
      SET overall_performance = ?, technical_skills_rating = ?,
          communication_rating = ?, teamwork_rating = ?,
          problem_solving_rating = ?, attendance_rating = ?,
          overall_rating = ?
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      db.query(
        query,
        [
          overall_performance, technical_skills_rating, communication_rating,
          teamwork_rating, problem_solving_rating, attendance_rating,
          overall_rating, id
        ],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Delete report
  static delete(id) {
    const query = "DELETE FROM Final_Reports WHERE id = ?";

    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

export default FinalReport;
