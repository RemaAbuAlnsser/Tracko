import db from "../config/database.js";
import bcrypt from "bcrypt";

class User {
  // Create a new user
  static async create(userData) {
    const { full_name, email, password, user_type } = userData;
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const query = `
      INSERT INTO Users (full_name, email, password, user_type) 
      VALUES (?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [full_name, email, hashedPassword, user_type], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Find user by email
  static findByEmail(email) {
    const query = "SELECT * FROM Users WHERE email = ?";
    
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

  // Find user by ID
  static findById(id) {
    const query = "SELECT * FROM Users WHERE id = ?";
    
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

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Get all users (for admin purposes)
  static getAll() {
    const query = "SELECT id, full_name, email, user_type, created_at FROM Users";
    
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
}

export default User;
