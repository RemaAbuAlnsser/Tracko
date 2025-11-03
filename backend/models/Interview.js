import db from '../config/database.js';

class Interview {
  // Create interviews table
  static createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS Interviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        student_id INT NOT NULL,
        internship_id INT NOT NULL,
        interview_date DATE NOT NULL,
        interview_time TIME NOT NULL,
        interview_location VARCHAR(500),
        interview_type ENUM('in-person', 'online', 'phone') DEFAULT 'in-person',
        notes TEXT,
        status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES Company(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
        FOREIGN KEY (internship_id) REFERENCES Internships(id) ON DELETE CASCADE
      )
    `;

    return new Promise((resolve, reject) => {
      db.query(query, (err, result) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Interviews table ready');
          resolve(result);
        }
      });
    });
  }

  // Create a new interview
  static create(interviewData) {
    const {
      company_id,
      student_id,
      internship_id,
      interview_date,
      interview_time,
      interview_location,
      interview_type,
      notes
    } = interviewData;

    const query = `
      INSERT INTO Interviews (
        company_id, student_id, internship_id, interview_date, 
        interview_time, interview_location, interview_type, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      db.query(
        query,
        [company_id, student_id, internship_id, interview_date, interview_time, interview_location, interview_type, notes],
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

  // Get interviews by student
  static getByStudent(studentId) {
    const query = `
      SELECT 
        i.*,
        c.name as company_name,
        c.logo as company_logo,
        int.title as internship_title
      FROM Interviews i
      JOIN Company c ON i.company_id = c.id
      JOIN Internships int ON i.internship_id = int.id
      WHERE i.student_id = ?
      ORDER BY i.interview_date DESC, i.interview_time DESC
    `;

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

  // Get interviews by company
  static getByCompany(companyId) {
    const query = `
      SELECT 
        i.*,
        s.id as student_id,
        u.full_name as student_name,
        u.email as student_email,
        s.student_img,
        int.title as internship_title
      FROM Interviews i
      JOIN Students s ON i.student_id = s.id
      JOIN Users u ON s.user_id = u.id
      JOIN Internships int ON i.internship_id = int.id
      WHERE i.company_id = ?
      ORDER BY i.interview_date DESC, i.interview_time DESC
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

  // Update interview status
  static updateStatus(id, status) {
    const query = 'UPDATE Interviews SET status = ? WHERE id = ?';

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

export default Interview;
