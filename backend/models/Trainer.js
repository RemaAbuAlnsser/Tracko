import db from "../config/database.js";

class Trainer {
  // Create a new trainer
  static create(trainerData) {
    const { 
      company_id,
      internship_id = null,
      user_id,
      specialization = null,
      experience_years = null,
      bio = null,
      linkedin_url = null,
      github_url = null,
      hourly_rate = null,
      max_trainees = 5,
      status = 'active'
    } = trainerData;
    
    const query = `
      INSERT INTO Trainers (company_id, internship_id, user_id, specialization, experience_years, bio, linkedin_url, github_url, hourly_rate, max_trainees, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [company_id, internship_id, user_id, specialization, experience_years, bio, linkedin_url, github_url, hourly_rate, max_trainees, status], 
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

  // Find trainer by ID
  static findById(id) {
    const query = "SELECT * FROM Trainers WHERE id = ?";
    
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

  // Find trainer by user_id
  static findByUserId(user_id) {
    const query = "SELECT * FROM Trainers WHERE user_id = ?";
    
    return new Promise((resolve, reject) => {
      db.query(query, [user_id], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  // Find trainers by company_id
  static findByCompanyId(company_id) {
    const query = `
      SELECT t.*, u.full_name, u.email 
      FROM Trainers t
      JOIN Users u ON t.user_id = u.id
      WHERE t.company_id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [company_id], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Get all trainers
  static getAll(filters = {}) {
    let query = `
      SELECT t.*, u.full_name, u.email, c.name as company_name
      FROM Trainers t
      JOIN Users u ON t.user_id = u.id
      JOIN Company c ON t.company_id = c.id
    `;
    const params = [];
    
    // Add status filter if provided
    if (filters.status) {
      query += " WHERE t.status = ?";
      params.push(filters.status);
    }
    
    query += " ORDER BY t.created_at DESC";
    
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Update trainer
  static update(id, trainerData) {
    const { 
      specialization,
      experience_years,
      bio,
      linkedin_url,
      github_url,
      hourly_rate,
      max_trainees,
      status,
      internship_id
    } = trainerData;
    
    const query = `
      UPDATE Trainers 
      SET specialization = ?, experience_years = ?, bio = ?, 
          linkedin_url = ?, github_url = ?, hourly_rate = ?, 
          max_trainees = ?, status = ?, internship_id = ?
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [specialization, experience_years, bio, linkedin_url, github_url, 
         hourly_rate, max_trainees, status, internship_id, id], 
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

  // Delete trainer
  static delete(id) {
    const query = "DELETE FROM Trainers WHERE id = ?";
    
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

  // Update status only
  static updateStatus(id, status) {
    const query = "UPDATE Trainers SET status = ? WHERE id = ?";
    
    return new Promise((resolve, reject) => {
      db.query(query, [status, id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}

export default Trainer;
