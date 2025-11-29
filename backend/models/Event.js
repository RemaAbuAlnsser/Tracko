import db from "../config/database.js";

class Event {
  // Create events table if not exists
  static async createTable() {
    const eventsQuery = `
      CREATE TABLE IF NOT EXISTS Events (
        id INT PRIMARY KEY AUTO_INCREMENT,
        trainer_id INT NOT NULL,
        internship_id INT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_type ENUM('training', 'meeting', 'review', 'workshop', 'other') DEFAULT 'training',
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE CASCADE,
        FOREIGN KEY (internship_id) REFERENCES Internships(id) ON DELETE CASCADE
      )
    `;
    
    const eventStudentsQuery = `
      CREATE TABLE IF NOT EXISTS Event_Students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        event_id INT NOT NULL,
        student_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
        UNIQUE KEY unique_event_student (event_id, student_id)
      )
    `;
    
    return new Promise((resolve, reject) => {
      db.query(eventsQuery, (err, result) => {
        if (err) return reject(err);
        
        db.query(eventStudentsQuery, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    });
  }

  // Create a new event with multiple students
  static async create(eventData) {
    const { trainer_id, internship_id, student_ids, title, description, event_type, start_time, end_time } = eventData;
    
    const eventQuery = `
      INSERT INTO Events (trainer_id, internship_id, title, description, event_type, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        eventQuery,
        [trainer_id, internship_id || null, title, description, event_type, start_time, end_time],
        (err, result) => {
          if (err) return reject(err);
          
          const eventId = result.insertId;
          
          // If student_ids provided, insert into Event_Students
          if (student_ids && student_ids.length > 0) {
            const values = student_ids.map(sid => [eventId, sid]);
            const studentQuery = 'INSERT INTO Event_Students (event_id, student_id) VALUES ?';
            
            db.query(studentQuery, [values], (err) => {
              if (err) return reject(err);
              resolve({ id: eventId, ...eventData });
            });
          } else {
            resolve({ id: eventId, ...eventData });
          }
        }
      );
    });
  }

  // Get all events for a trainer with students
  static async getByTrainerId(trainerId) {
    const query = `
      SELECT 
        e.*,
        i.title as internship_title,
        GROUP_CONCAT(DISTINCT CONCAT(s.id, ':', u.full_name) SEPARATOR '||') as students_data
      FROM Events e
      LEFT JOIN Internships i ON e.internship_id = i.id
      LEFT JOIN Event_Students es ON e.id = es.event_id
      LEFT JOIN Students s ON es.student_id = s.id
      LEFT JOIN Users u ON s.user_id = u.id
      WHERE e.trainer_id = ?
      GROUP BY e.id
      ORDER BY e.start_time DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [trainerId], (err, results) => {
        if (err) return reject(err);
        
        // Parse students data
        const events = results.map(event => {
          const students = [];
          if (event.students_data) {
            event.students_data.split('||').forEach(studentData => {
              const [id, name] = studentData.split(':');
              if (id && name) {
                students.push({ id: parseInt(id), name });
              }
            });
          }
          
          return {
            ...event,
            students,
            students_data: undefined
          };
        });
        
        resolve(events);
      });
    });
  }

  // Get all events for a student
  static async getByStudentId(studentId) {
    const query = `
      SELECT 
        e.*,
        t.id as trainer_id,
        u.full_name as trainer_name,
        u.email as trainer_email
      FROM Events e
      INNER JOIN Trainers t ON e.trainer_id = t.id
      INNER JOIN Users u ON t.user_id = u.id
      WHERE e.student_id = ? OR e.student_id IS NULL
      ORDER BY e.start_time DESC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [studentId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get event by ID
  static async getById(id) {
    const query = `
      SELECT 
        e.*,
        t.id as trainer_id,
        tu.full_name as trainer_name,
        s.id as student_id,
        su.full_name as student_name
      FROM Events e
      INNER JOIN Trainers t ON e.trainer_id = t.id
      INNER JOIN Users tu ON t.user_id = tu.id
      LEFT JOIN Students s ON e.student_id = s.id
      LEFT JOIN Users su ON s.user_id = su.id
      WHERE e.id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  // Update event
  static async update(id, eventData) {
    const { title, description, event_type, start_time, end_time, status } = eventData;
    
    const query = `
      UPDATE Events 
      SET title = ?, description = ?, event_type = ?, start_time = ?, end_time = ?, status = ?
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query,
        [title, description, event_type, start_time, end_time, status, id],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Delete event
  static async delete(id) {
    const query = 'DELETE FROM Events WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Get upcoming events for trainer
  static async getUpcomingByTrainerId(trainerId) {
    const query = `
      SELECT 
        e.*,
        i.title as internship_title,
        GROUP_CONCAT(DISTINCT CONCAT(s.id, ':', u.full_name) SEPARATOR '||') as students_data
      FROM Events e
      LEFT JOIN Internships i ON e.internship_id = i.id
      LEFT JOIN Event_Students es ON e.id = es.event_id
      LEFT JOIN Students s ON es.student_id = s.id
      LEFT JOIN Users u ON s.user_id = u.id
      WHERE e.trainer_id = ? AND e.start_time >= NOW() AND e.status = 'scheduled'
      GROUP BY e.id
      ORDER BY e.start_time ASC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [trainerId], (err, results) => {
        if (err) return reject(err);
        
        // Parse students data
        const events = results.map(event => {
          const students = [];
          if (event.students_data) {
            event.students_data.split('||').forEach(studentData => {
              const [id, name] = studentData.split(':');
              if (id && name) {
                students.push({ id: parseInt(id), name });
              }
            });
          }
          
          return {
            ...event,
            students,
            students_data: undefined
          };
        });
        
        resolve(events);
      });
    });
  }

  // Get upcoming events for student
  static async getUpcomingByStudentId(studentId) {
    const query = `
      SELECT 
        e.*,
        t.id as trainer_id,
        u.full_name as trainer_name,
        u.email as trainer_email
      FROM Events e
      INNER JOIN Trainers t ON e.trainer_id = t.id
      INNER JOIN Users u ON t.user_id = u.id
      WHERE (e.student_id = ? OR e.student_id IS NULL) 
        AND e.start_time >= NOW() 
        AND e.status = 'scheduled'
      ORDER BY e.start_time ASC
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [studentId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
}

export default Event;
