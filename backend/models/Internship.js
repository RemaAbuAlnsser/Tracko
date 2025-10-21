import db from "../config/database.js";

class Internship {
  // Create new internship
  static create(internshipData) {
    return new Promise((resolve, reject) => {
      const { company_id, title, description, requirements, specialization, capacity, status, min_gpa, work_mode } = internshipData;
      
      const query = `
        INSERT INTO Internships (company_id, title, description, requirements, specialization, capacity, status, min_gpa, work_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.query(
        query,
        [company_id, title, description, requirements, specialization, capacity || 1, status || 'open', min_gpa || null, work_mode || null],
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
        SELECT i.*, c.name as company_name, c.logo as company_logo, c.industry
        FROM Internships i
        LEFT JOIN Company c ON i.company_id = c.id
        WHERE i.id = ?
      `;
      
      console.log('🔍 Executing query for internship ID:', id);
      
      db.query(query, [id], (err, results) => {
        if (err) {
          console.error('❌ Query error:', err);
          reject(err);
        } else {
          console.log('✅ Query results:', results);
          resolve(results[0]);
        }
      });
    });
  }

  // Update internship
  static update(id, internshipData) {
    return new Promise((resolve, reject) => {
      const { title, description, requirements, specialization, capacity, status, min_gpa, work_mode } = internshipData;
      
      const query = `
        UPDATE Internships
        SET title = ?, description = ?, requirements = ?, specialization = ?, capacity = ?, status = ?, min_gpa = ?, work_mode = ?
        WHERE id = ?
      `;
      
      db.query(
        query,
        [title, description, requirements, specialization, capacity, status, min_gpa || null, work_mode || null, id],
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

  // Find internships for student based on university partnerships
  static findByStudentUniversity(universityId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT i.*, c.name as company_name, c.logo as company_logo, c.industry
        FROM Internships i
        INNER JOIN Company c ON i.company_id = c.id
        INNER JOIN University_Company_Partnerships p ON c.id = p.company_id
        WHERE p.university_id = ? AND p.status = 'active' AND i.status = 'open'
        ORDER BY i.created_at DESC
      `;
      
      db.query(query, [universityId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
}

export default Internship;
