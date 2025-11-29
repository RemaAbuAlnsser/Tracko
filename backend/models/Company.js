import db from "../config/database.js";

class Company {
  // Create a new company
  static create(companyData) {
    const { 
      name, 
      email, 
      phone, 
      industry, 
      address, 
      description, 
      website, 
      logo, 
      status = 'pending' 
    } = companyData;
    
    const query = `
      INSERT INTO Company (name, email, phone, industry, address, description, website, logo, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [name, email, phone, industry, address, description, website, logo, status], 
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

  // Find company by ID
  static findById(id) {
    const query = "SELECT * FROM Company WHERE id = ?";
    
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

  // Find company by email
  static findByEmail(email) {
    const query = "SELECT * FROM Company WHERE email = ?";
    
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

  // Get all companies
  static getAll(filters = {}) {
    let query = "SELECT * FROM Company";
    const params = [];
    
    // Add status filter if provided
    if (filters.status) {
      query += " WHERE status = ?";
      params.push(filters.status);
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

  // Update company
  static update(id, companyData) {
    const { 
      name, 
      email, 
      phone, 
      industry, 
      address, 
      description, 
      website, 
      logo, 
      status 
    } = companyData;
    
    const query = `
      UPDATE Company 
      SET name = ?, email = ?, phone = ?, industry = ?, address = ?, 
          description = ?, website = ?, logo = ?, status = ?
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [name, email, phone, industry, address, description, website, logo, status, id], 
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

  // Delete company
  static delete(id) {
    const query = "DELETE FROM Company WHERE id = ?";
    
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
    const query = "UPDATE Company SET status = ? WHERE id = ?";
    
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

  // Search companies by name or industry
  static search(searchTerm) {
    const query = `
      SELECT * FROM Company 
      WHERE name LIKE ? OR industry LIKE ? 
      ORDER BY created_at DESC
    `;
    const searchPattern = `%${searchTerm}%`;
    
    return new Promise((resolve, reject) => {
      db.query(query, [searchPattern, searchPattern], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Find company by email domain
  static findByDomain(domain) {
    const query = "SELECT * FROM Company WHERE email LIKE ?";
    const domainPattern = `%@${domain}`;
    
    return new Promise((resolve, reject) => {
      db.query(query, [domainPattern], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]); // Return first match
        }
      });
    });
  }
}

export default Company;
