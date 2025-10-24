import db from "../config/database.js";

class InternshipPlan {
  // Create tables if they don't exist
  static async createTables() {
    return new Promise((resolve, reject) => {
      const createPlansTable = `
        CREATE TABLE IF NOT EXISTS Internship_Plans (
          id INT AUTO_INCREMENT PRIMARY KEY,
          internship_id INT NOT NULL,
          trainer_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          duration_weeks INT NOT NULL,
          start_date DATE,
          end_date DATE,
          status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (internship_id) REFERENCES Internships(id) ON DELETE CASCADE,
          FOREIGN KEY (trainer_id) REFERENCES Trainers(id) ON DELETE CASCADE,
          INDEX idx_internship_id (internship_id),
          INDEX idx_trainer_id (trainer_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      const createWeeksTable = `
        CREATE TABLE IF NOT EXISTS Plan_Weeks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          plan_id INT NOT NULL,
          week_number INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          objectives TEXT,
          tasks TEXT,
          resources TEXT,
          deliverables TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (plan_id) REFERENCES Internship_Plans(id) ON DELETE CASCADE,
          INDEX idx_plan_id (plan_id),
          UNIQUE KEY unique_plan_week (plan_id, week_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      db.query(createPlansTable, (err1) => {
        if (err1) {
          console.error('❌ Error creating Internship_Plans table:', err1);
          return reject(err1);
        }
        console.log('✅ Internship_Plans table ready');

        db.query(createWeeksTable, (err2) => {
          if (err2) {
            console.error('❌ Error creating Plan_Weeks table:', err2);
            return reject(err2);
          }
          console.log('✅ Plan_Weeks table ready');
          resolve();
        });
      });
    });
  }

  // Create a new plan
  static create(planData) {
    return new Promise((resolve, reject) => {
      const { 
        internship_id, 
        trainer_id, 
        title, 
        description, 
        duration_weeks,
        start_date,
        end_date,
        status = 'draft'
      } = planData;

      const query = `
        INSERT INTO Internship_Plans 
        (internship_id, trainer_id, title, description, duration_weeks, start_date, end_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        query,
        [internship_id, trainer_id, title, description, duration_weeks, start_date, end_date, status],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Get plan by ID with weeks
  static findById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          p.*,
          i.title as internship_title,
          i.description as internship_description,
          c.name as company_name,
          t.specialization as trainer_specialization,
          u.full_name as trainer_name
        FROM Internship_Plans p
        LEFT JOIN Internships i ON p.internship_id = i.id
        LEFT JOIN Company c ON i.company_id = c.id
        LEFT JOIN Trainers t ON p.trainer_id = t.id
        LEFT JOIN Users u ON t.user_id = u.id
        WHERE p.id = ?
      `;

      db.query(query, [id], (err, results) => {
        if (err) {
          reject(err);
        } else if (results.length === 0) {
          resolve(null);
        } else {
          const plan = results[0];
          
          // Get weeks for this plan
          const weeksQuery = `
            SELECT * FROM Plan_Weeks 
            WHERE plan_id = ? 
            ORDER BY week_number ASC
          `;
          
          db.query(weeksQuery, [id], (err2, weeks) => {
            if (err2) {
              reject(err2);
            } else {
              plan.weeks = weeks;
              resolve(plan);
            }
          });
        }
      });
    });
  }

  // Get all plans by trainer
  static findByTrainerId(trainerId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          p.*,
          i.title as internship_title,
          c.name as company_name,
          (SELECT COUNT(*) FROM Plan_Weeks WHERE plan_id = p.id) as weeks_count
        FROM Internship_Plans p
        LEFT JOIN Internships i ON p.internship_id = i.id
        LEFT JOIN Company c ON i.company_id = c.id
        WHERE p.trainer_id = ?
        ORDER BY p.created_at DESC
      `;

      db.query(query, [trainerId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get plans by internship
  static findByInternshipId(internshipId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          p.*,
          t.specialization as trainer_specialization,
          u.full_name as trainer_name,
          (SELECT COUNT(*) FROM Plan_Weeks WHERE plan_id = p.id) as weeks_count
        FROM Internship_Plans p
        LEFT JOIN Trainers t ON p.trainer_id = t.id
        LEFT JOIN Users u ON t.user_id = u.id
        WHERE p.internship_id = ?
        ORDER BY p.created_at DESC
      `;

      db.query(query, [internshipId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Update plan
  static update(id, planData) {
    return new Promise((resolve, reject) => {
      const { 
        title, 
        description, 
        duration_weeks,
        start_date,
        end_date,
        status
      } = planData;

      const query = `
        UPDATE Internship_Plans 
        SET title = ?, description = ?, duration_weeks = ?, 
            start_date = ?, end_date = ?, status = ?
        WHERE id = ?
      `;

      db.query(
        query,
        [title, description, duration_weeks, start_date, end_date, status, id],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Delete plan
  static delete(id) {
    return new Promise((resolve, reject) => {
      const query = "DELETE FROM Internship_Plans WHERE id = ?";
      
      db.query(query, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Add week to plan
  static addWeek(weekData) {
    return new Promise((resolve, reject) => {
      const { 
        plan_id, 
        week_number, 
        title, 
        description, 
        objectives,
        tasks,
        resources,
        deliverables
      } = weekData;

      const query = `
        INSERT INTO Plan_Weeks 
        (plan_id, week_number, title, description, objectives, tasks, resources, deliverables)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        query,
        [plan_id, week_number, title, description, objectives, tasks, resources, deliverables],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Update week
  static updateWeek(weekId, weekData) {
    return new Promise((resolve, reject) => {
      const { 
        title, 
        description, 
        objectives,
        tasks,
        resources,
        deliverables
      } = weekData;

      const query = `
        UPDATE Plan_Weeks 
        SET title = ?, description = ?, objectives = ?, 
            tasks = ?, resources = ?, deliverables = ?
        WHERE id = ?
      `;

      db.query(
        query,
        [title, description, objectives, tasks, resources, deliverables, weekId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Delete week
  static deleteWeek(weekId) {
    return new Promise((resolve, reject) => {
      const query = "DELETE FROM Plan_Weeks WHERE id = ?";
      
      db.query(query, [weekId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Get weeks for a plan
  static getWeeks(planId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM Plan_Weeks 
        WHERE plan_id = ? 
        ORDER BY week_number ASC
      `;

      db.query(query, [planId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
}

export default InternshipPlan;
