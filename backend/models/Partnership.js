import db from "../config/database.js";

class Partnership {
  // Create a new partnership
  static create(partnershipData) {
    const { 
      university_id, 
      company_id, 
      agreement_date, 
      agreement_end_date, 
      agreement_duration, 
      status = 'pending',
      contact_person_university,
      contact_person_company,
      terms_and_conditions,
      training_hours
    } = partnershipData;
    
    const query = `
      INSERT INTO University_Company_Partnerships 
      (university_id, company_id, agreement_date, agreement_end_date, agreement_duration, 
       status, contact_person_university, contact_person_company, terms_and_conditions, training_hours) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [university_id, company_id, agreement_date, agreement_end_date, agreement_duration, 
         status, contact_person_university, contact_person_company, terms_and_conditions, training_hours], 
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

  // Find partnership by ID
  static findById(id) {
    const query = `
      SELECT p.*, 
             u.name as university_name, u.email as university_email, u.coordinator_name as university_coordinator,
             c.name as company_name, c.email as company_email, c.logo as company_logo, c.coordinator_name as company_coordinator
      FROM University_Company_Partnerships p
      LEFT JOIN Universities u ON p.university_id = u.id
      LEFT JOIN Company c ON p.company_id = c.id
      WHERE p.id = ?
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

  // Get all partnerships
  static getAll(filters = {}) {
    let query = `
      SELECT p.*, 
             u.name as university_name, u.email as university_email, u.coordinator_name as university_coordinator,
             c.name as company_name, c.email as company_email, c.logo as company_logo, c.coordinator_name as company_coordinator
      FROM University_Company_Partnerships p
      LEFT JOIN Universities u ON p.university_id = u.id
      LEFT JOIN Company c ON p.company_id = c.id
    `;
    const params = [];
    const conditions = [];
    
    if (filters.status) {
      conditions.push("p.status = ?");
      params.push(filters.status);
    }
    
    if (filters.university_id) {
      conditions.push("p.university_id = ?");
      params.push(filters.university_id);
    }
    
    if (filters.company_id) {
      conditions.push("p.company_id = ?");
      params.push(filters.company_id);
    }
    
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    
    query += " ORDER BY p.agreement_date DESC";
    
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

  // Get partnerships by university ID
  static getByUniversityId(universityId) {
    const query = `
      SELECT p.*, 
             c.name as company_name, c.email as company_email, 
             c.logo as company_logo, c.industry, c.phone as company_phone, c.coordinator_name as company_coordinator,
             u.coordinator_name as university_coordinator
      FROM University_Company_Partnerships p
      LEFT JOIN Company c ON p.company_id = c.id
      LEFT JOIN Universities u ON p.university_id = u.id
      WHERE p.university_id = ?
      ORDER BY p.agreement_date DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [universityId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          console.log('📋 Partnerships with coordinators:', results.map(r => ({
            id: r.id,
            company_name: r.company_name,
            university_coordinator: r.university_coordinator,
            company_coordinator: r.company_coordinator
          })));
          resolve(results);
        }
      });
    });
  }

  // Get partnerships by company ID
  static getByCompanyId(companyId) {
    const query = `
      SELECT p.*, 
             u.name as university_name, u.email as university_email,
             u.phone as university_phone, u.coordinator_name
      FROM University_Company_Partnerships p
      LEFT JOIN Universities u ON p.university_id = u.id
      WHERE p.company_id = ?
      ORDER BY p.agreement_date DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [companyId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Update partnership
  static update(id, partnershipData) {
    const { 
      university_id, 
      company_id, 
      agreement_date, 
      agreement_end_date, 
      agreement_duration, 
      status,
      contact_person_university,
      contact_person_company,
      terms_and_conditions,
      training_hours
    } = partnershipData;
    
    const query = `
      UPDATE University_Company_Partnerships 
      SET university_id = ?, company_id = ?, agreement_date = ?, agreement_end_date = ?, 
          agreement_duration = ?, status = ?, contact_person_university = ?, 
          contact_person_company = ?, terms_and_conditions = ?, training_hours = ?
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [university_id, company_id, agreement_date, agreement_end_date, agreement_duration, 
         status, contact_person_university, contact_person_company, terms_and_conditions, training_hours, id], 
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

  // Update status only
  static updateStatus(id, status) {
    const query = "UPDATE University_Company_Partnerships SET status = ? WHERE id = ?";
    
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

  // Delete partnership
  static delete(id) {
    const query = "DELETE FROM University_Company_Partnerships WHERE id = ?";
    
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

  // Check if partnership exists
  static checkExists(universityId, companyId) {
    const query = `
      SELECT * FROM University_Company_Partnerships 
      WHERE university_id = ? AND company_id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [universityId, companyId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results.length > 0 ? results[0] : null);
        }
      });
    });
  }

  // Get active partnerships count for university
  static getActiveCountByUniversity(universityId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM University_Company_Partnerships 
      WHERE university_id = ? AND status = 'active'
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [universityId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].count);
        }
      });
    });
  }

  // Get active partnerships count for company
  static getActiveCountByCompany(companyId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM University_Company_Partnerships 
      WHERE company_id = ? AND status = 'active'
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [companyId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].count);
        }
      });
    });
  }
}

export default Partnership;
