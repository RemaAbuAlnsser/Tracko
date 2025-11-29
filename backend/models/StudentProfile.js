import db from "../config/database.js";

class StudentProfile {
  // Create students table
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS student_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        major VARCHAR(255),
        academic_year VARCHAR(50),
        gpa DECIMAL(3,2),
        skills TEXT,
        phone VARCHAR(20),
        profile_image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_profile (user_id)
      )
    `;
    
    try {
      await db.execute(query);
      console.log("✅ Student profiles table ready");
    } catch (error) {
      console.error("❌ Error creating student profiles table:", error);
      throw error;
    }
  }

  // Get student profile by user_id
  static async getByUserId(userId) {
    const query = `
      SELECT sp.*, u.full_name, u.email, u.user_type 
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.user_id = ?
    `;
    
    try {
      const result = await db.execute(query, [userId]);
      console.log("Get profile result:", result);
      return result[0] && result[0][0] ? result[0][0] : null;
    } catch (error) {
      console.error("Error getting student profile:", error);
      throw error;
    }
  }

  // Create or update student profile
  static async upsert(userId, profileData) {
    const { major, academic_year, gpa, skills, phone } = profileData;
    
    const query = `
      INSERT INTO student_profiles (user_id, major, academic_year, gpa, skills, phone)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        major = VALUES(major),
        academic_year = VALUES(academic_year),
        gpa = VALUES(gpa),
        skills = VALUES(skills),
        phone = VALUES(phone),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    try {
      const result = await db.execute(query, [userId, major, academic_year, gpa, skills, phone]);
      console.log("Upsert result:", result);
      return result;
    } catch (error) {
      console.error("Error upserting student profile:", error);
      throw error;
    }
  }

  // Update user basic info (name, email)
  static updateUserInfo(userId, userData) {
    const { full_name, email } = userData;
    
    const query = `
      UPDATE users 
      SET full_name = ?, email = ?
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [full_name, email, userId], (err, result) => {
        if (err) {
          console.error("Error updating user info:", err);
          reject(err);
        } else {
          console.log("Update user result:", result);
          resolve(result);
        }
      });
    });
  }
}

export default StudentProfile;
