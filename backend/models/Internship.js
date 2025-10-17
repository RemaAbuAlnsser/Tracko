import db from "../config/database.js";

class Internship {
  // Create new internship
  static create(internshipData) {
    return new Promise((resolve, reject) => {
      const { company_id, title, description, requirements, specialization, capacity, status } = internshipData;
      
      const query = `
        INSERT INTO Internships (company_id, title, description, requirements, specialization, capacity, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.query(
        query,
        [company_id, title, description, requirements, specialization, capacity || 1, status || 'open'],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Find all internships
  static findAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT i.*, c.name as company_name, c.logo as company_logo
        FROM Internships i
        LEFT JOIN Company c ON i.company_id = c.id
        ORDER BY i.created_at DESC
      `;
      
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Find internships by company ID
  static findByCompanyId(companyId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM Internships
        WHERE company_id = ?
        ORDER BY created_at DESC
      `;
      
      db.query(query, [companyId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Find internship by ID
  static findById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT i.*, c.name as company_name, c.logo as company_logo
        FROM Internships i
        LEFT JOIN Company c ON i.company_id = c.id
        WHERE i.id = ?
      `;
      
      db.query(query, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  // Update internship
  static update(id, internshipData) {
    return new Promise((resolve, reject) => {
      const { title, description, requirements, specialization, capacity, status } = internshipData;
      
      const query = `
        UPDATE Internships
        SET title = ?, description = ?, requirements = ?, specialization = ?, capacity = ?, status = ?
        WHERE id = ?
      `;
      
      db.query(
        query,
        [title, description, requirements, specialization, capacity, status, id],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Delete internship
  static delete(id) {
    return new Promise((resolve, reject) => {
      const query = "DELETE FROM Internships WHERE id = ?";
      
      db.query(query, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Update status
  static updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      const query = "UPDATE Internships SET status = ? WHERE id = ?";
      
      db.query(query, [status, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

export default Internship;
