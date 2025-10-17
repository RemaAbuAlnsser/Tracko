import db from "../config/database.js";

class CV {
  // Create a new CV record
  static create(cvData) {
    const { 
      student_id,
      cv_file,
      analysis_data = null
    } = cvData;
    
    const query = `
      INSERT INTO CVs (student_id, cv_file, analysis_data) 
      VALUES (?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [student_id, cv_file, JSON.stringify(analysis_data)], 
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

  // Find CV by student ID
  static findByStudentId(studentId) {
    const query = "SELECT * FROM CVs WHERE student_id = ? ORDER BY uploaded_at DESC LIMIT 1";
    
    return new Promise((resolve, reject) => {
      db.query(query, [studentId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  // Find CV by ID
  static findById(id) {
    const query = "SELECT * FROM CVs WHERE id = ?";
    
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

  // Get all CVs for a student
  static getAllByStudentId(studentId) {
    const query = "SELECT * FROM CVs WHERE student_id = ? ORDER BY uploaded_at DESC";
    
    return new Promise((resolve, reject) => {
      db.query(query, [studentId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Update CV analysis data
  static updateAnalysis(id, analysisData) {
    const query = `
      UPDATE CVs 
      SET analysis_data = ?
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [JSON.stringify(analysisData), id], 
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

  // Delete CV
  static delete(id) {
    const query = "DELETE FROM CVs WHERE id = ?";
    
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
}

export default CV;
