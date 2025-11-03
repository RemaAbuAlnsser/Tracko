import db from "../config/database.js";

class University {
  // Create a new university
  static create(universityData) {
    const { 
      name, 
      email, 
      phone, 
      address, 
      website, 
      logo, 
      coordinator_name, 
      coordinator_phone
    } = universityData;
    
    // Extract domain from email
    const domain = email ? email.split('@')[1] : null;
    
    const query = `
      INSERT INTO Universities (name, email, domain, phone, address, website, logo, coordinator_name, coordinator_phone) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [name, email, domain, phone, address, website, logo, coordinator_name, coordinator_phone], 
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

  // Find university by ID
  static findById(id) {
    const query = "SELECT * FROM Universities WHERE id = ?";
    
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

  // Find university by email
  static findByEmail(email) {
    const query = "SELECT * FROM Universities WHERE email = ?";
    
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

  // Find university by domain (e.g., najah.com)
  static findByDomain(domain) {
    const query = "SELECT * FROM Universities WHERE domain = ?";
    
    return new Promise((resolve, reject) => {
      db.query(query, [domain], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  // Get all universities
  static getAll() {
    const query = "SELECT * FROM Universities ORDER BY name ASC";
    
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

  // Update university
  static update(id, universityData) {
    const { 
      name, 
      email, 
      phone, 
      address, 
      website, 
      logo, 
      coordinator_name, 
      coordinator_phone
    } = universityData;
    
    // Extract domain from email
    const domain = email ? email.split('@')[1] : null;
    
    const query = `
      UPDATE Universities 
      SET name = ?, email = ?, domain = ?, phone = ?, address = ?, 
          website = ?, logo = ?, coordinator_name = ?, coordinator_phone = ?
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [name, email, domain, phone, address, website, logo, coordinator_name, coordinator_phone, id], 
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

  // Delete university
  static delete(id) {
    const query = "DELETE FROM Universities WHERE id = ?";
    
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

  // Search universities by name
  static search(searchTerm) {
    const query = `
      SELECT * FROM Universities 
      WHERE name LIKE ? OR address LIKE ? 
      ORDER BY name ASC
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

}

export default University;
