import db from "../config/database.js";

class Student {
  // Create a new student
  static create(studentData) {
    const { 
      user_id,
      university_id = null,
      major = null,
      academic_year = null,
      gpa = null,
      cv_file = null,
      student_img = null,
      skills = null,
      status = 'active'
    } = studentData;
    
    const query = `
      INSERT INTO Students (user_id, university_id, major, academic_year, gpa, cv_file, student_img, skills, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [user_id, university_id, major, academic_year, gpa, cv_file, student_img, skills, status], 
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }

  // Find student by user_id
  static findByUserId(userId) {
    const query = `
      SELECT s.*, u.full_name, u.email 
      FROM Students s
      JOIN Users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [userId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  // Find student by id
  static findById(id) {
    const query = `
      SELECT s.*, u.full_name, u.email 
      FROM Students s
      JOIN Users u ON s.user_id = u.id
      WHERE s.id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  // Find all students
  static findAll() {
    const query = `
      SELECT s.*, u.full_name, u.email 
      FROM Students s
      JOIN Users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Update student
  static update(id, studentData) {
    const { 
      university_id,
      major,
      academic_year,
      gpa,
      cv_file,
      student_img,
      skills,
      status
    } = studentData;
    
    const query = `
      UPDATE Students 
      SET university_id = ?, major = ?, 
          academic_year = ?, gpa = ?, cv_file = ?, 
          student_img = ?, skills = ?, status = ?
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [university_id, major, academic_year, gpa, cv_file, student_img, skills, status, id], 
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }

  // Delete student
  static delete(id) {
    const query = 'DELETE FROM Students WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Find students by university
  static findByUniversity(universityId) {
    const query = `
      SELECT s.*, u.full_name, u.email 
      FROM Students s
      JOIN Users u ON s.user_id = u.id
      WHERE s.university_id = ?
      ORDER BY s.created_at DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [universityId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }
}

export default Student;
