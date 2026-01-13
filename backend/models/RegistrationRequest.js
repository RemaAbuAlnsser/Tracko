import db from "../config/database.js";

class RegistrationRequest {
  // Create a new registration request
  static create(requestData) {
    const { full_name, email, password, user_type } = requestData;
    
    const query = `
      INSERT INTO Registration_Requests (full_name, email, password, user_type, status) 
      VALUES (?, ?, ?, ?, 'pending')
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [full_name, email, password, user_type], 
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

  // Get all registration requests
  static getAll(filters = {}) {
    let query = "SELECT * FROM Registration_Requests";
    const params = [];
    const conditions = [];
    
    if (filters.status) {
      conditions.push("status = ?");
      params.push(filters.status);
    }
    
    if (filters.user_type) {
      conditions.push("user_type = ?");
      params.push(filters.user_type);
    }
    
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    
    query += " ORDER BY created_at DESC";
    
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

  // Get pending requests count
  static getPendingCount() {
    const query = "SELECT COUNT(*) as count FROM Registration_Requests WHERE status = 'pending'";
    
    return new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].count);
        }
      });
    });
  }

  // Get request by ID
  static findById(id) {
    const query = "SELECT * FROM Registration_Requests WHERE id = ?";
    
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

  // Get request by email
  static findByEmail(email) {
    const query = "SELECT * FROM Registration_Requests WHERE email = ?";
    
    return new Promise((resolve, reject) => {
      db.query(query, [email], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  // Update request status
  static updateStatus(id, status) {
    const query = "UPDATE Registration_Requests SET status = ? WHERE id = ?";
    
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

  // Delete request
  static delete(id) {
    const query = "DELETE FROM Registration_Requests WHERE id = ?";
    
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

export default RegistrationRequest;
